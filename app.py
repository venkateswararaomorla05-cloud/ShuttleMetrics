import hashlib
import hmac
import os
import secrets
import sqlite3
from pathlib import Path

import joblib
import pandas as pd
import streamlit as st

st.set_page_config(page_title="ShuttleMetrics", page_icon="🏸", layout="wide")
st.markdown("""
<style>
/* ShuttleMetrics - dark sports theme */
.stApp {
    background: linear-gradient(135deg, #08111f 0%, #101d30 100%);
    color: #f1f5f9;
}

[data-testid="stSidebar"] {
    background-color: #0b1627;
    border-right: 1px solid #243449;
}

h1, h2, h3 {
    color: #f8fafc !important;
    font-weight: 750 !important;
}

p, label, span {
    color: #dbe5ef;
}

div.stButton > button {
    background: #0f766e;
    color: white;
    border: 1px solid #2dd4bf;
    border-radius: 10px;
    padding: 0.55rem 1rem;
    font-weight: 600;
}

div.stButton > button:hover {
    background: #115e59;
    color: white;
    border: 1px solid #f97316;
}

div[data-testid="stMetric"] {
    background: #142238;
    border: 1px solid #2b4058;
    padding: 18px;
    border-radius: 14px;
}

div[data-testid="stMetricValue"] {
    color: #2dd4bf;
}

input, textarea {
    background-color: #142238 !important;
}

div[data-testid="stForm"] {
    background-color: #101d30;
    padding: 18px;
    border: 1px solid #2b4058;
    border-radius: 14px;
}
</style>
""", unsafe_allow_html=True)

BASE_DIR = Path(__file__).parent
DB_PATH = Path(os.environ.get("SHUTTLEMETRICS_DB_PATH", str(BASE_DIR / "shuttlemetrics.db")))
MODEL_PATH = BASE_DIR / "shuttlemetrics_model.joblib"
PBKDF2_ITERATIONS = 310_000


# ---------------- DATABASE ----------------

def connect_db():
    conn = sqlite3.connect(str(DB_PATH), timeout=30)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def initialize_db():
    with connect_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE COLLATE NOCASE,
                password_hash TEXT NOT NULL,
                password_salt TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS players (
                player_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                name TEXT NOT NULL,
                age INTEGER,
                playing_style TEXT,
                skill_level TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id)
            )
        """)
        player_columns = {row["name"] for row in conn.execute("PRAGMA table_info(players)")}
        if "user_id" not in player_columns:
            conn.execute("ALTER TABLE players ADD COLUMN user_id INTEGER")
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
        match_columns = {row["name"] for row in conn.execute("PRAGMA table_info(matches)")}
        if "forced_errors" not in match_columns:
            conn.execute("ALTER TABLE matches ADD COLUMN forced_errors INTEGER")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_players_user_id ON players(user_id)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_matches_player_id ON matches(player_id)")


initialize_db()


# ---------------- AUTHENTICATION ----------------

def make_password_hash(password, salt_hex=None):
    salt = bytes.fromhex(salt_hex) if salt_hex else secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS
    )
    return digest.hex(), salt.hex()


def verify_password(password, salt_hex, expected_hash):
    actual_hash, _ = make_password_hash(password, salt_hex)
    return hmac.compare_digest(actual_hash, expected_hash)


def create_account(username, password):
    username = username.strip()
    if len(username) < 3 or len(username) > 32:
        return False, "Username must be 3–32 characters."
    if not all(ch.isalnum() or ch in "._-" for ch in username):
        return False, "Use only letters, numbers, dots, underscores, and hyphens in the username."
    if len(password) < 10:
        return False, "Use a password with at least 10 characters."
    password_hash, salt = make_password_hash(password)
    try:
        with connect_db() as conn:
            conn.execute(
                "INSERT INTO users (username, password_hash, password_salt) VALUES (?, ?, ?)",
                (username, password_hash, salt),
            )
        return True, "Account created. You can now log in."
    except sqlite3.IntegrityError:
        return False, "That username is already registered."


def authenticate(username, password):
    with connect_db() as conn:
        user = conn.execute(
            "SELECT user_id, username, password_hash, password_salt FROM users WHERE username = ? COLLATE NOCASE",
            (username.strip(),),
        ).fetchone()
    if not user or not verify_password(password, user["password_salt"], user["password_hash"]):
        return None
    return {"user_id": int(user["user_id"]), "username": user["username"]}


def current_user():
    return st.session_state.get("user")


def require_login_screen():
    st.title("🏸 ShuttleMetrics")
    st.caption("Private badminton performance tracking")
    login_tab, signup_tab = st.tabs(["Log in", "Create account"])

    with login_tab:
        with st.form("login_form"):
            username = st.text_input("Username", key="login_username")
            password = st.text_input("Password", type="password", key="login_password")
            submitted = st.form_submit_button("Log in", use_container_width=True)
        if submitted:
            user = authenticate(username, password)
            if user:
                st.session_state["user"] = user
                st.rerun()
            else:
                st.error("Invalid username or password.")

    with signup_tab:
        st.write("Create an account to keep your player profile and match history private.")
        with st.form("signup_form"):
            username = st.text_input("Choose a username", key="signup_username")
            password = st.text_input("Create a password (10+ characters)", type="password", key="signup_password")
            confirm = st.text_input("Confirm password", type="password", key="signup_confirm")
            submitted = st.form_submit_button("Create account", use_container_width=True)
        if submitted:
            if password != confirm:
                st.error("Passwords do not match.")
            else:
                ok, message = create_account(username, password)
                if ok:
                    st.success(message)
                else:
                    st.error(message)

    st.info("Each account can access only its own player profile and match records.")
    st.stop()


# ---------------- USER-SCOPED DATA ----------------

def load_player(user_id):
    with connect_db() as conn:
        return conn.execute(
            "SELECT * FROM players WHERE user_id = ? ORDER BY player_id DESC LIMIT 1",
            (user_id,),
        ).fetchone()


def create_player(user_id, name, age, style, level):
    with connect_db() as conn:
        existing = conn.execute("SELECT player_id FROM players WHERE user_id = ?", (user_id,)).fetchone()
        if existing:
            conn.execute(
                "UPDATE players SET name=?, age=?, playing_style=?, skill_level=? WHERE player_id=? AND user_id=?",
                (name.strip(), age, style, level, existing["player_id"], user_id),
            )
            return int(existing["player_id"])
        cur = conn.execute(
            "INSERT INTO players (user_id, name, age, playing_style, skill_level) VALUES (?, ?, ?, ?, ?)",
            (user_id, name.strip(), age, style, level),
        )
        return int(cur.lastrowid)


def load_matches(user_id, player_id):
    with connect_db() as conn:
        # Ownership is checked in the query itself, not just in the UI.
        return pd.read_sql_query("""
            SELECT m.match_date, m.opponent, m.result,
                   m.unforced_errors, m.forced_errors, m.smash_winners, m.notes
            FROM matches m
            JOIN players p ON p.player_id = m.player_id
            WHERE p.user_id = ? AND p.player_id = ?
            ORDER BY m.match_date, m.match_id
        """, conn, params=(user_id, player_id))


def get_model_bundle():
    if not MODEL_PATH.exists():
        return None
    try:
        return joblib.load(MODEL_PATH)
    except Exception as exc:
        st.error(f"Could not load prediction model: {exc}")
        return None


# ---------------- APP ENTRY ----------------

user = current_user()
if not user:
    require_login_screen()

user_id = int(user["user_id"])

st.sidebar.title("🏸 ShuttleMetrics")
st.sidebar.caption(f"Logged in as **{user['username']}**")
page = st.sidebar.radio(
    "Choose a feature",
    ["Home", "My Player Profile", "Record Match", "My Portfolio", "Match Prediction"],
)
if st.sidebar.button("Log out", use_container_width=True):
    st.session_state.pop("user", None)
    st.rerun()

st.title("🏸 ShuttleMetrics")
st.caption("Your private badminton performance analyzer")

player = load_player(user_id)



# ---------------- HOME ----------------
if page == "Home":
    st.markdown("""
    <div style="
        background: linear-gradient(120deg, #102238, #115e59);
        padding: 32px 28px;
        border-radius: 18px;
        border: 1px solid #2dd4bf;
        margin-bottom: 24px;
    ">
        <p style="color:#5eead4; font-size:13px; letter-spacing:2px;">
            BADMINTON PERFORMANCE ANALYTICS
        </p>
        <h1 style="color:white; font-size:38px; margin:8px 0;">
            Own Your Game.
        </h1>
        <p style="color:#dbeafe; font-size:17px;">
            Track every match. Understand your performance.
            Find your next improvement.
        </p>
    </div>
    """, unsafe_allow_html=True)

    st.subheader(f"Welcome back, {user['username']}!")
    st.write("Your personal badminton performance centre.")

    with connect_db() as conn:
        total_matches = conn.execute("""
            SELECT COUNT(*)
            FROM matches m
            JOIN players p ON p.player_id = m.player_id
            WHERE p.user_id = ?
        """, (user_id,)).fetchone()[0]

        total_wins = conn.execute("""
            SELECT COUNT(*)
            FROM matches m
            JOIN players p ON p.player_id = m.player_id
            WHERE p.user_id = ? AND LOWER(m.result) = 'win'
        """, (user_id,)).fetchone()[0]

    win_rate = (
        f"{total_wins / total_matches * 100:.1f}%"
        if total_matches else "—"
    )

    c1, c2, c3 = st.columns(3)
    c1.metric("PLAYER PROFILE", "Ready" if player else "Not created")
    c2.metric("MATCHES PLAYED", int(total_matches))
    c3.metric("WIN RATE", win_rate)

    st.markdown("### Your Performance Centre")

    a, b, c = st.columns(3)

    with a:
        st.markdown("#### 🏸 Player Profile")
        st.caption("Manage your playing style and skill level.")
        st.markdown("**Navigate:** My Player Profile")

    with b:
        st.markdown("#### 📊 Match Tracking")
        st.caption("Record results, errors and smash winners.")
        st.markdown("**Navigate:** Record Match")

    with c:
        st.markdown("#### 📈 Performance Review")
        st.caption("Review match history and improvement trends.")
        st.markdown("**Navigate:** My Portfolio")

    if not player:
        st.warning(
            "Get started: create your player profile "
            "before recording your first match."
        )
    elif total_matches == 0:
        st.info(
            "Your profile is ready! Record your first match "
            "to start building your performance history."
        )
    else:
        st.success(
            f"You have recorded {int(total_matches)} match(es). "
            "Open My Portfolio to review your performance."
        )


# ---------------- PLAYER PROFILE ----------------
elif page == "My Player Profile":
    st.subheader("My Player Profile")
    with st.form("my_profile_form"):
        name = st.text_input("Player name", value=player["name"] if player else "")
        age = st.number_input("Age", min_value=5, max_value=100, value=int(player["age"]) if player and player["age"] else 18)
        styles = ["Attacking", "Defensive", "All-round"]
        levels = ["Beginner", "Intermediate", "Advanced"]
        style_default = player["playing_style"] if player and player["playing_style"] in styles else "Attacking"
        level_default = player["skill_level"] if player and player["skill_level"] in levels else "Beginner"
        style = st.selectbox("Playing style", styles, index=styles.index(style_default))
        level = st.selectbox("Skill level", levels, index=levels.index(level_default))
        submit = st.form_submit_button("Save my profile")
    if submit:
        if not name.strip():
            st.error("Please enter your player name.")
        else:
            create_player(user_id, name, int(age), style, level)
            st.success("Your private player profile has been saved.")
            st.rerun()

# ---------------- RECORD MATCH ----------------
elif page == "Record Match":
    st.subheader("Record My Match")
    if not player:
        st.warning("Create your player profile first.")
    else:
        with st.form("record_match_form", clear_on_submit=True):
            match_date = st.date_input("Match date")
            opponent = st.text_input("Opponent")
            result = st.selectbox("Result", ["win", "loss"])
            unforced = st.number_input("Unforced errors", min_value=0, value=0, step=1)
            forced = st.number_input("Forced errors", min_value=0, value=0, step=1)
            smash = st.number_input("Smash winners", min_value=0, value=0, step=1)
            notes = st.text_area("Notes")
            save = st.form_submit_button("Save match")
        if save:
            with connect_db() as conn:
                # Ensure this profile belongs to the logged-in account.
                owned = conn.execute(
                    "SELECT player_id FROM players WHERE player_id=? AND user_id=?",
                    (player["player_id"], user_id),
                ).fetchone()
                if not owned:
                    st.error("You do not have permission to update this profile.")
                else:
                    conn.execute("""
                        INSERT INTO matches (
                            player_id, match_date, opponent, result,
                            unforced_errors, forced_errors, smash_winners, notes
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        int(player["player_id"]), str(match_date), opponent.strip(), result,
                        int(unforced), int(forced), int(smash), notes.strip(),
                    ))
                    st.success("Your match has been recorded.")

# ---------------- MY PORTFOLIO ----------------
elif page == "My Portfolio":
    st.subheader("My Private Portfolio")
    if not player:
        st.info("Create your player profile first.")
    else:
        st.write(
            f"**Player:** {player['name']}  |  **Style:** {player['playing_style']}  |  "
            f"**Skill level:** {player['skill_level']}  |  **Age:** {player['age']}"
        )
        matches = load_matches(user_id, int(player["player_id"]))
        if matches.empty:
            st.info("No matches recorded yet. Record your first match to build your portfolio.")
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
            
            st.markdown("### 📈 Performance Trends")

            chart_data = matches.copy()
            metric_cols = [
                "unforced_errors",
                "forced_errors",
                "smash_winners",
            ]

            for metric in metric_cols:
                chart_data[metric] = pd.to_numeric(
                    chart_data[metric], errors="coerce"
                )

            chart_data["Match"] = range(1, len(chart_data) + 1)

            left, right = st.columns(2)

            with left:
                st.markdown("#### Error Trends")
                error_data = chart_data.set_index("Match")[
                    ["unforced_errors", "forced_errors"]
                ]
                st.line_chart(error_data)

            with right:
                st.markdown("#### Smash Winners")
                smash_data = chart_data.set_index("Match")[
                    ["smash_winners"]
                ]
                st.bar_chart(smash_data)

            st.caption(
                "Each point represents a recorded match in date order. "
                "Lower unforced errors and higher smash winners are "
                "generally desirable; interpret forced errors in context."
            )

            st.markdown("### 🏆 Match Results")
            result_counts = (
                chart_data["result"]
                .str.lower()
                .value_counts()
                .reindex(["win", "loss"], fill_value=0)
            )
            st.bar_chart(result_counts)

            metric_cols = ["unforced_errors", "forced_errors", "smash_winners"]
            matches[metric_cols] = matches[metric_cols].apply(pd.to_numeric, errors="coerce")
            st.markdown("#### Metric Averages")
            st.dataframe(matches[metric_cols].mean().rename("Average").to_frame(), use_container_width=True)
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
                        f"**{label}:** latest {current:g}; previous average {average:.2f}; "
                        f"difference {difference:+.2f}"
                    )
                    if metric == "unforced_errors":
                        advice.append(
                            "Practise shot selection and consistency; unforced errors are above your previous average."
                            if difference > 0 else "Maintain consistency and keep reviewing unforced errors."
                        )
                    elif metric == "forced_errors":
                        advice.append("Review defensive positioning and opponent pressure. A forced-error count alone does not prove poor defence.")
                    elif metric == "smash_winners":
                        advice.append(
                            "Practise smash timing, placement, and setting up attacking opportunities."
                            if difference < 0 else "Maintain smash accuracy and vary attacking placement."
                        )
                st.markdown("#### Training Recommendations")
                for item in advice:
                    st.write(f"- {item}")

# ---------------- MATCH PREDICTION ----------------
elif page == "Match Prediction":
    st.subheader("Historical Match Winner Prediction")
    st.warning(
        "This prediction is separate from your private portfolio. It uses historical BWF statistics, "
        "not the three manually recorded metrics."
    )
    bundle = get_model_bundle()
    if bundle is None:
        st.error("Prediction model file is missing or could not be loaded. Check that shuttlemetrics_model.joblib is in the repository.")
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
                p2 = st.selectbox("Player 2", names, index=1)
            if st.button("Predict winner"):
                if p1 == p2:
                    st.error("Select two different players.")
                else:
                    s1, s2 = player_history[p1], player_history[p2]
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
                    X = pd.DataFrame([[feature_values[c] for c in feature_cols]], columns=feature_cols)
                    prediction = int(model.predict(X)[0])
                    probabilities = model.predict_proba(X)[0] if hasattr(model, "predict_proba") else None
                    predicted_name = p1 if prediction == 1 else p2
                    st.success(f"Model prediction: {predicted_name}")
                    if probabilities is not None:
                        classes = list(model.classes_)
                        if prediction in classes:
                            confidence = probabilities[classes.index(prediction)]
                            st.write(f"Model confidence for the predicted class: {confidence * 100:.1f}%")
                    st.caption("This is a statistical estimate, not a guarantee. Predictions for unfamiliar players are not supported by this historical-player selector.")
