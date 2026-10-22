import os
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "shuttlemetrics_model.joblib"

app = FastAPI(title="ShuttleMetrics Prediction API", version="1.0.0")

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "https://shuttle-metrics-rlvq.vercel.app",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

_bundle: dict[str, Any] | None = None


def get_bundle() -> dict[str, Any]:
    global _bundle
    if _bundle is None:
        if not MODEL_PATH.exists():
            raise HTTPException(status_code=503, detail="Prediction model file is missing.")
        try:
            loaded = joblib.load(MODEL_PATH)
            required = {"model", "feature_cols", "player_history", "h2h_history"}
            if not isinstance(loaded, dict) or not required.issubset(loaded):
                raise ValueError("The model bundle does not contain the expected prediction data.")
            _bundle = loaded
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=503, detail=f"Could not load prediction model: {exc}") from exc
    return _bundle


class PredictionRequest(BaseModel):
    player1: str = Field(min_length=1, max_length=160)
    player2: str = Field(min_length=1, max_length=160)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "ShuttleMetrics Prediction API"}


@app.get("/players")
def players() -> dict[str, list[str]]:
    bundle = get_bundle()
    return {"players": sorted(bundle["player_history"].keys())}



@app.get("/recommendations")
def recommendations(player: str) -> dict[str, Any]:
    """Rank historical players for three matchup goals using existing model history."""
    bundle = get_bundle()
    history = bundle["player_history"]
    selected = player.strip()
    if selected not in history:
        raise HTTPException(status_code=422, detail=f"{selected} is not in the model's historical player list.")

    def stats(name: str) -> dict[str, Any]:
        row = history[name]
        win_rate = row["wins"] / row["played"] if row["played"] else 0.5
        recent_form = sum(row["recent"]) / len(row["recent"]) if row["recent"] else 0.5
        # Equal weighting keeps the recommendation interpretable and uses only existing history.
        strength = (win_rate + recent_form) / 2
        return {
            "name": name,
            "previous_win_rate": round(float(win_rate) * 100, 1),
            "recent_form": round(float(recent_form) * 100, 1),
            "strength_score": round(float(strength) * 100, 1),
        }

    base = stats(selected)
    others = [stats(name) for name in history if name != selected]
    own_score = base["strength_score"]
    competitive = sorted(others, key=lambda item: (abs(item["strength_score"] - own_score), item["name"]))[:3]
    favorable = sorted(
        [item for item in others if item["strength_score"] < own_score],
        key=lambda item: (own_score - item["strength_score"], item["name"]),
    )[:3]
    challenging = sorted(
        [item for item in others if item["strength_score"] > own_score],
        key=lambda item: (item["strength_score"] - own_score, item["name"]),
    )[:3]
    return {
        "player": base,
        "competitive": competitive,
        "favorable": favorable,
        "challenging": challenging,
        "method": "Historical previous win rate and recent form, equally weighted. Recommendations are descriptive, not guarantees.",
    }


@app.post("/predict")
def predict(request: PredictionRequest) -> dict[str, Any]:
    bundle = get_bundle()
    history = bundle["player_history"]
    h2h_history = bundle["h2h_history"]
    p1 = request.player1.strip()
    p2 = request.player2.strip()

    if p1 not in history:
        raise HTTPException(status_code=422, detail=f"{p1} is not in the model's historical player list.")
    if p2 not in history:
        raise HTTPException(status_code=422, detail=f"{p2} is not in the model's historical player list.")
    if p1 == p2:
        raise HTTPException(status_code=422, detail="Choose two different players.")

    s1, s2 = history[p1], history[p2]
    rate1 = s1["wins"] / s1["played"] if s1["played"] else 0.5
    rate2 = s2["wins"] / s2["played"] if s2["played"] else 0.5
    form1 = sum(s1["recent"]) / len(s1["recent"]) if s1["recent"] else 0.5
    form2 = sum(s2["recent"]) / len(s2["recent"]) if s2["recent"] else 0.5
    h2h = h2h_history.get((p1, p2), [0, 0])
    h2h_rate = h2h[0] / sum(h2h) if sum(h2h) else 0.5

    feature_values = {
        "team1_previous_win_rate": rate1,
        "team2_previous_win_rate": rate2,
        "team1_recent_form": form1,
        "team2_recent_form": form2,
        "team1_h2h_win_rate": h2h_rate,
    }
    feature_cols = bundle["feature_cols"]
    try:
        features = pd.DataFrame([[feature_values[column] for column in feature_cols]], columns=feature_cols)
        model = bundle["model"]
        predicted_class = int(model.predict(features)[0])
        predicted_winner = p1 if predicted_class == 1 else p2
        confidence = None
        if hasattr(model, "predict_proba"):
            probabilities = model.predict_proba(features)[0]
            classes = list(model.classes_)
            if predicted_class in classes:
                confidence = round(float(probabilities[classes.index(predicted_class)]) * 100, 1)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc

    return {
        "player1": p1,
        "player2": p2,
        "predicted_winner": predicted_winner,
        "confidence_percent": confidence,
        "player1_previous_win_rate": round(float(rate1) * 100, 1),
        "player2_previous_win_rate": round(float(rate2) * 100, 1),
        "player1_recent_form": round(float(form1) * 100, 1),
        "player2_recent_form": round(float(form2) * 100, 1),
        "head_to_head_player1_win_rate": round(float(h2h_rate) * 100, 1),
        "disclaimer": "Statistical estimate based on historical data, not a guarantee of the match outcome.",
    }
