import hashlib
import hmac
import os
import secrets
import sqlite3
from pathlib import Path

import joblib
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

# -----------------------------------------------------------------------------
# APP CONFIGURATION
# -----------------------------------------------------------------------------
st.set_page_config(
    page_title="ShuttleMetrics | Player Performance",
    page_icon="🏸",
    layout="wide",
    initial_sidebar_state="expanded",
)

BASE_DIR = Path(__file__).parent
DB_PATH = Path(os.environ.get("SHUTTLEMETRICS_DB_PATH", str(BASE_DIR / "shuttlemetrics.db")))
MODEL_PATH = BASE_DIR / "shuttlemetrics_model.joblib"
PBKDF2_ITERATIONS = 310_000

# -----------------------------------------------------------------------------
# VISUAL SYSTEM — restrained navy, teal and court-orange palette
# -----------------------------------------------------------------------------
st.markdown(
    """
    <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');

    :root {
        --sm-bg: #0a111d;
        --sm-panel: #111c2b;
        --sm-panel-2: #152235;
        --sm-border: #27364a;
        --sm-text: #eef3f8;
        --sm-muted: #98a9bd;
        --sm-teal: #37d6bd;
        --sm-orange: #ff9f43;
        --sm-red: #ff7272;
    }

    html, body, [class*="css"], [data-testid="stAppViewContainer"] {
        font-family: 'DM Sans', sans-serif;
    }
    .stApp {
        background: var(--sm-bg);
        color: var(--sm-text);
    }
    [data-testid="stAppViewContainer"] > .main {
        background:
          radial-gradient(ellipse at 85% 0%, rgba(55,214,189,.055), transparent 32%),
          var(--sm-bg);
    }
    [data-testid="stHeader"] { background: rgba(10,17,29,.92); }
    [data-testid="stSidebar"] {
        background: #0d1725;
        border-right: 1px solid var(--sm-border);
    }
    [data-testid="stSidebar"] > div:first-child { padding-top: 1.35rem; }
    [data-testid="stSidebar"] [data-testid="stMarkdownContainer"] p { color: var(--sm-muted); }
    [data-testid="stSidebar"] hr { border-color: var(--sm-border); }

    h1, h2, h3, h4 {
        font-family: 'Manrope', sans-serif !important;
        letter-spacing: -0.035em;
        color: var(--sm-text) !important;
    }
    h1 { font-weight: 800 !important; }
    h2, h3 { font-weight: 750 !important; }
    p, label, [data-testid="stCaptionContainer"] { color: #c0ccda; }
    [data-testid="stCaptionContainer"] { font-size: .86rem; }

    .sm-brand { display:flex; align-items:center; gap:11px; margin:0 0 7px 0; }
    .sm-brand-mark {
        display:flex; align-items:center; justify-content:center;
        width:42px; height:42px; border-radius:13px;
        background:rgba(55,214,189,.11); border:1px solid rgba(55,214,189,.35);
        color:var(--sm-teal); font-size:23px;
    }
    .sm-brand-name { color:#f4f7fb; font:800 19px 'Manrope',sans-serif; letter-spacing:-.04em; }
    .sm-brand-sub { color:var(--sm-muted); font-size:11px; letter-spacing:.13em; text-transform:uppercase; margin-top:1px; }
    .sm-eyebrow { color:var(--sm-teal); font-size:11px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; }
    .sm-hero {
        position:relative; overflow:hidden;
        padding:30px 32px; border-radius:20px;
        background:linear-gradient(115deg,#142338 0%,#102d38 100%);
        border:1px solid #2b4856; margin:4px 0 24px 0;
    }
    .sm-hero:after {
        content:' '; position:absolute; width:220px; height:220px; right:-75px; top:-105px;
        border:1px solid rgba(55,214,189,.24); border-radius:50%;
        box-shadow:0 0 0 24px rgba(55,214,189,.035),0 0 0 48px rgba(55,214,189,.025);
        pointer-events:none;
    }
    .sm-hero h1 { margin:8px 0 7px 0; font-size:clamp(30px,4vw,43px); line-height:1.12; }
    .sm-hero p { max-width:680px; margin:0; font-size:15px; color:#c3d1df; line-height:1.65; }
    .sm-section-head { margin:25px 0 13px 0; }
    .sm-section-head h3 { font-size:19px; margin:0 0 4px 0; }
    .sm-section-head p { margin:0; color:var(--sm-muted); font-size:13px; }
    .sm-card {
        background:var(--sm-panel); border:1px solid var(--sm-border);
        border-radius:16px; padding:19px 20px; height:100%;
    }
    .sm-card-kicker { color:var(--sm-muted); font-size:11px; font-weight:700; letter-spacing:.11em; text-transform:uppercase; }
    .sm-card-value { color:#f4f7fb; font:800 26px 'Manrope',sans-serif; margin:7px 0 3px 0; letter-spacing:-.04em; }
    .sm-card-foot { color:var(--sm-muted); font-size:12px; }
    .sm-card-accent { width:30px; height:3px; border-radius:4px; background:var(--sm-teal); margin-bottom:15px; }
    .sm-card-accent.orange { background:var(--sm-orange); }
    .sm-card-accent.red { background:var(--sm-red); }
    .sm-nav-note { color:var(--sm-muted); font-size:12px; line-height:1.55; }

    div[data-testid="stMetric"] {
        background:var(--sm-panel); border:1px solid var(--sm-border);
        border-radius:15px; padding:17px 18px;
    }
    div[data-testid="stMetricLabel"] { color:var(--sm-muted) !important; font-size:11px !important; font-weight:700 !important; letter-spacing:.09em; text-transform:uppercase; }
    div[data-testid="stMetricValue"] { color:#f5f8fb !important; font-family:'Manrope',sans-serif; font-weight:800; }
    div[data-testid="stMetricDelta"] { font-size:12px; }

    div.stButton > button, div.stFormSubmitButton > button {
        min-height:43px; border-radius:10px; border:1px solid #36cdb7;
        background:#1cb49f; color:#06151a; font-weight:800;
        transition:all .15s ease;
    }
    div.stButton > button:hover, div.stFormSubmitButton > button:hover {
        background:#49e0c8; border-color:#49e0c8; color:#06151a;
    }
    div.stButton > button:focus, div.stFormSubmitButton > button:focus { box-shadow:0 0 0 .15rem rgba(55,214,189,.22); }

    input, textarea, [data-baseweb="select"] > div, [data-testid="stDateInput"] input,
    [data-testid="stNumberInput"] input {
        background:#101c2b !important; color:var(--sm-text) !important;
        border-color:#33445a !important; border-radius:9px !important;
    }
    [data-testid="stForm"] {
        background:var(--sm-panel); border:1px solid var(--sm-border);
        padding:23px; border-radius:16px;
    }
    [data-testid="stDataFrame"], [data-testid="stTable"] {
        border:1px solid var(--sm-border); border-radius:12px; overflow:hidden;
    }
    [data-testid="stAlert"] { border-radius:12px; }
    .stTabs [data-baseweb="tab-list"] { gap:8px; border-bottom:1px solid var(--sm-border); }
    .stTabs [data-baseweb="tab"] { color:var(--sm-muted); padding:10px 14px; }
    .stTabs [aria-selected="true"] { color:var(--sm-teal) !important; border-bottom-color:var(--sm-teal) !important; }
    [data-testid="stRadio"] label { color:#dce5ef; }
    .sm-footer { border-top:1px solid var(--sm-border); padding-top:14px; margin-top:34px; color:#70849b; font-size:11px; }
    @media (max-width: 760px) {
        .sm-hero { padding:23px 21px; }
        .sm-hero h1 { font-size:29px; }
        [data-testid="stForm"] { padding:16px; }
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# -----------------------------------------------------------------------------
# DATABASE
# -----------------------------------------------------------------------------
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

# -----------------------------------------------------------------------------
# AUTHENTICATION — existing local-account system retained
# -----------------------------------------------------------------------------
def make_password_hash(password, salt_hex=None):
    salt = bytes.fromhex(salt_hex) if salt_hex else secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS)
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
    left, right = st.columns([1.1, 0.9], gap="large")
    with left:
        st.markdown("""
            <div class="sm-hero" style="margin-top:24px; min-height:360px; display:flex; flex-direction:column; justify-content:center;">
                <div class="sm-eyebrow">BADMINTON PERFORMANCE PLATFORM</div>
                <h1>Play with purpose.<br>Improve with evidence.</h1>
                <p>Keep your match history organized, understand your performance trends, and make each training session count.</p>
                <div style="display:flex; gap:24px; flex-wrap:wrap; margin-top:27px;">
                    <div><div style="font:800 23px Manrope;color:#f4f7fb">01</div><div style="font-size:12px;color:#9fb1c4">Track matches</div></div>
                    <div><div style="font:800 23px Manrope;color:#f4f7fb">02</div><div style="font-size:12px;color:#9fb1c4">Review trends</div></div>
                    <div><div style="font:800 23px Manrope;color:#f4f7fb">03</div><div style="font-size:12px;color:#9fb1c4">Plan training</div></div>
                </div>
            </div>
        """, unsafe_allow_html=True)
        st.caption("Your account keeps profile and match records scoped to your login. Prediction uses the separate bundled historical model.")
    with right:
        st.markdown('<div style="height:22px"></div>', unsafe_allow_html=True)
        st.markdown('<div class="sm-eyebrow">WELCOME TO SHUTTLEMETRICS</div>', unsafe_allow_html=True)
        st.markdown("## Your player workspace")
        st.markdown("Sign in to continue, or create an account to start your performance log.")
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
        st.markdown('<div class="sm-footer">SHUTTLEMETRICS · PLAYER PERFORMANCE</div>', unsafe_allow_html=True)
    st.stop()

# -----------------------------------------------------------------------------
# USER-SCOPED DATA
# -----------------------------------------------------------------------------
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


def page_hero(eyebrow, title, description):
    st.markdown(
        f"""<div class="sm-hero"><div class="sm-eyebrow">{eyebrow}</div>
        <h1>{title}</h1><p>{description}</p></div>""",
        unsafe_allow_html=True,
    )


def section_heading(title, subtitle=None):
    subtitle_html = f"<p>{subtitle}</p>" if subtitle else ""
    st.markdown(
        f'<div class="sm-section-head"><h3>{title}</h3>{subtitle_html}</div>',
        unsafe_allow_html=True,
    )


def card_html(kicker, value, foot, accent=""):
    accent_class = f" {accent}" if accent else ""
    return f"""<div class="sm-card"><div class="sm-card-accent{accent_class}"></div>
        <div class="sm-card-kicker">{kicker}</div><div class="sm-card-value">{value}</div>
        <div class="sm-card-foot">{foot}</div></div>"""


def style_plotly(fig, height=330):
    fig.update_layout(
        height=height,
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font=dict(family="DM Sans, sans-serif", color="#c0ccda", size=12),
        margin=dict(l=12, r=12, t=28, b=12),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="left", x=0),
        xaxis=dict(showgrid=False, linecolor="#2a3a4e", tickfont=dict(color="#9aacc0")),
        yaxis=dict(gridcolor="rgba(143,164,188,.13)", zerolinecolor="rgba(143,164,188,.15)", tickfont=dict(color="#9aacc0")),
        hoverlabel=dict(bgcolor="#152235", bordercolor="#33465c", font_color="#f2f6fa"),
    )
    return fig

# -----------------------------------------------------------------------------
# APP NAVIGATION
# -----------------------------------------------------------------------------
def navigate_to(target):
    """Navigation callback; runs before Streamlit renders the next page."""
    st.session_state["Navigation"] = target


user = current_user()
if not user:
    require_login_screen()

user_id = int(user["user_id"])
with st.sidebar:
    st.markdown("""<div class="sm-brand"><div class="sm-brand-mark">🏸</div>
        <div><div class="sm-brand-name">ShuttleMetrics</div><div class="sm-brand-sub">Player analytics</div></div></div>""", unsafe_allow_html=True)
    st.markdown("---")
    st.markdown(f"**{user['username']}**")
    st.caption("PERSONAL WORKSPACE")
    page = st.radio(
        "Navigation",
        ["Home", "My Player Profile", "Record Match", "My Portfolio", "Match Prediction"],
        format_func=lambda item: {
            "Home": "⌂   Overview",
            "My Player Profile": "◉   Player profile",
            "Record Match": "+   Record match",
            "My Portfolio": "▥   Performance portfolio",
            "Match Prediction": "⌁   Match prediction",
        }[item],
        label_visibility="collapsed",
        key="Navigation",
    )
    st.markdown("---")
    st.caption("YOUR SEASON, IN CONTEXT")
    st.markdown('<div class="sm-nav-note">Track the details. Learn from the patterns. Take the next step.</div>', unsafe_allow_html=True)
    st.markdown('<div style="height:16px"></div>', unsafe_allow_html=True)
    if st.button("Log out", use_container_width=True):
        st.session_state.pop("user", None)
        st.rerun()
    st.markdown('<div class="sm-footer">SHUTTLEMETRICS · V1</div>', unsafe_allow_html=True)

player = load_player(user_id)

# -----------------------------------------------------------------------------
# HOME
# -----------------------------------------------------------------------------
if page == "Home":
    page_hero(
        "BADMINTON PERFORMANCE · OVERVIEW",
        "Own your game.",
        "A focused workspace for your match history, on-court patterns and next training priorities.",
    )
    st.markdown(f"### Welcome back, {user['username']}.")
    st.caption("Here is the current snapshot of your badminton season.")
    with connect_db() as conn:
        total_matches = conn.execute("""
            SELECT COUNT(*) FROM matches m JOIN players p ON p.player_id=m.player_id
            WHERE p.user_id=?
        """, (user_id,)).fetchone()[0]
        total_wins = conn.execute("""
            SELECT COUNT(*) FROM matches m JOIN players p ON p.player_id=m.player_id
            WHERE p.user_id=? AND LOWER(m.result)='win'
        """, (user_id,)).fetchone()[0]
    win_rate = f"{total_wins / total_matches * 100:.1f}%" if total_matches else "—"
    a, b, c = st.columns(3, gap="medium")
    with a:
        st.markdown(card_html("PLAYER PROFILE", "Ready" if player else "Not set up", "Playing identity and skill level", "" if player else "orange"), unsafe_allow_html=True)
    with b:
        st.markdown(card_html("MATCHES RECORDED", f"{int(total_matches):,}", "Your recorded match history"), unsafe_allow_html=True)
    with c:
        st.markdown(card_html("WIN RATE", win_rate, f"{int(total_wins)} wins recorded", "orange"), unsafe_allow_html=True)

    section_heading("Your workspace", "Choose the next task. Each section has a specific purpose.")
    a, b = st.columns(2, gap="medium")
    with a:
        st.markdown("""<div class="sm-card"><div class="sm-card-accent"></div><div class="sm-card-kicker">01 · PLAYER SETUP</div><h3 style="margin:10px 0 6px">Player profile</h3><p style="font-size:13px;color:#98a9bd">Keep your playing style and current skill level up to date.</p></div>""", unsafe_allow_html=True)
        st.button("Open player profile →", key="home_profile", use_container_width=True,
                  on_click=navigate_to, args=("My Player Profile",))
    with b:
        st.markdown("""<div class="sm-card"><div class="sm-card-accent orange"></div><div class="sm-card-kicker">02 · MATCH LOG</div><h3 style="margin:10px 0 6px">Record a match</h3><p style="font-size:13px;color:#98a9bd">Capture result, errors and smash winners while details are fresh.</p></div>""", unsafe_allow_html=True)
        st.button("Record a match →", key="home_record", use_container_width=True,
                  on_click=navigate_to, args=("Record Match",))
    if not player:
        st.info("Start by creating your player profile. You can record matches after saving it.")
    elif total_matches == 0:
        st.info("Your profile is ready. Record your first match to begin building a useful performance history.")
    else:
        st.success(f"You have {int(total_matches)} recorded match(es). Visit Performance portfolio to review the trends.")

# -----------------------------------------------------------------------------
# PLAYER PROFILE
# -----------------------------------------------------------------------------
elif page == "My Player Profile":
    page_hero(
        "PLAYER CENTER",
        "Your player profile.",
        "Set up the playing identity used throughout your personal performance workspace.",
    )
    section_heading("Player details", "Keep these details accurate so your portfolio has the right context.")
    with st.form("my_profile_form"):
        name = st.text_input("Player name", value=player["name"] if player else "", placeholder="Enter your player name")
        col1, col2 = st.columns(2)
        with col1:
            age = st.number_input("Age", min_value=5, max_value=100, value=int(player["age"]) if player and player["age"] else 18)
        with col2:
            styles = ["Attacking", "Defensive", "All-round"]
            style_default = player["playing_style"] if player and player["playing_style"] in styles else "Attacking"
            style = st.selectbox("Playing style", styles, index=styles.index(style_default))
        levels = ["Beginner", "Intermediate", "Advanced"]
        level_default = player["skill_level"] if player and player["skill_level"] in levels else "Beginner"
        level = st.selectbox("Skill level", levels, index=levels.index(level_default))
        submitted = st.form_submit_button("Save player profile", use_container_width=True)
    if submitted:
        if not name.strip():
            st.error("Please enter your player name.")
        else:
            create_player(user_id, name, int(age), style, level)
            st.success("Your player profile has been saved.")
            st.rerun()
    if player:
        section_heading("Profile summary", "Your current player settings.")
        p1, p2, p3 = st.columns(3)
        p1.metric("Playing style", player["playing_style"] or "Not set")
        p2.metric("Skill level", player["skill_level"] or "Not set")
        p3.metric("Age", player["age"] if player["age"] else "—")

# -----------------------------------------------------------------------------
# RECORD MATCH
# -----------------------------------------------------------------------------
elif page == "Record Match":
    page_hero(
        "MATCH LOG",
        "Record the match.",
        "Enter a consistent match record. These numbers help you review patterns over time; they do not determine the prediction model output.",
    )
    if not player:
        st.warning("Create your player profile before recording a match.")
        st.button("Set up player profile →", on_click=navigate_to, args=("My Player Profile",))
    else:
        section_heading("Match details", f"Recording for {player['name']}.")
        with st.form("record_match_form", clear_on_submit=True):
            col1, col2 = st.columns(2)
            with col1:
                match_date = st.date_input("Match date")
                opponent = st.text_input("Opponent", placeholder="Opponent name")
                result = st.selectbox("Result", ["win", "loss"], format_func=lambda value: "Win" if value == "win" else "Loss")
            with col2:
                unforced = st.number_input("Unforced errors", min_value=0, value=0, step=1, help="Errors not directly forced by the opponent.")
                forced = st.number_input("Forced errors", min_value=0, value=0, step=1, help="Errors under opponent pressure; interpret in context.")
                smash = st.number_input("Smash winners", min_value=0, value=0, step=1)
            notes = st.text_area("Match notes (optional)", placeholder="Conditions, tactical notes, or areas to review…", height=90)
            save = st.form_submit_button("Save match record", use_container_width=True)
        if save:
            with connect_db() as conn:
                owned = conn.execute(
                    "SELECT player_id FROM players WHERE player_id=? AND user_id=?",
                    (player["player_id"], user_id),
                ).fetchone()
                if not owned:
                    st.error("You do not have permission to update this profile.")
                else:
                    conn.execute("""
                        INSERT INTO matches (player_id, match_date, opponent, result,
                            unforced_errors, forced_errors, smash_winners, notes)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        int(player["player_id"]), str(match_date), opponent.strip(), result,
                        int(unforced), int(forced), int(smash), notes.strip(),
                    ))
                    st.success("Match saved to your portfolio.")
                    st.rerun()

# -----------------------------------------------------------------------------
# MY PORTFOLIO
# -----------------------------------------------------------------------------
elif page == "My Portfolio":
    page_hero(
        "PERFORMANCE PORTFOLIO",
        "Patterns over time.",
        "Review your match history, compare your latest performance with earlier matches, and use the patterns to guide training.",
    )
    if not player:
        st.info("Create your player profile first to start your portfolio.")
        st.button("Create player profile →", on_click=navigate_to, args=("My Player Profile",))
    else:
        matches = load_matches(user_id, int(player["player_id"]))
        st.markdown(f"**{player['name']}**  ·  {player['playing_style'] or 'Style not set'}  ·  {player['skill_level'] or 'Level not set'}")
        if matches.empty:
            st.info("No matches recorded yet. Record your first match to build your portfolio.")
            st.button("Record your first match →", on_click=navigate_to, args=("Record Match",))
        else:
            matches["result"] = matches["result"].fillna("").astype(str)
            matches["match_date"] = matches["match_date"].astype(str)
            total = len(matches)
            wins = int((matches["result"].str.lower() == "win").sum())
            losses = int((matches["result"].str.lower() == "loss").sum())
            win_rate = wins / total * 100 if total else 0
            c1, c2, c3, c4 = st.columns(4, gap="small")
            c1.metric("Matches played", total)
            c2.metric("Wins", wins)
            c3.metric("Losses", losses)
            c4.metric("Win rate", f"{win_rate:.1f}%")

            section_heading("Match history", "All recorded matches stay here, regardless of the chart filter.")
            history_display = matches.copy()
            history_display.columns = [
                "Date", "Opponent", "Result", "Unforced errors", "Forced errors", "Smash winners", "Notes"
            ]
            st.dataframe(history_display, use_container_width=True, hide_index=True)

            section_heading("Performance trends", "Limit the chart window as your match history grows.")
            chart_limit = st.selectbox(
                "Matches to display",
                options=["Last 5 matches", "Last 10 matches", "All matches"],
                index=1,
                key="portfolio_chart_limit",
            )
            chart_data = matches.copy()
            metric_cols = ["unforced_errors", "forced_errors", "smash_winners"]
            for metric in metric_cols:
                chart_data[metric] = pd.to_numeric(chart_data[metric], errors="coerce")
            chart_data["Match number"] = range(1, len(chart_data) + 1)
            if chart_limit == "Last 5 matches":
                chart_data = chart_data.tail(5)
            elif chart_limit == "Last 10 matches":
                chart_data = chart_data.tail(10)
            chart_data = chart_data.copy()
            chart_data["Match label"] = [f"M{n}" for n in chart_data["Match number"]]
            st.caption(f"Showing {len(chart_data)} of {len(matches)} matches. The full history above is unchanged.")

            chart_left, chart_right = st.columns([1.25, 1], gap="large")
            with chart_left:
                st.markdown("#### Error trends")
                error_long = chart_data.melt(
                    id_vars=["Match label"],
                    value_vars=["unforced_errors", "forced_errors"],
                    var_name="Metric", value_name="Count",
                )
                error_long["Metric"] = error_long["Metric"].map({
                    "unforced_errors": "Unforced errors", "forced_errors": "Forced errors"
                })
                fig_errors = px.line(
                    error_long, x="Match label", y="Count", color="Metric", markers=True,
                    color_discrete_map={"Unforced errors": "#ff9f43", "Forced errors": "#37d6bd"},
                )
                fig_errors.update_traces(line=dict(width=2.5), marker=dict(size=7))
                st.plotly_chart(style_plotly(fig_errors, 330), use_container_width=True, config={"displayModeBar": False})
            with chart_right:
                st.markdown("#### Smash winners")
                fig_smash = px.bar(
                    chart_data, x="Match label", y="smash_winners",
                    color_discrete_sequence=["#37d6bd"],
                )
                fig_smash.update_traces(marker_line_width=0, opacity=.92)
                fig_smash.update_layout(showlegend=False)
                st.plotly_chart(style_plotly(fig_smash, 330), use_container_width=True, config={"displayModeBar": False})

            result_counts = matches["result"].str.lower().value_counts().reindex(["win", "loss"], fill_value=0)
            section_heading("Match outcomes", "Results across all recorded matches.")
            outcome_col, avg_col = st.columns([1, 1], gap="large")
            with outcome_col:
                fig_results = go.Figure(data=[go.Pie(
                    labels=["Wins", "Losses"], values=[int(result_counts.get("win", 0)), int(result_counts.get("loss", 0))],
                    hole=.72, marker=dict(colors=["#37d6bd", "#ff9f43"], line=dict(color="#111c2b", width=3)),
                    textinfo="label+percent", textfont=dict(color="#eef3f8", size=12),
                )])
                fig_results.update_layout(showlegend=False, annotations=[dict(
                    text=f"{total}<br><span style='font-size:11px'>matches</span>",
                    x=.5, y=.5, font=dict(size=22, color="#eef3f8", family="Manrope"), showarrow=False,
                )])
                st.plotly_chart(style_plotly(fig_results, 300), use_container_width=True, config={"displayModeBar": False})
            with avg_col:
                st.markdown("#### Average match metrics")
                averages = matches[metric_cols].apply(pd.to_numeric, errors="coerce").mean()
                a1, a2, a3 = st.columns(3)
                a1.metric("Unforced errors", "—" if pd.isna(averages["unforced_errors"]) else f"{averages['unforced_errors']:.1f}")
                a2.metric("Forced errors", "—" if pd.isna(averages["forced_errors"]) else f"{averages['forced_errors']:.1f}")
                a3.metric("Smash winners", "—" if pd.isna(averages["smash_winners"]) else f"{averages['smash_winners']:.1f}")
                st.caption("Averages use all recorded matches, not only the chart window.")

            section_heading("Latest match vs. previous average", "The latest match is compared with the average of every earlier recorded match.")
            if len(matches) < 2:
                st.info("Record at least two matches to compare your latest performance with your previous-match average.")
            else:
                latest = matches.iloc[-1]
                previous = matches.iloc[:-1]
                comparisons = [
                    ("unforced_errors", "Unforced errors", "lower"),
                    ("forced_errors", "Forced errors", "context"),
                    ("smash_winners", "Smash winners", "higher"),
                ]
                for metric, label, direction in comparisons:
                    old_values = pd.to_numeric(previous[metric], errors="coerce").dropna()
                    current = pd.to_numeric(pd.Series([latest[metric]]), errors="coerce").iloc[0]
                    st.markdown(f"#### {label}")
                    if pd.isna(current) or old_values.empty:
                        st.info(f"Not enough data for {label.lower()}.")
                        continue
                    average = old_values.mean()
                    difference = current - average
                    left, middle, right = st.columns(3)
                    left.metric("Latest match", f"{current:g}")
                    middle.metric("Previous average", f"{average:.2f}")
                    right.metric("Difference", f"{difference:+.2f}", delta_color=("inverse" if direction == "lower" else "normal") if direction != "context" else "off")
                    if direction == "lower":
                        if difference < 0:
                            st.success("Improvement: fewer unforced errors than your previous average.")
                        elif difference > 0:
                            st.warning("Review shot selection and consistency to reduce unforced errors.")
                        else:
                            st.info("Unforced errors are at your previous average.")
                    elif direction == "higher":
                        if difference > 0:
                            st.success("More smash winners than your previous average.")
                        elif difference < 0:
                            st.info("Practise smash timing, placement and creating attacking opportunities.")
                        else:
                            st.info("Smash winners are at your previous average.")
                    else:
                        st.info("Forced errors depend on opponent pressure. Review match context before judging this metric.")
                st.markdown("""<div class="sm-card"><div class="sm-card-accent orange"></div><div class="sm-card-kicker">TRAINING NOTE</div><h3 style="margin:8px 0">Use the numbers as feedback, not a verdict.</h3><p style="font-size:13px;color:#98a9bd">Consider opponent strength, match length, tactics and playing conditions before drawing conclusions from a single metric.</p></div>""", unsafe_allow_html=True)

# -----------------------------------------------------------------------------
# MATCH PREDICTION — model and features kept separate from manual match stats
# -----------------------------------------------------------------------------
elif page == "Match Prediction":
    page_hero(
        "HISTORICAL MODEL",
        "Match prediction.",
        "Compare two players using the bundled model's historical win rate, recent form and head-to-head features.",
    )
    st.info("This prediction is separate from your private portfolio. It uses historical BWF statistics, not the three manually recorded match metrics.")
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
            section_heading("Choose players", "Select two different players from the model's historical player list.")
            col1, col2 = st.columns(2, gap="medium")
            with col1:
                p1 = st.selectbox("Player 1", names, index=0)
            with col2:
                p2 = st.selectbox("Player 2", names, index=1)
            if st.button("Run prediction", use_container_width=True):
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
                    st.markdown("---")
                    st.markdown('<div class="sm-eyebrow">MODEL OUTPUT</div>', unsafe_allow_html=True)
                    st.markdown(f"## {predicted_name}")
                    st.success(f"Predicted winner: {predicted_name}")
                    if probabilities is not None:
                        classes = list(model.classes_)
                        if prediction in classes:
                            confidence = probabilities[classes.index(prediction)]
                            st.metric("Model confidence for predicted class", f"{confidence * 100:.1f}%")
                    st.caption("This is a statistical estimate, not a guarantee. Predictions for unfamiliar players are not supported by this historical-player selector.")

st.markdown('<div class="sm-footer">SHUTTLEMETRICS · TRACK · REVIEW · IMPROVE</div>', unsafe_allow_html=True)
