
import sqlite3
from pathlib import Path

import joblib
import pandas as pd
import streamlit as st

st.set_page_config(
    page_title="ShuttleMetrics",
    page_icon="🏸",
    layout="wide",
)

DB_PATH = "shuttlemetrics.db"
MODEL_PATH = Path(__file__).parent / "shuttlemetrics_model.joblib"


# ---------------- DATABASE ----------------

def connect_db():
    return sqlite3.connect(DB_PATH)


def initialize_db():
    with connect_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS players (
                player_id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                age INTEGER,
                playing_style TEXT,
                skill_level TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS matches (
                match_id INTEGER PRIMARY KEY AUTOINCREMENT,
                player_id INTEGER NOT NULL,
                match_date TEXT NOT NULL,
                opponent TEXT,
                result TEXT NOT NULL,
                unforced_errors INTEGER,
                forced_errors INTEGER,
                smash_winners INTEGER,
                notes TEXT,
                FOREIGN KEY (player_id) REFERENCES players(player_id)
            )
        """)

        columns = {
            row[1] for row in
            conn.execute("PRAGMA table_info(matches)").fetchall()
        }
        if "forced_errors" not in columns:
            conn.execute(
                "ALTER TABLE matches ADD COLUMN forced_errors INTEGER"
            )


initialize_db()


def load_players():
    with connect_db() as conn:
        return pd.read_sql_query(
            "SELECT * FROM players ORDER BY name", conn
        )


def load_matches(player_id):
    with connect_db() as conn:
        return pd.read_sql_query("""
            SELECT match_date, opponent, result,
                   unforced_errors, forced_errors, smash_winners, notes
            FROM matches
            WHERE player_id = ?
            ORDER BY match_date, match_id
        """, conn, params=(player_id,))


def get_model_bundle():
    if not MODEL_PATH.exists():
        return None
    try:
        return joblib.load(MODEL_PATH)
    except Exception as exc:
        st.error(f"Could not load prediction model: {exc}")
        return None


# ---------------- SIDEBAR ----------------

st.sidebar.title("🏸 ShuttleMetrics")
page = st.sidebar.radio(
    "Choose a feature",
    [
        "Home",
        "Register Player",
        "Record Match",
        "Player Portfolio",
        "Match Prediction",
    ],
)

st.title("🏸 ShuttleMetrics")
st.caption("Badminton Player Performance Analyzer")


# ---------------- HOME ----------------

if page == "Home":
    st.subheader("Welcome!")
    st.write(
        "Track individual badminton players, record match statistics, "
        "review performance trends, and explore historical match predictions."
    )

    players = load_players()

    with connect_db() as conn:
        total_matches = conn.execute(
            "SELECT COUNT(*) FROM matches"
        ).fetchone()[0]

    a, b = st.columns(2)
    a.metric("Registered players", len(players))
    b.metric("Matches recorded", total_matches)

    st.info(
        "Start by registering a player, then record each match "
        "to build that player's portfolio."
    )


# ---------------- REGISTER PLAYER ----------------

elif page == "Register Player":
    st.subheader("Create a Player Portfolio")

    with st.form("register_player", clear_on_submit=True):
        name = st.text_input("Player name")
        age = st.number_input("Age", min_value=5, max_value=100, value=18)
        style = st.selectbox(
            "Playing style", ["Attacking", "Defensive", "All-round"]
        )
        level = st.selectbox(
            "Skill level", ["Beginner", "Intermediate", "Advanced"]
        )
        submit = st.form_submit_button("Create portfolio")

    if submit:
        if not name.strip():
            st.error("Please enter a player name.")
        else:
            with connect_db() as conn:
                conn.execute("""
                    INSERT INTO players (name, age, playing_style, skill_level)
                    VALUES (?, ?, ?, ?)
                """, (name.strip(), age, style, level))
            st.success(f"Portfolio created for {name.strip()}!")


# ---------------- RECORD MATCH ----------------

elif page == "Record Match":
    st.subheader("Record a Match")
    players = load_players()

    if players.empty:
        st.warning("Register a player first.")
    else:
        player_options = {
            f"{r['name']} (ID {r['player_id']})": int(r["player_id"])
            for _, r in players.iterrows()
        }

        with st.form("record_match", clear_on_submit=True):
            selected = st.selectbox("Player", list(player_options))
            match_date = st.date_input("Match date")
            opponent = st.text_input("Opponent")
            result = st.selectbox("Result", ["win", "loss"])
            unforced = st.number_input(
                "Unforced errors", min_value=0, value=0, step=1
            )
            forced = st.number_input(
                "Forced errors", min_value=0, value=0, step=1
            )
            smash = st.number_input(
                "Smash winners", min_value=0, value=0, step=1
            )
            notes = st.text_area("Notes")
            save = st.form_submit_button("Save match")

        if save:
            with connect_db() as conn:
                conn.execute("""
                    INSERT INTO matches (
                        player_id, match_date, opponent, result,
                        unforced_errors, forced_errors, smash_winners, notes
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    player_options[selected],
                    str(match_date),
                    opponent.strip(),
                    result,
                    unforced,
                    forced,
                    smash,
                    notes.strip(),
                ))
            st.success("Match recorded!")


# ---------------- PLAYER PORTFOLIO ----------------

elif page == "Player Portfolio":
    st.subheader("Individual Player Portfolio")
    players = load_players()

    if players.empty:
        st.info("Register a player to begin.")
    else:
        options = {
            f"{r['name']} (ID {r['player_id']})": int(r["player_id"])
            for _, r in players.iterrows()
        }
        selected = st.selectbox("Select player", list(options))
        player_id = options[selected]
        player = players[players["player_id"] == player_id].iloc[0]

        st.write(
            f"**Style:** {player['playing_style']}  |  "
            f"**Skill level:** {player['skill_level']}  |  "
            f"**Age:** {player['age']}"
        )

        matches = load_matches(player_id)

        if matches.empty:
            st.info("No matches recorded for this player yet.")
        else:
            total = len(matches)
            wins = int((matches["result"].str.lower() == "win").sum())
            losses = int((matches["result"].str.lower() == "loss").sum())

            c1, c2, c3, c4 = st.columns(4)
            c1.metric("Matches", total)
            c2.metric("Wins", wins)
            c3.metric("Losses", losses)
            c4.metric("Win rate", f"{wins / total * 100:.1f}%")

            st.markdown("#### Match History")
            st.dataframe(matches, use_container_width=True)

            metric_cols = [
                "unforced_errors", "forced_errors", "smash_winners"
            ]
            matches[metric_cols] = matches[metric_cols].apply(
                pd.to_numeric, errors="coerce"
            )

            st.markdown("#### Metric Averages")
            st.dataframe(
                matches[metric_cols].mean().rename("Average").to_frame(),
                use_container_width=True,
            )

            st.markdown("#### Latest Match vs All Previous Matches")
            if len(matches) < 2:
                st.info("Record another match to compare performance.")
            else:
                latest = matches.iloc[-1]
                previous = matches.iloc[:-1]
                advice = []

                for metric in metric_cols:
                    old = previous[metric].dropna()
                    current = latest[metric]
                    label = metric.replace("_", " ").title()

                    if pd.isna(current) or old.empty:
                        st.write(f"{label}: insufficient data")
                        continue

                    average = old.mean()
                    difference = current - average
                    st.write(
                        f"**{label}:** latest {current:g}; "
                        f"previous average {average:.2f}; "
                        f"difference {difference:+.2f}"
                    )

                    if metric == "unforced_errors":
                        if difference > 0:
                            advice.append(
                                "Practise shot selection and consistency; "
                                "unforced errors are above your previous average."
                            )
                        else:
                            advice.append(
                                "Maintain consistency and keep reviewing "
                                "unforced errors."
                            )

                    elif metric == "forced_errors":
                        advice.append(
                            "Review defensive positioning and opponent pressure. "
                            "A forced-error count alone does not prove poor defence."
                        )

                    elif metric == "smash_winners":
                        if difference < 0:
                            advice.append(
                                "Practise smash timing, placement, and setting up "
                                "attacking opportunities."
                            )
                        else:
                            advice.append(
                                "Maintain smash accuracy and vary attacking placement."
                            )

                st.markdown("#### Training Recommendations")
                for item in advice:
                    st.write(f"- {item}")


# ---------------- MATCH PREDICTION ----------------

elif page == "Match Prediction":
    st.subheader("Historical Match Winner Prediction")
    st.warning(
        "This prediction is separate from player portfolios. "
        "It uses historical BWF statistics, not the three manually recorded metrics."
    )

    bundle = get_model_bundle()

    if bundle is None:
        st.error(
            "Prediction model file is missing or could not be loaded. "
            "Check that shuttlemetrics_model.joblib is in the repository."
        )
    else:
        player_history = bundle.get("player_history", {})
        h2h_history = bundle.get("h2h_history", {})
        model = bundle["model"]
        feature_cols = bundle["feature_cols"]

        names = sorted(player_history.keys())

        if len(names) < 2:
            st.warning("The model bundle does not contain enough players.")
        else:
            col1, col2 = st.columns(2)

            with col1:
                p1 = st.selectbox("Player 1", names, index=0)

            with col2:
                p2 = st.selectbox(
                    "Player 2", names, index=1 if len(names) > 1 else 0
                )

            if st.button("Predict winner"):
                if p1 == p2:
                    st.error("Select two different players.")
                else:
                    s1 = player_history[p1]
                    s2 = player_history[p2]

                    rate1 = (
                        s1["wins"] / s1["played"]
                        if s1["played"] else 0.5
                    )
                    rate2 = (
                        s2["wins"] / s2["played"]
                        if s2["played"] else 0.5
                    )
                    form1 = (
                        sum(s1["recent"]) / len(s1["recent"])
                        if s1["recent"] else 0.5
                    )
                    form2 = (
                        sum(s2["recent"]) / len(s2["recent"])
                        if s2["recent"] else 0.5
                    )

                    h2h = h2h_history.get((p1, p2), [0, 0])
                    h2h_rate = (
                        h2h[0] / sum(h2h)
                        if sum(h2h) else 0.5
                    )

                    feature_values = {
                        "team1_previous_win_rate": rate1,
                        "team2_previous_win_rate": rate2,
                        "team1_recent_form": form1,
                        "team2_recent_form": form2,
                        "team1_h2h_win_rate": h2h_rate,
                    }

                    X = pd.DataFrame(
                        [[feature_values[c] for c in feature_cols]],
                        columns=feature_cols,
                    )

                    prediction = int(model.predict(X)[0])
                    probabilities = None

                    if hasattr(model, "predict_proba"):
                        probabilities = model.predict_proba(X)[0]

                    # Export mapping in the bundle: 1 = Player 1 wins,
                    # 0 = Player 2 wins.
                    predicted_name = p1 if prediction == 1 else p2
                    st.success(f"Model prediction: {predicted_name}")

                    if probabilities is not None:
                        classes = list(model.classes_)
                        if prediction in classes:
                            confidence = probabilities[classes.index(prediction)]
                            st.write(
                                f"Model confidence for the predicted class: "
                                f"{confidence * 100:.1f}%"
                            )

                    st.caption(
                        "This is a statistical estimate, not a guarantee. "
                        "Predictions for unfamiliar players are not supported "
                        "by this historical-player selector."
                    )
