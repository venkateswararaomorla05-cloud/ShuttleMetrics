"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient, type SupabaseClient, type Session } from "@supabase/supabase-js";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Home,
  Menu,
  Plus,
  Search,
  Settings2,
  Bookmark,
  ChartNoAxesCombined,
  ClipboardList,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  UserRound,
  X,
  Zap,
} from "lucide-react";

type Page =
  | "Home"
  | "My Profile"
  | "Record Match"
  | "My Portfolio"
  | "Match Prediction"
  | "Player Stats"
  | "Analytics"
  | "Saved Matches"
  | "Settings";

type Match = {
  id: string;
  opponent: string;
  date: string;
  result: "Won" | "Lost";
  score: string;
  unforced: number;
  forced: number;
  smashes: number;
};


type ProfileRow = {
  id: string;
  username: string;
  playing_level: string;
  playing_style: string;
  profile_image: string | null;
};

type MatchRow = {
  id: string;
  user_id: string;
  opponent: string;
  played_at: string;
  result: "Won" | "Lost";
  score: string;
  unforced: number;
  forced: number;
  smashes: number;
};

const demoMatches: Match[] = [
  { id: "demo-1", opponent: "Arjun R.", date: "Oct 17, 2026", result: "Won", score: "21–17, 21–14", unforced: 8, forced: 12, smashes: 15 },
  { id: "demo-2", opponent: "Kiran M.", date: "Oct 15, 2026", result: "Won", score: "21–19, 18–21, 21–16", unforced: 11, forced: 14, smashes: 12 },
  { id: "demo-3", opponent: "Rahul S.", date: "Oct 12, 2026", result: "Lost", score: "17–21, 16–21", unforced: 16, forced: 9, smashes: 8 },
];

function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

const navItems: { label: Page; icon: typeof Home }[] = [
  { label: "Home", icon: Home },
  { label: "Match Prediction", icon: Target },
  { label: "Record Match", icon: Plus },
  { label: "My Portfolio", icon: BarChart3 },
  { label: "Player Stats", icon: Activity },
  { label: "Analytics", icon: ChartNoAxesCombined },
  { label: "Saved Matches", icon: Bookmark },
  { label: "Settings", icon: SlidersHorizontal },
  { label: "My Profile", icon: UserRound },
];

const trend = [
  { label: "Mon", value: 42 },
  { label: "Tue", value: 57 },
  { label: "Wed", value: 48 },
  { label: "Thu", value: 68 },
  { label: "Fri", value: 59 },
  { label: "Sat", value: 82 },
  { label: "Sun", value: 74 },
];

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand">
      <div className="brand-mark">
        <Activity size={21} strokeWidth={2.5} />
      </div>
      {!compact && (
        <div className="brand-copy">
          <span>ShuttleMetrics</span>
          <small>PLAYER PERFORMANCE</small>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  note,
  icon: Icon,
  tone,
  direction = "up",
}: {
  title: string;
  value: string;
  note: string;
  icon: typeof Activity;
  tone: "teal" | "blue" | "orange" | "purple";
  direction?: "up" | "down";
}) {
  const TrendIcon = direction === "up" ? ArrowUpRight : ArrowDownRight;

  return (
    <article className="metric-card">
      <div className="metric-top">
        <div className={`metric-icon ${tone}`}>
          <Icon size={19} />
        </div>
        <span className={`trend-pill ${direction === "down" ? "neutral" : ""}`}>
          <TrendIcon size={13} />
          {note}
        </span>
      </div>
      <p className="metric-title">{title}</p>
      <div className="metric-value">{value}</div>
    </article>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: typeof Activity;
  title: string;
  description: string;
  action: string;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon size={26} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      <button className="button-primary" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
        {action} <ArrowRight size={16} />
      </button>
    </div>
  );
}

export default function HomePage() {
  const [activePage, setActivePage] = useState<Page>("Home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [playingLevel, setPlayingLevel] = useState("Intermediate");
  const [playingStyle, setPlayingStyle] = useState("Attacking");
  const [profileImage, setProfileImage] = useState("");
  const [opponent, setOpponent] = useState("");
  const [matchResult, setMatchResult] = useState<"Won" | "Lost">("Won");
  const [matchScore, setMatchScore] = useState("");
  const [unforced, setUnforced] = useState("8");
  const [forced, setForced] = useState("12");
  const [smashes, setSmashes] = useState("15");
  const [notice, setNotice] = useState("");
  const [playerOne, setPlayerOne] = useState("");
  const [playerTwo, setPlayerTwo] = useState("");
  const [prediction, setPrediction] = useState(false);
  const [predictionPlayers, setPredictionPlayers] = useState<string[]>([]);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<null | {
    player: { name: string; previous_win_rate: number; recent_form: number; strength_score: number };
    competitive: Array<{ name: string; previous_win_rate: number; recent_form: number; strength_score: number }>;
    favorable: Array<{ name: string; previous_win_rate: number; recent_form: number; strength_score: number }>;
    challenging: Array<{ name: string; previous_win_rate: number; recent_form: number; strength_score: number }>;
    method: string;
  }>(null);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [predictionError, setPredictionError] = useState("");
  const [predictionResult, setPredictionResult] = useState<null | {
    player1: string; player2: string; predicted_winner: string;
    confidence_percent: number | null;
    player1_previous_win_rate: number; player2_previous_win_rate: number;
    player1_recent_form: number; player2_recent_form: number;
    head_to_head_player1_win_rate: number; disclaimer: string;
  }>(null);
  const [search, setSearch] = useState("");
  const [supabase] = useState<SupabaseClient | null>(() => getSupabase());
  const [session, setSession] = useState<Session | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authUsername, setAuthUsername] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [settingsCompact, setSettingsCompact] = useState(false);
  const [settingsTips, setSettingsTips] = useState(true);
  const [settingsConfirmSignOut, setSettingsConfirmSignOut] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }
    let alive = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!alive) return;
      if (error) setAuthError(error.message);
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setMatches([]);
        setPlayerName("");
        setPlayingLevel("Intermediate");
        setPlayingStyle("Attacking");
        setProfileImage("");
      }
    });
    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !session?.user) return;
    let alive = true;
    (async () => {
      const user = session.user;
      const metadataName = typeof user.user_metadata?.username === "string" ? user.user_metadata.username : "";
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, playing_level, playing_style, profile_image")
        .eq("id", user.id)
        .maybeSingle();
      if (!alive) return;
      if (profileError) setNotice(`Could not load profile: ${profileError.message}`);
      if (profile) {
        const p = profile as ProfileRow;
        setPlayerName(p.username || metadataName || user.email?.split("@")[0] || "Player");
        setPlayingLevel(p.playing_level || "Intermediate");
        setPlayingStyle(p.playing_style || "Attacking");
        setProfileImage(p.profile_image || "");
      } else {
        const username = metadataName || user.email?.split("@")[0] || "Player";
        setPlayerName(username);
        const { error: insertError } = await supabase.from("profiles").upsert({
          id: user.id, username, playing_level: "Intermediate", playing_style: "Attacking", profile_image: null,
        }, { onConflict: "id" });
        if (insertError && alive) setNotice(`Could not create profile: ${insertError.message}`);
      }
      const { data: rows, error: matchesError } = await supabase
        .from("matches")
        .select("id, user_id, opponent, played_at, result, score, unforced, forced, smashes")
        .eq("user_id", user.id)
        .order("played_at", { ascending: false });
      if (!alive) return;
      if (matchesError) {
        setNotice(`Could not load match history: ${matchesError.message}`);
        return;
      }
      setMatches(((rows || []) as MatchRow[]).map((m) => ({
        id: m.id, opponent: m.opponent,
        date: new Date(m.played_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        result: m.result, score: m.score, unforced: m.unforced, forced: m.forced, smashes: m.smashes,
      })));
    })();
    return () => { alive = false; };
  }, [supabase, session?.user?.id]);

  function handleDemoLogin() {
    setDemoMode(true);
    setSession(null);
    setPlayerName("Demo Player");
    setPlayingLevel("Intermediate");
    setPlayingStyle("Attacking");
    setProfileImage("");
    setMatches(demoMatches);
    setActivePage("Home");
    setNotice("Demo workspace: sample data only. Changes are not saved.");
    setAuthError("");
  }

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError("");
    if (authMode === "login" && authEmail.trim().toLowerCase() === "demo@shuttlemetrics.app" && authPassword === "ShuttleDemo2026!") {
      handleDemoLogin();
      return;
    }
    if (!supabase) {
      setAuthError("Supabase environment variables are missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in Vercel, then redeploy.");
      return;
    }
    if (authMode === "signup" && authUsername.trim().length < 3) {
      setAuthError("Choose a username with at least 3 characters.");
      return;
    }
    setAuthBusy(true);
    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail.trim(), password: authPassword,
          options: { data: { username: authUsername.trim() } },
        });
        if (error) throw error;
        if (data.session) {
          setSession(data.session);
          setNotice("Account created. Welcome to ShuttleMetrics!");
        } else {
          setAuthError("Account created. Check your email to confirm the account, then log in.");
          setAuthMode("login");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail.trim(), password: authPassword });
        if (error) throw error;
        setSession(data.session);
        setNotice("Welcome back!");
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Authentication failed. Please try again.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleSignOut() {
    if (demoMode) {
      setDemoMode(false);
      setMatches([]);
      setPlayerName("");
      setNotice("");
      setActivePage("Home");
      return;
    }
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) setNotice(`Could not sign out: ${error.message}`);
    else {
      setSession(null);
      setActivePage("Home");
      setNotice("");
    }
  }

  const totalMatches = matches.length;
  const wins = matches.filter((match) => match.result === "Won").length;
  const winRate = totalMatches ? Math.round((wins / totalMatches) * 100) : 0;
  const avgSmashes = totalMatches
    ? (matches.reduce((sum, match) => sum + match.smashes, 0) / totalMatches).toFixed(1)
    : "0.0";
  const avgErrors = totalMatches
    ? (
        matches.reduce((sum, match) => sum + match.unforced, 0) / totalMatches
      ).toFixed(1)
    : "0.0";

  const filteredMatches = matches.filter((match) =>
    match.opponent.toLowerCase().includes(search.toLowerCase()),
  );

  function goToPage(page: Page) {
    setActivePage(page);
    setMobileMenuOpen(false);
    setNotice("");
    setPrediction(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveMatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (demoMode) {
      setNotice("Demo mode is read-only. Log in with your own account to save match history.");
      return;
    }
    if (!supabase || !session?.user) {
      setNotice("Please log in before recording a match.");
      return;
    }
    if (!opponent.trim()) {
      setNotice("Please enter your opponent's name.");
      return;
    }
    const row = {
      user_id: session.user.id,
      opponent: opponent.trim(),
      played_at: new Date().toISOString(),
      result: matchResult,
      score: matchScore.trim() || "Score not entered",
      unforced: Math.max(0, Number(unforced) || 0),
      forced: Math.max(0, Number(forced) || 0),
      smashes: Math.max(0, Number(smashes) || 0),
    };
    const { data, error } = await supabase.from("matches").insert(row).select("id, opponent, played_at, result, score, unforced, forced, smashes").single();
    if (error) {
      setNotice(`Could not save match: ${error.message}`);
      return;
    }
    const m = data as MatchRow;
    const newMatch: Match = {
      id: m.id, opponent: m.opponent,
      date: new Date(m.played_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      result: m.result, score: m.score, unforced: m.unforced, forced: m.forced, smashes: m.smashes,
    };
    setMatches((current) => [newMatch, ...current]);
    setOpponent(""); setMatchScore(""); setUnforced("0"); setForced("0"); setSmashes("0");
    setNotice("Match saved to your account.");
  }

  const rawPredictionApiUrl = process.env.NEXT_PUBLIC_PREDICTION_API_URL || "";
  const predictionApiUrl = rawPredictionApiUrl.endsWith("/")
    ? rawPredictionApiUrl.slice(0, -1)
    : rawPredictionApiUrl;

  useEffect(() => {
    if (!predictionApiUrl) {
      setPredictionError("Prediction service is not configured yet. Deploy the Python API and add NEXT_PUBLIC_PREDICTION_API_URL in Vercel.");
      return;
    }
    let active = true;
    fetch(`${predictionApiUrl}/players`)
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.detail || "Could not load historical players.");
        return body as { players?: string[] };
      })
      .then((body) => {
        if (!active) return;
        const names = Array.isArray(body.players) ? body.players : [];
        setPredictionPlayers(names);
        setPredictionError(names.length ? "" : "The model did not provide a player list.");
        if (names.length >= 2) {
          setPlayerOne((current) => current && names.includes(current) ? current : names[0]);
          setPlayerTwo((current) => current && names.includes(current) && current !== names[0] ? current : names[1]);
        }
      })
      .catch((error) => {
        if (active) setPredictionError(error instanceof Error ? error.message : "Could not connect to the prediction service.");
      });
    return () => { active = false; };
  }, [predictionApiUrl]);

  useEffect(() => {
    // Only request matchup recommendations for a complete player name from the historical dataset.
    // While the user types a partial name, the datalist below offers matching dataset names.
    if (!predictionApiUrl || !playerOne || !predictionPlayers.includes(playerOne)) {
      setRecommendations(null);
      setRecommendationsLoading(false);
      return;
    }
    let active = true;
    setRecommendationsLoading(true);
    fetch(`${predictionApiUrl}/recommendations?player=${encodeURIComponent(playerOne)}`)
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.detail || "Could not load player recommendations.");
        return body as NonNullable<typeof recommendations>;
      })
      .then((body) => { if (active) setRecommendations(body); })
      .catch(() => { if (active) setRecommendations(null); })
      .finally(() => { if (active) setRecommendationsLoading(false); });
    return () => { active = false; };
  }, [predictionApiUrl, playerOne, predictionPlayers]);

  async function runDemoPrediction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPrediction(false);
    setPredictionResult(null);
    setPredictionError("");

    if (!predictionApiUrl) {
      setPredictionError("Prediction service is not configured. Deploy the Python API and add NEXT_PUBLIC_PREDICTION_API_URL in Vercel.");
      return;
    }
    if (!playerOne || !playerTwo || playerOne === playerTwo) {
      setPredictionError("Choose two different players from the model's historical player list.");
      return;
    }

    setPredictionLoading(true);
    try {
      const response = await fetch(`${predictionApiUrl}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player1: playerOne, player2: playerTwo }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail || "Prediction failed.");
      setPredictionResult(body);
      setPrediction(true);
    } catch (error) {
      setPredictionError(error instanceof Error ? error.message : "Could not calculate the prediction.");
    } finally {
      setPredictionLoading(false);
    }
  }

  function renderHome() {
    return (
      <>
        <section className="welcome-banner">
          <div className="welcome-content">
            <span className="eyebrow light-eyebrow">
              <Sparkles size={14} /> YOUR PERFORMANCE HUB
            </span>
            <h2>Welcome back, {playerName || "Player"}!</h2>
            <p>Analyze. Predict. Improve. Your badminton performance companion.</p>
            <button
              className="button-white"
              onClick={() => goToPage("Record Match")}
            >
              Record a match <ArrowRight size={16} />
            </button>
          </div>
          <div className="banner-art" aria-hidden="true">
            <div className="art-circle circle-one" />
            <div className="art-circle circle-two" />
            <div className="art-orbit">
              <div className="art-shuttle">
                <Activity size={46} strokeWidth={1.2} />
              </div>
            </div>
            <div className="art-label">
              <Zap size={14} /> BUILT FOR YOUR GAME
            </div>
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <div>
              <span className="eyebrow">YOUR OVERVIEW</span>
              <h2>Performance at a glance</h2>
              <p>A quick look at your match history.</p>
            </div>
            <button
              className="button-outline desktop-only"
              onClick={() => goToPage("My Portfolio")}
            >
              Full analytics <ArrowRight size={15} />
            </button>
          </div>

          <div className="metrics-grid">
            <MetricCard
              title="Matches played"
              value={String(totalMatches)}
              note="All records"
              icon={Trophy}
              tone="teal"
            />
            <MetricCard
              title="Win rate"
              value={`${winRate}%`}
              note={`${wins} wins`}
              icon={Target}
              tone="blue"
            />
            <MetricCard
              title="Avg. smash winners"
              value={avgSmashes}
              note="Per match"
              icon={Zap}
              tone="orange"
            />
            <MetricCard
              title="Avg. unforced errors"
              value={avgErrors}
              note="Per match"
              icon={Activity}
              tone="purple"
              direction="down"
            />
          </div>
        </section>

        <div className="dashboard-grid">
          <section className="panel performance-panel">
            <div className="panel-heading">
              <div>
                <h3>Activity overview</h3>
                <p>Illustrative weekly activity</p>
              </div>
              <button
                className="icon-button"
                aria-label="Open portfolio"
                onClick={() => goToPage("My Portfolio")}
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="chart-summary">
              <div>
                <span className="chart-big-number">{totalMatches}</span>
                <span className="chart-caption"> matches recorded</span>
              </div>
              <span className="chart-tag">
                <TrendingUp size={14} /> Sample trend
              </span>
            </div>
            <div className="bar-chart" aria-label="Illustrative weekly activity chart">
              {trend.map((item) => (
                <div className="bar-column" key={item.label}>
                  <div className="bar-track">
                    <div
                      className={`bar-fill ${item.label === "Sat" ? "highlight" : ""}`}
                      style={{ height: `${item.value}%` }}
                    />
                  </div>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
            <p className="chart-disclaimer">
              Sample visualization only; connect real activity data later.
            </p>
          </section>

          <section className="panel quick-panel">
            <div className="panel-heading">
              <div>
                <h3>Quick actions</h3>
                <p>What would you like to do?</p>
              </div>
            </div>
            <button
              className="action-row"
              onClick={() => goToPage("Record Match")}
            >
              <div className="action-icon teal">
                <Plus size={18} />
              </div>
              <div>
                <strong>Record a match</strong>
                <span>Add your latest match stats</span>
              </div>
              <ChevronRight size={18} />
            </button>
            <button
              className="action-row"
              onClick={() => goToPage("My Portfolio")}
            >
              <div className="action-icon blue">
                <BarChart3 size={18} />
              </div>
              <div>
                <strong>View my portfolio</strong>
                <span>Explore your match history</span>
              </div>
              <ChevronRight size={18} />
            </button>
            <button
              className="action-row"
              onClick={() => goToPage("Match Prediction")}
            >
              <div className="action-icon orange">
                <Target size={18} />
              </div>
              <div>
                <strong>Match prediction</strong>
                <span>Prepare for your next matchup</span>
              </div>
              <ChevronRight size={18} />
            </button>
            <button
              className="action-row"
              onClick={() => goToPage("My Profile")}
            >
              <div className="action-icon purple">
                <UserRound size={18} />
              </div>
              <div>
                <strong>Edit player profile</strong>
                <span>Update your player details</span>
              </div>
              <ChevronRight size={18} />
            </button>
          </section>
        </div>

        <section className="panel recent-panel">
          <div className="panel-heading">
            <div>
              <h3>Recent matches</h3>
              <p>Your latest match records</p>
            </div>
            <button
              className="button-outline"
              onClick={() => goToPage("My Portfolio")}
            >
              View all <ArrowRight size={15} />
            </button>
          </div>
          {renderMatchList(matches.slice(0, 3), false)}
        </section>
      </>
    );
  }

  function renderMatchList(items: Match[], showStats: boolean) {
    if (!items.length) {
      return (
        <div className="inline-empty">
          <CalendarDays size={22} />
          <p>No matches found.</p>
        </div>
      );
    }

    return (
      <div className="match-list">
        {items.map((match) => (
          <article className="match-row" key={match.id}>
            <div className={`result-mark ${match.result.toLowerCase()}`}>
              {match.result === "Won" ? (
                <Check size={17} />
              ) : (
                <X size={17} />
              )}
            </div>
            <div className="match-main">
              <strong>vs. {match.opponent}</strong>
              <span>
                <CalendarDays size={13} /> {match.date}
              </span>
              {showStats && (
                <span className="match-stats">
                  Unforced: {match.unforced} · Forced: {match.forced} ·
                  Smashes: {match.smashes}
                </span>
              )}
            </div>
            <div className="match-right">
              <span className={`result-label ${match.result.toLowerCase()}`}>
                {match.result}
              </span>
              <strong className="match-score">{match.score}</strong>
            </div>
          </article>
        ))}
      </div>
    );
  }

  function renderProfile() {
    return (
      <section className="content-panel">
        <div className="page-intro">
          <span className="eyebrow">PLAYER DETAILS</span>
          <h2>My Player Profile</h2>
          <p>Your playing identity, all in one place.</p>
        </div>
        <div className="panel profile-panel">
          <div className="profile-avatar-wrap">
            {profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="profile-avatar" src={profileImage} alt="Player profile" />
            ) : (
              <div className="profile-avatar avatar-placeholder">
                <UserRound size={34} />
              </div>
            )}
            <div>
              <h3>{playerName || "Your Player Profile"}</h3>
              <p>Badminton player</p>
              <label className="upload-label">
                Change profile picture
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      if (file.size > 2 * 1024 * 1024) {
                        setNotice("Please choose an image smaller than 2 MB.");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => {
                        const imageData = typeof reader.result === "string" ? reader.result : "";
                        setProfileImage(imageData);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
          </div>
          <form
            className="form-grid"
            onSubmit={async (event) => {
              event.preventDefault();
              if (demoMode) {
                setNotice("Demo mode is read-only. Log in with your own account to save profile changes.");
                return;
              }
              if (!supabase || !session?.user) {
                setNotice("Please log in before saving your profile.");
                return;
              }
              const username = playerName.trim();
              if (username.length < 3) {
                setNotice("Username must contain at least 3 characters.");
                return;
              }
              const { error } = await supabase.from("profiles").upsert({
                id: session.user.id,
                username,
                playing_level: playingLevel,
                playing_style: playingStyle,
                profile_image: profileImage || null,
                updated_at: new Date().toISOString(),
              }, { onConflict: "id" });
              if (error) setNotice(`Could not save profile: ${error.message}`);
              else {
                await supabase.auth.updateUser({ data: { username } });
                setNotice("Profile saved to your account.");
              }
            }}
          >
            <label className="field full-width">
              <span>Player name</span>
              <input
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
                placeholder="Enter your name"
                maxLength={80}
                required
              />
            </label>
            <label className="field">
              <span>Playing level</span>
              <select
                value={playingLevel}
                onChange={(event) => setPlayingLevel(event.target.value)}
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
                <option>Competitive</option>
              </select>
            </label>
            <label className="field">
              <span>Playing style</span>
              <select
                value={playingStyle}
                onChange={(event) => setPlayingStyle(event.target.value)}
              >
                <option>Attacking</option>
                <option>Defensive</option>
                <option>All-round</option>
                <option>Control and placement</option>
              </select>
            </label>
            <div className="form-actions full-width">
              <button type="submit" className="button-primary">
                Save profile <Check size={16} />
              </button>
            </div>
          </form>
          <p className="form-note">
            Your username and playing preferences are saved to your signed-in account. Match history is stored separately and belongs only to this account.
          </p>
        </div>
      </section>
    );
  }

  function renderRecordMatch() {
    return (
      <section className="content-panel">
        <div className="page-intro">
          <span className="eyebrow">MATCH TRACKING</span>
          <h2>Record a match</h2>
          <p>Capture the details that help you understand your game.</p>
        </div>
        <div className="panel form-panel">
          <form onSubmit={saveMatch} className="form-grid">
            <label className="field full-width">
              <span>Opponent name *</span>
              <input
                value={opponent}
                onChange={(event) => setOpponent(event.target.value)}
                placeholder="Enter opponent's name"
                maxLength={80}
                required
              />
            </label>
            <label className="field">
              <span>Match result *</span>
              <select
                value={matchResult}
                onChange={(event) =>
                  setMatchResult(event.target.value as "Won" | "Lost")
                }
              >
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
              </select>
            </label>
            <label className="field">
              <span>Score</span>
              <input
                value={matchScore}
                onChange={(event) => setMatchScore(event.target.value)}
                placeholder="e.g. 21–17, 21–14"
                maxLength={60}
              />
            </label>
            <div className="form-section-title full-width">
              <Activity size={17} /> Performance statistics
            </div>
            <label className="field">
              <span>Unforced errors</span>
              <input
                type="number"
                min="0"
                max="999"
                value={unforced}
                onChange={(event) => setUnforced(event.target.value)}
                required
              />
              <small>Errors made without opponent pressure</small>
            </label>
            <label className="field">
              <span>Forced errors</span>
              <input
                type="number"
                min="0"
                max="999"
                value={forced}
                onChange={(event) => setForced(event.target.value)}
                required
              />
              <small>Errors induced by your pressure</small>
            </label>
            <label className="field">
              <span>Smash winners</span>
              <input
                type="number"
                min="0"
                max="999"
                value={smashes}
                onChange={(event) => setSmashes(event.target.value)}
                required
              />
              <small>Smashes ending the rally in your favor</small>
            </label>
            <div className="form-actions full-width">
              <button type="submit" className="button-primary">
                Save match <Check size={16} />
              </button>
            </div>
          </form>
          <p className="form-note">
            Saved matches remain in your account when you log out and return later. Other users cannot access your records.
          </p>
        </div>
      </section>
    );
  }

  function renderPortfolio() {
    return (
      <section className="content-panel">
        <div className="page-intro">
          <span className="eyebrow">YOUR MATCH HISTORY</span>
          <h2>My Portfolio</h2>
          <p>Review results and compare your performance over time.</p>
        </div>
        <div className="metrics-grid portfolio-metrics">
          <MetricCard
            title="Matches played"
            value={String(totalMatches)}
            note="Recorded"
            icon={Trophy}
            tone="teal"
          />
          <MetricCard
            title="Win rate"
            value={`${winRate}%`}
            note={`${wins} wins`}
            icon={Target}
            tone="blue"
          />
          <MetricCard
            title="Avg. smash winners"
            value={avgSmashes}
            note="Per match"
            icon={Zap}
            tone="orange"
          />
          <MetricCard
            title="Avg. unforced errors"
            value={avgErrors}
            note="Per match"
            icon={Activity}
            tone="purple"
            direction="down"
          />
        </div>
        <section className="panel portfolio-comparison">
          <div className="panel-heading">
            <div>
              <h3>Latest match vs. previous-match average</h3>
              <p>Lower unforced errors and higher smash winners are generally desirable.</p>
            </div>
          </div>
          {matches.length > 1 ? (
            <div className="comparison-grid">
              {[
                {
                  title: "Unforced errors",
                  latest: matches[0].unforced,
                  average:
                    matches.slice(1).reduce((sum, match) => sum + match.unforced, 0) /
                    (matches.length - 1),
                  lowerIsBetter: true,
                },
                {
                  title: "Forced errors",
                  latest: matches[0].forced,
                  average:
                    matches.slice(1).reduce((sum, match) => sum + match.forced, 0) /
                    (matches.length - 1),
                  lowerIsBetter: false,
                },
                {
                  title: "Smash winners",
                  latest: matches[0].smashes,
                  average:
                    matches.slice(1).reduce((sum, match) => sum + match.smashes, 0) /
                    (matches.length - 1),
                  lowerIsBetter: false,
                },
              ].map((item) => {
                const improved = item.lowerIsBetter
                  ? item.latest < item.average
                  : item.latest > item.average;
                return (
                  <article className="comparison-item" key={item.title}>
                    <span>{item.title}</span>
                    <strong>{item.latest}</strong>
                    <div className="comparison-track">
                      <div
                        className="comparison-fill"
                        style={{
                          width: `${Math.min(
                            100,
                            (item.latest / Math.max(item.latest, item.average, 1)) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                    <small>
                      Previous average: {item.average.toFixed(1)}
                    </small>
                    <span className={`comparison-status ${improved ? "positive" : "neutral"}`}>
                      {improved ? "Better than average" : "At or below comparison target"}
                    </span>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="inline-empty">
              Record at least two matches to compare your latest match with
              previous-match averages.
            </p>
          )}
          <p className="form-note">
            Forced-error counts depend on opponent pressure and match context;
            they should not be interpreted as a simple measure of good or bad
            performance.
          </p>
        </section>
        <section className="panel recent-panel">
          <div className="panel-heading">
            <div>
              <h3>All matches</h3>
              <p>{matches.length} saved records</p>
            </div>
            <label className="search-field">
              <Search size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search opponent"
                aria-label="Search opponent"
              />
            </label>
          </div>
          {renderMatchList(filteredMatches, true)}
        </section>
      </section>
    );
  }

  function renderPrediction() {
    return (
      <section className="content-panel">
        <div className="page-intro">
          <span className="eyebrow">MATCH INTELLIGENCE</span>
          <h2>Match Prediction</h2>
          <p>Prepare for a matchup with the ShuttleMetrics prediction engine.</p>
        </div>
        <div className="prediction-banner">
          <div className="prediction-banner-icon">
            <Target size={28} />
          </div>
          <div>
            <span className="eyebrow light-eyebrow">MODEL-POWERED INSIGHTS</span>
            <h3>Every matchup has a story.</h3>
            <p>
              Compare players using historical form and head-to-head signals.
            </p>
          </div>
        </div>
        <section className="panel form-panel">
          <div className="panel-heading">
            <div>
              <h3>Set up a matchup</h3>
              <p>Enter both players to prepare a prediction request.</p>
            </div>
            <div className="metric-icon teal">
              <Sparkles size={19} />
            </div>
          </div>
          <form onSubmit={runDemoPrediction} className="form-grid">
            <label className="field">
              <span>Player 1</span>
              <input
                list="historical-player-names"
                value={playerOne}
                onChange={(event) => { setPlayerOne(event.target.value); setPrediction(false); setPredictionResult(null); }}
                placeholder={predictionPlayers.length ? "Start typing a player name…" : "Loading historical players…"}
                autoComplete="off"
                required
                disabled={!predictionPlayers.length || predictionLoading}
              />
              <small>Type to see matching names from the historical dataset.</small>
            </label>
            <label className="field">
              <span>Player 2</span>
              <input
                list="historical-player-names"
                value={playerTwo}
                onChange={(event) => { setPlayerTwo(event.target.value); setPrediction(false); setPredictionResult(null); }}
                placeholder={predictionPlayers.length ? "Start typing a player name…" : "Loading historical players…"}
                autoComplete="off"
                required
                disabled={!predictionPlayers.length || predictionLoading}
              />
              <small>Choose a name that appears in the dataset suggestions.</small>
            </label>
            <datalist id="historical-player-names">
              {predictionPlayers.map((name) => <option key={name} value={name} />)}
            </datalist>
            <div className="full-width form-actions">
              <button type="submit" className="button-primary" disabled={predictionLoading || predictionPlayers.length < 2}>
                {predictionLoading ? "Calculating…" : "Run real prediction"} <ArrowRight size={16} />
              </button>
            </div>
          </form>
          {playerOne && (
            <section className="panel" style={{ marginTop: 18, padding: 22 }}>
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">SMART MATCHUP SUGGESTIONS</span>
                  <h3 style={{ marginTop: 8 }}>Who should {playerOne} play?</h3>
                  <p>Recommendations use the model's historical win rates and recent form.</p>
                </div>
                <div className="metric-icon teal"><Sparkles size={19} /></div>
              </div>
              {recommendationsLoading && <p role="status">Finding historical matchups…</p>}
              {!recommendationsLoading && recommendations && (
                <div className="form-grid" style={{ marginTop: 16 }}>
                  {([
                    ["competitive", "Competitive matchups", "Players with similar historical strength", Target],
                    ["favorable", "Favorable matchups", "Opponents with lower historical strength", TrendingUp],
                    ["challenging", "Challenging matchups", "Opponents with higher historical strength", Zap],
                  ] as const).map(([key, title, description, Icon]) => (
                    <div key={key} className="panel" style={{ padding: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Icon size={18} />
                        <strong>{title}</strong>
                      </div>
                      <p style={{ fontSize: 12, color: "var(--muted, #64748b)", margin: "7px 0 12px" }}>{description}</p>
                      {recommendations[key].length ? recommendations[key].map((item) => (
                        <div key={item.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 0", borderTop: "1px solid var(--border, #e2e8f0)" }}>
                          <div style={{ minWidth: 0 }}>
                            <strong style={{ display: "block", fontSize: 13, overflowWrap: "anywhere" }}>{item.name}</strong>
                            <span style={{ display: "block", fontSize: 11, color: "var(--muted, #64748b)", marginTop: 4 }}>Win rate {item.previous_win_rate.toFixed(1)}% · Recent form {item.recent_form.toFixed(1)}%</span>
                          </div>
                          <button type="button" className="button-outline" style={{ whiteSpace: "nowrap", padding: "8px 10px", fontSize: 12 }} onClick={() => { setPlayerTwo(item.name); setPrediction(false); setPredictionResult(null); setPredictionError(""); }}>Select</button>
                        </div>
                      )) : <p style={{ fontSize: 12 }}>Not enough historical data for this category.</p>}
                    </div>
                  ))}
                </div>
              )}
              {recommendations && <p style={{ color: "var(--muted, #64748b)", fontSize: 11, marginTop: 12 }}>{recommendations.method}</p>}
            </section>
          )}
          {predictionError && (
            <div className="demo-notice">
              <CircleHelp size={20} />
              <div><strong>Prediction service unavailable</strong><p>{predictionError}</p></div>
            </div>
          )}
          {prediction && predictionResult && (
            <div className="panel" style={{ marginTop: 18, padding: 22 }}>
              <span className="eyebrow">MODEL OUTPUT</span>
              <h3 style={{ marginTop: 10, fontSize: 24 }}>Predicted winner: {predictionResult.predicted_winner}</h3>
              {predictionResult.confidence_percent !== null && <p>Model confidence for predicted class: <strong>{predictionResult.confidence_percent.toFixed(1)}%</strong></p>}
              <div className="form-grid" style={{ marginTop: 18 }}>
                <div><span className="field-label">Previous win rate</span><p><strong>{predictionResult.player1}: {predictionResult.player1_previous_win_rate.toFixed(1)}%</strong></p><p><strong>{predictionResult.player2}: {predictionResult.player2_previous_win_rate.toFixed(1)}%</strong></p></div>
                <div><span className="field-label">Recent form</span><p><strong>{predictionResult.player1}: {predictionResult.player1_recent_form.toFixed(1)}%</strong></p><p><strong>{predictionResult.player2}: {predictionResult.player2_recent_form.toFixed(1)}%</strong></p></div>
                <div className="full-width"><span className="field-label">Head-to-head</span><p>Player 1 historical win rate: <strong>{predictionResult.head_to_head_player1_win_rate.toFixed(1)}%</strong></p><p style={{ color: "var(--muted, #64748b)", fontSize: 12 }}>{predictionResult.disclaimer}</p></div>
              </div>
            </div>
          )}
          <div className="model-info">
            <div>
              <Check size={16} /> Existing model to be preserved
            </div>
            <div>
              <Check size={16} /> Historical form features
            </div>
            <div>
              <Check size={16} /> Head-to-head feature
            </div>
          </div>
        </section>
      </section>
    );
  }


  function renderPlayerStats() {
    const totalPoints = matches.reduce((sum, match) => sum + match.smashes + match.forced, 0);
    const averageForced = totalMatches ? matches.reduce((sum, match) => sum + match.forced, 0) / totalMatches : 0;
    const bestSmashMatch = matches.length ? [...matches].sort((a, b) => b.smashes - a.smashes)[0] : null;
    const stats = [
      { label: "Matches played", value: String(totalMatches), detail: "Recorded matches", icon: Trophy, tone: "teal" as const },
      { label: "Win rate", value: `${winRate}%`, detail: `${wins} wins · ${totalMatches - wins} losses`, icon: Target, tone: "blue" as const },
      { label: "Smash winners", value: String(matches.reduce((sum, match) => sum + match.smashes, 0)), detail: `${avgSmashes} per match`, icon: Zap, tone: "orange" as const },
      { label: "Unforced errors", value: String(matches.reduce((sum, match) => sum + match.unforced, 0)), detail: `${avgErrors} per match`, icon: Activity, tone: "purple" as const },
    ];
    return (
      <section className="content-panel">
        <div className="page-intro"><span className="eyebrow">PLAYER DEVELOPMENT</span><h2>Player Stats</h2><p>A clear snapshot of the habits shaping your game.</p></div>
        <div className="metrics-grid">{stats.map((item) => <MetricCard key={item.label} title={item.label} value={item.value} note={item.detail} icon={item.icon} tone={item.tone} />)}</div>
        <div className="dashboard-grid">
          <section className="panel">
            <div className="panel-heading"><div><h3>Performance indicators</h3><p>Calculated from your recorded matches.</p></div><Activity size={20} /></div>
            {[
              { label: "Smash winners", value: Number(avgSmashes), max: 25, suffix: "per match" },
              { label: "Forced errors", value: averageForced, max: 25, suffix: "per match" },
              { label: "Unforced errors", value: Number(avgErrors), max: 25, suffix: "per match" },
            ].map((item) => <div className="stat-bar-row" key={item.label}><div className="stat-bar-label"><strong>{item.label}</strong><span>{item.value.toFixed(1)} {item.suffix}</span></div><div className="comparison-track"><div className="comparison-fill" style={{ width: `${Math.min(100, item.value / item.max * 100)}%` }} /></div></div>)}
            {!totalMatches && <p className="form-note">Record a match to start calculating your personal statistics.</p>}
          </section>
          <section className="panel">
            <div className="panel-heading"><div><h3>Match highlights</h3><p>Standout results from your log.</p></div><Trophy size={20} /></div>
            {bestSmashMatch ? <div className="highlight-card"><span className="eyebrow">MOST SMASH WINNERS</span><strong>{bestSmashMatch.smashes}</strong><p>against {bestSmashMatch.opponent}</p><span className={`result-label ${bestSmashMatch.result.toLowerCase()}`}>{bestSmashMatch.result}</span></div> : <EmptyState icon={Trophy} title="Your highlights will appear here" description="Save your first match to discover your strongest performances." action="Record a match" />}
            <div className="stat-summary-line"><span>Total attack points tracked</span><strong>{totalPoints}</strong></div>
          </section>
        </div>
        <section className="panel recent-panel"><div className="panel-heading"><div><h3>Recent performance</h3><p>Latest recorded matches and key statistics.</p></div><button className="button-outline" onClick={() => goToPage("Saved Matches")}>View matches <ArrowRight size={15} /></button></div>{renderMatchList(matches.slice(0, 5), true)}</section>
      </section>
    );
  }

  function renderAnalytics() {
    const resultRate = totalMatches ? (wins / totalMatches) * 100 : 0;
    const maxMetric = Math.max(1, ...matches.map((m) => m.smashes + m.forced + m.unforced));
    return (
      <section className="content-panel">
        <div className="page-intro"><span className="eyebrow">DATA & TRENDS</span><h2>Analytics</h2><p>Understand what your recorded match data says about your game.</p></div>
        <div className="metrics-grid">
          <MetricCard title="Win rate" value={`${resultRate.toFixed(0)}%`} note="All recorded matches" icon={Target} tone="teal" />
          <MetricCard title="Avg. smash winners" value={avgSmashes} note="Per match" icon={Zap} tone="orange" />
          <MetricCard title="Avg. forced errors" value={totalMatches ? (matches.reduce((s,m)=>s+m.forced,0)/totalMatches).toFixed(1) : "0.0"} note="Per match" icon={TrendingUp} tone="blue" />
          <MetricCard title="Avg. unforced errors" value={avgErrors} note="Per match" icon={Activity} tone="purple" direction="down" />
        </div>
        <div className="dashboard-grid">
          <section className="panel">
            <div className="panel-heading"><div><h3>Match-by-match workload</h3><p>Stacked activity indicators for each recorded match.</p></div><ChartNoAxesCombined size={20} /></div>
            {matches.length ? <div className="analytics-match-bars">{[...matches].reverse().map((m) => <div className="analytics-match" key={m.id}><div className="analytics-match-head"><strong>vs. {m.opponent}</strong><span>{m.result}</span></div><div className="comparison-track"><div className="comparison-fill" style={{width:`${Math.max(3,(m.smashes+m.forced+m.unforced)/maxMetric*100)}%`}} /></div><small>{m.smashes} smash winners · {m.forced} forced · {m.unforced} unforced</small></div>)}</div> : <EmptyState icon={ChartNoAxesCombined} title="No analytics yet" description="Record match results to populate your charts with real data." action="Record a match" />}
          </section>
          <section className="panel">
            <div className="panel-heading"><div><h3>Results breakdown</h3><p>Win/loss balance from your match log.</p></div><Trophy size={20} /></div>
            <div className="result-breakdown"><div className="result-breakdown-number"><strong>{wins}</strong><span>Wins</span></div><div className="result-breakdown-number"><strong>{totalMatches-wins}</strong><span>Losses</span></div></div>
            <div className="comparison-track breakdown-track"><div className="comparison-fill" style={{width:`${resultRate}%`}} /></div>
            <p className="form-note">These summaries reflect only matches saved in this account. They are descriptive statistics, not a prediction of future results.</p>
          </section>
        </div>
      </section>
    );
  }

  function renderSavedMatches() {
    return (
      <section className="content-panel">
        <div className="page-intro"><span className="eyebrow">MATCH ARCHIVE</span><h2>Saved Matches</h2><p>Browse the match records saved to your workspace.</p></div>
        <div className="panel recent-panel">
          <div className="panel-heading"><div><h3>Match archive</h3><p>{filteredMatches.length} of {matches.length} matches</p></div><label className="search-field"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search opponent" aria-label="Search saved matches" /></label></div>
          {renderMatchList(filteredMatches, true)}
          <div className="form-actions"><button className="button-primary" onClick={() => goToPage("Record Match")}><Plus size={16} /> Record a match</button></div>
        </div>
        <p className="form-note">Saved Matches shows the match records stored for your account. Demo mode uses sample records and does not save changes.</p>
      </section>
    );
  }

  function renderSettings() {
    return (
      <section className="content-panel">
        <div className="page-intro"><span className="eyebrow">WORKSPACE PREFERENCES</span><h2>Settings</h2><p>Manage local display preferences and account access.</p></div>
        <section className="panel settings-panel">
          <div className="settings-row"><div className="settings-row-icon"><SlidersHorizontal size={19} /></div><div className="settings-row-copy"><strong>Compact dashboard cards</strong><p>Reduce card spacing for a denser overview.</p></div><label className="switch-control"><input type="checkbox" checked={settingsCompact} onChange={(e) => setSettingsCompact(e.target.checked)} /><span /></label></div>
          <div className="settings-row"><div className="settings-row-icon"><Sparkles size={19} /></div><div className="settings-row-copy"><strong>Training tips</strong><p>Show helpful prompts around your workspace.</p></div><label className="switch-control"><input type="checkbox" checked={settingsTips} onChange={(e) => setSettingsTips(e.target.checked)} /><span /></label></div>
          <div className="settings-row"><div className="settings-row-icon"><CircleHelp size={19} /></div><div className="settings-row-copy"><strong>Confirm before signing out</strong><p>Keep account actions deliberate.</p></div><label className="switch-control"><input type="checkbox" checked={settingsConfirmSignOut} onChange={(e) => setSettingsConfirmSignOut(e.target.checked)} /><span /></label></div>
          <p className="form-note">These are UI preferences for this session and are not saved to your Supabase account yet.</p>
        </section>
        <section className="panel settings-panel">
          <div className="panel-heading"><div><h3>Account</h3><p>Profile and sign-in actions.</p></div><UserRound size={20} /></div>
          <button className="action-row" onClick={() => goToPage("My Profile")}><div className="action-icon teal"><UserRound size={18} /></div><div><strong>My Profile</strong><span>Update your player name and playing style</span></div><ChevronRight size={18} /></button>
          <button className="action-row" onClick={handleSignOut}><div className="action-icon purple"><X size={18} /></div><div><strong>Sign out</strong><span>End the current workspace session</span></div><ChevronRight size={18} /></button>
        </section>
      </section>
    );
  }

  function renderCurrentPage() {
    switch (activePage) {
      case "My Profile":
        return renderProfile();
      case "Record Match":
        return renderRecordMatch();
      case "My Portfolio":
        return renderPortfolio();
      case "Match Prediction":
        return renderPrediction();
      case "Player Stats":
        return renderPlayerStats();
      case "Analytics":
        return renderAnalytics();
      case "Saved Matches":
        return renderSavedMatches();
      case "Settings":
        return renderSettings();
      default:
        return renderHome();
    }
  }

  if (authLoading) {
    return <div className="auth-screen"><div className="auth-card"><div className="brand-mark"><Activity size={24} /></div><p>Loading your ShuttleMetrics workspace…</p></div><style jsx global>{`.auth-screen{min-height:100vh;display:grid;place-items:center;background:#08111f;color:#e8f0fb;font-family:Arial,sans-serif}.auth-card{width:min(420px,92vw);padding:32px;border:1px solid #26374d;background:#101c2d;border-radius:18px;text-align:center}.auth-card p{color:#aebdd0;font-size:14px}`}
/* Reference-matched visual pass: airy sports dashboard with photographic-style court accents */
.app-shell .welcome-banner{background:linear-gradient(100deg,#f3fbfc 0%,#e7f6f5 50%,#ccebe7 100%);color:#102a36;min-height:205px;padding:28px 30px;border:1px solid #d8eceb;box-shadow:0 12px 28px rgba(19,79,88,.06)}
.app-shell .welcome-banner:before{content:"";position:absolute;right:0;top:0;bottom:0;width:48%;background:radial-gradient(ellipse at 70% 55%,rgba(10,148,136,.25),transparent 62%),linear-gradient(120deg,transparent 20%,rgba(13,148,136,.08));clip-path:polygon(18% 0,100% 0,100% 100%,0 100%)}
.app-shell .welcome-banner:after{content:"";position:absolute;right:55px;top:18px;width:185px;height:165px;border-radius:50%;border:1px solid #0d94882b;box-shadow:0 0 0 16px #0d94880a,0 0 0 34px #0d948807}
.app-shell .welcome-content{max-width:60%;z-index:3}.app-shell .welcome-banner .light-eyebrow{color:#0d9488}.app-shell .welcome-banner h2{color:#102a36;font-size:clamp(29px,3vw,39px);max-width:480px;margin:12px 0 8px}.app-shell .welcome-banner p{color:#405b67;font-size:12px;line-height:1.7;margin-bottom:17px}
.app-shell .welcome-banner .button-white{background:#fff;color:#087f75;border:1px solid #dcece9;box-shadow:0 5px 15px #123b4a0b}
.app-shell .banner-art{z-index:2;right:48px;top:8px;width:245px;height:185px;opacity:1}.app-shell .art-circle{border-color:#0d94883a}.app-shell .art-orbit{border-color:#0d94884d}.app-shell .art-shuttle{background:linear-gradient(145deg,#0d9488,#155a64);border:1px solid #ffffff99;color:#fff;box-shadow:0 10px 25px #0d94882c}.app-shell .art-label{color:#087f75;background:#ffffffb8;border-color:#cce7e3}
.app-shell .section-heading h2{font-size:22px}.app-shell .metric-card{background:linear-gradient(145deg,#fff,#fafdfe);padding:16px 17px;border-radius:14px}.app-shell .metric-card:after{width:0}.app-shell .metric-icon.teal{background:#d9f7ef;color:#079b80}.app-shell .metric-icon.blue{background:#e0efff;color:#3288cb}.app-shell .metric-icon.orange{background:#fff0e2;color:#ed8b32}.app-shell .metric-icon.purple{background:#f0e7ff;color:#9164d9}
.app-shell .dashboard-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.app-shell .performance-panel,.app-shell .quick-panel,.app-shell .recent-panel{background:#fff}
.app-shell .prediction-banner{background:linear-gradient(100deg,#f0fbf9,#d8f3ec);color:#102a36;border:1px solid #d4eee7;box-shadow:none}.app-shell .prediction-banner-icon{background:#d2f1e9;color:#078e80}.app-shell .prediction-banner .light-eyebrow{color:#0d9488}.app-shell .prediction-banner h3{color:#102a36}.app-shell .prediction-banner p{color:#506b76}
.app-shell .form-panel{border-color:#e1eaee;box-shadow:0 8px 25px #123b4a08}.app-shell .form-panel .panel-heading h3{font-size:15px}
.app-shell .page-intro h2{letter-spacing:-.055em}.app-shell .page-intro p{max-width:650px}
.app-shell .form-grid{gap:16px}.app-shell .field input,.app-shell .field select,.app-shell .field textarea{background:#fff;border-color:#dce6eb;box-shadow:0 1px 2px #102a3605}
.app-shell .button-primary{background:linear-gradient(105deg,#0d9d8b,#078579);box-shadow:0 5px 12px #0d94881c}
.app-shell .panel .panel-heading{align-items:center}
@media(max-width:900px){.app-shell .welcome-content{max-width:72%}.app-shell .banner-art{right:0;opacity:.8}}
@media(max-width:560px){.app-shell .welcome-banner{min-height:195px;padding:22px 18px}.app-shell .welcome-content{max-width:100%}.app-shell .welcome-banner h2{font-size:27px;max-width:250px}.app-shell .welcome-banner p{max-width:250px}.app-shell .banner-art{right:-120px;opacity:.24}.app-shell .welcome-banner:after{right:-20px;opacity:.5}.app-shell .dashboard-grid{grid-template-columns:1fr}}

</style></div>;
  }

  if (!session && !demoMode) {
    return (
      <div className="auth-screen">
        <section className="auth-layout">
          <div className="auth-hero">
            <span className="auth-eyebrow">BADMINTON PERFORMANCE PLATFORM</span>
            <h1>Play with purpose.<br />Improve with evidence.</h1>
            <p>Keep your match history organized, understand your performance trends, and make each training session count.</p>
            <div className="auth-stats"><div><strong>01</strong><span>Track matches</span></div><div><strong>02</strong><span>Review trends</span></div><div><strong>03</strong><span>Plan training</span></div></div>
          </div>
          <div className="auth-form-wrap">
            <span className="auth-eyebrow">WELCOME TO SHUTTLEMETRICS</span>
            <h2>Your player workspace</h2>
            <p className="auth-subtitle">Sign in to continue, or create an account to start your performance log.</p>
            <div className="auth-tabs" role="tablist" aria-label="Account access">
              <button type="button" role="tab" aria-selected={authMode === "login"} className={authMode === "login" ? "selected" : ""} onClick={() => {setAuthMode("login"); setAuthError("");}}>Log in</button>
              <button type="button" role="tab" aria-selected={authMode === "signup"} className={authMode === "signup" ? "selected" : ""} onClick={() => {setAuthMode("signup"); setAuthError("");}}>Create account</button>
            </div>
            <form className="auth-form" onSubmit={handleAuth}>
              {authMode === "signup" && <label>Username<input autoComplete="username" value={authUsername} onChange={e => setAuthUsername(e.target.value)} placeholder="Choose a username" minLength={3} maxLength={40} required /></label>}
              <label>Email<input type="email" autoComplete="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="you@example.com" required /></label>
              <label>Password<input type="password" autoComplete={authMode === "login" ? "current-password" : "new-password"} value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="At least 6 characters" minLength={6} required /></label>
              {authError && <p className="auth-error" role="alert">{authError}</p>}
              <button className="auth-submit" type="submit" disabled={authBusy}>{authBusy ? "Please wait…" : authMode === "login" ? "Log in to workspace" : "Create your account"}<ArrowRight size={17} /></button>
            </form>
            <div className="demo-access">
              <div className="demo-access-heading"><span className="demo-access-icon"><Sparkles size={16} /></span><div><strong>Just looking around?</strong><small>Explore with sample matches. No account needed.</small></div></div>
              <div className="demo-credentials"><span><b>Email</b> demo@shuttlemetrics.app</span><button type="button" onClick={() => {setAuthMode("login");setAuthEmail("demo@shuttlemetrics.app");setAuthPassword("ShuttleDemo2026!");setAuthError("");}}>Use demo login</button></div>
              <div className="demo-password"><b>Password</b> ShuttleDemo2026!</div>
              <p>Demo mode is read-only. Your own matches stay private in your account.</p>
            </div>
            <p className="auth-footer">SHUTTLEMETRICS · PLAYER PERFORMANCE</p>
          </div>
        </section>
        <style jsx global>{`
.auth-screen{min-height:100vh;background:#08111f;color:#edf3fb;font-family:Arial,Helvetica,sans-serif;display:grid;place-items:center;padding:32px}.auth-layout{width:min(1480px,100%);display:grid;grid-template-columns:1.1fr .9fr;gap:64px;align-items:center}.auth-hero{padding:44px 42px;border:1px solid #29445b;border-radius:22px;background:radial-gradient(circle at 95% 0%,#174b5366,transparent 35%),linear-gradient(135deg,#10283b,#0e2d37);min-height:360px;display:flex;flex-direction:column;justify-content:center}.auth-eyebrow{font-size:10px;letter-spacing:.18em;font-weight:800;color:#22d3c0}.auth-hero h1{font-size:clamp(32px,4vw,54px);line-height:1.1;letter-spacing:-.045em;margin:28px 0 18px}.auth-hero p{max-width:610px;color:#cad7e6;line-height:1.8;font-size:14px}.auth-stats{display:flex;gap:34px;margin-top:22px}.auth-stats div{display:flex;flex-direction:column;gap:7px}.auth-stats strong{font-size:24px}.auth-stats span{font-size:12px;color:#afc5d9}.auth-form-wrap{max-width:560px;width:100%;margin:auto}.auth-form-wrap h2{font-size:clamp(27px,3vw,40px);margin:22px 0 12px;letter-spacing:-.04em}.auth-subtitle{color:#c3d0df;font-size:14px;line-height:1.7;margin-bottom:26px}.auth-tabs{display:grid;grid-template-columns:1fr 1fr;gap:5px;padding:5px;background:#0b1626;border:1px solid #29394e;border-radius:12px;margin-bottom:18px}.auth-tabs button{appearance:none;display:flex;align-items:center;justify-content:center;min-height:42px;padding:10px 14px;margin:0;border:1px solid transparent;border-radius:8px;color:#b9c5d5;background:transparent;font-family:inherit;font-size:13px;font-weight:600;line-height:1.2;cursor:pointer;transition:background .18s,color .18s,box-shadow .18s}.auth-tabs button:hover{background:#17273b;color:#fff}.auth-tabs button.selected{background:#1fd0b5;color:#06231f;border-color:#50e3cf;box-shadow:0 3px 12px #1fd0b522;font-weight:800}.auth-form{background:#101c2d;border:1px solid #29394e;border-radius:15px;padding:24px;display:flex;flex-direction:column;gap:17px}.auth-form label{display:flex;flex-direction:column;gap:9px;font-size:12px;color:#d5dfeb}.auth-form input{width:100%;box-sizing:border-box;border:1px solid #2a3a50;background:#0c1727;border-radius:9px;padding:13px 12px;color:#fff;outline:none}.auth-form input:focus{border-color:#22c9b4}.auth-submit{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:49px;padding:14px 18px;border:1px solid #35d5c2;border-radius:10px;background:linear-gradient(135deg,#20c9b3,#11a997);color:#052b27;font-weight:800;letter-spacing:.005em;cursor:pointer;box-shadow:0 7px 18px #17b9a51e;transition:transform .18s,box-shadow .18s,filter .18s}.auth-submit:hover:not(:disabled){transform:translateY(-1px);filter:brightness(1.04);box-shadow:0 10px 22px #17b9a52b}.auth-submit:active:not(:disabled){transform:translateY(0)}.auth-submit:disabled{opacity:.65;cursor:wait}.auth-form button:focus-visible,.auth-tabs button:focus-visible,.demo-access button:focus-visible{outline:3px solid #8ff8e8;outline-offset:3px}.demo-access{margin-top:14px;padding:15px;border:1px solid #2a4056;border-radius:13px;background:linear-gradient(135deg,#101f31,#0d1a2b)}.demo-access-heading{display:flex;align-items:center;gap:10px;margin-bottom:12px}.demo-access-icon{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;background:#1c3c4c;color:#7cf0df;flex-shrink:0}.demo-access-heading>div{display:flex;flex-direction:column;gap:3px}.demo-access-heading strong{font-size:12px;color:#edf6ff}.demo-access-heading small{font-size:10px;line-height:1.5;color:#a7bad0}.demo-credentials{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 11px;border:1px solid #2b4057;border-radius:9px;background:#0a1524}.demo-credentials span,.demo-password{font-size:11px;color:#c6d5e5;overflow-wrap:anywhere}.demo-credentials span{display:flex;flex-direction:column;gap:4px}.demo-credentials b,.demo-password b{font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:#8da5be}.demo-credentials button{flex-shrink:0;padding:8px 10px;border:1px solid #2c8d83;border-radius:8px;background:#123b3c;color:#a5fff1;font-size:10px;font-weight:800;cursor:pointer;transition:background .15s}.demo-credentials button:hover{background:#185250}.demo-password{margin-top:9px;display:flex;flex-direction:column;gap:4px}.demo-access>p{font-size:10px;line-height:1.55;color:#8fa5bc;margin:10px 0 0}.demo-mode-banner{display:flex;align-items:center;gap:9px;padding:11px 14px;margin-bottom:17px;border:1px solid #f2d8a0;border-radius:10px;background:#fff8e8;color:#805b14;font-size:12px}.demo-mode-banner strong{font-weight:800}.demo-mode-banner span{flex:1}.auth-error{background:#46232b;color:#ffd4d7;border-radius:8px;padding:11px;font-size:12px;line-height:1.5}.auth-footer{font-size:10px;color:#7891ac;margin-top:24px}.app-shell .button-outline{cursor:pointer}@media(max-width:900px){.auth-layout{grid-template-columns:1fr;gap:28px}.auth-hero{min-height:auto;padding:30px}.auth-form-wrap{max-width:620px}.auth-screen{padding:20px}.auth-stats{gap:20px}}@media(max-width:480px){.auth-stats{gap:14px}.auth-hero h1{font-size:31px}.auth-form{padding:18px}}
        `}</style>
      </div>
    );
  }

  return (
    <div className={`app-shell ${settingsCompact ? "compact-dashboard" : ""}`}>
      <aside className={`sidebar ${mobileMenuOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <Logo />
          <button
            className="icon-button sidebar-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>
        <div className="sidebar-label">WORKSPACE</div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {navItems.map(({ label, icon: Icon }) => (
            <button
              className={`nav-link ${activePage === label ? "active" : ""} ${
                label === "Record Match" ? "nav-record" : ""
              }`}
              key={label}
              onClick={() => goToPage(label)}
            >
              <Icon size={19} />
              <span>{label}</span>
              {label === "Record Match" && <Plus className="nav-plus" size={15} />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          {settingsTips && <div className="help-card">
            <div className="help-icon">
              <CircleHelp size={18} />
            </div>
            <strong>Keep improving</strong>
            <p>Small insights can make a big difference on court.</p>
            <button onClick={() => goToPage("My Portfolio")}>
              Explore your stats <ArrowRight size={14} />
            </button>
          </div>}
          <div className="sidebar-footer">
            <div className="mini-brand-mark">
              <Activity size={17} />
            </div>
            <div>
              <strong>ShuttleMetrics</strong>
              <span>Performance workspace</span>
            </div>
          </div>
        </div>
      </aside>

      {mobileMenuOpen && (
        <button
          className="mobile-overlay"
          aria-label="Close navigation overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu-button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={21} />
            </button>
            <div className="mobile-logo">
              <Logo compact />
              <strong>ShuttleMetrics</strong>
            </div>
            <div className="breadcrumb desktop-only">
              <span>Workspace</span>
              <ChevronRight size={14} />
              <strong>{activePage}</strong>
            </div>
          </div>
          <div className="topbar-right">
            <label className="top-search">
              <Search size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search matches"
                aria-label="Search matches"
              />
              <kbd>⌘ K</kbd>
            </label>
            <button
              className="icon-button notification-button"
              aria-label="Notifications"
              onClick={() => setNotice("You're all caught up.")}
            >
              <Bell size={19} />
              <span />
            </button>
            <button
              className="profile-chip"
              onClick={() => goToPage("My Profile")}
              aria-label="Open player profile"
            >
              <div className="profile-chip-avatar">
                {profileImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profileImage} alt="" />
                ) : (
                  <UserRound size={17} />
                )}
              </div>
              <span>{playerName}</span>
              <ChevronRight size={14} />
            </button>
            <button className="button-outline" onClick={handleSignOut} title={demoMode ? "Exit demo workspace" : "Sign out of ShuttleMetrics"}>{demoMode ? "Exit demo" : "Sign out"}</button>
          </div>
        </header>

        <div className="page-content">
          {demoMode && <div className="demo-mode-banner"><Sparkles size={16} /><span><strong>Demo workspace</strong> — sample data only; changes are not saved.</span><button className="notice-close" onClick={handleSignOut} aria-label="Exit demo"><X size={16} /></button></div>}
          <div className="mobile-page-title">
            <span className="eyebrow">PLAYER WORKSPACE</span>
            <h1>{activePage === "Home" ? "Good game starts here." : activePage}</h1>
          </div>
          {notice && (
            <div className="notice-bar" role="status">
              <Check size={17} />
              <span>{notice}</span>
              <button
                className="notice-close"
                onClick={() => setNotice("")}
                aria-label="Dismiss message"
              >
                <X size={16} />
              </button>
            </div>
          )}
          {renderCurrentPage()}
          <footer className="app-footer">
            <span>© 2026 ShuttleMetrics</span>
            <span>
              <Activity size={13} /> Built for better badminton
            </span>
          </footer>
        </div>
      </main>

      <nav className="bottom-nav" aria-label="Mobile navigation">
        {([navItems[0], navItems[2], navItems[4], navItems[1], navItems[5]]).map(({ label, icon: Icon }) => (
          <button
            key={label}
            className={`bottom-nav-item ${activePage === label ? "active" : ""} ${
              label === "Record Match" ? "bottom-record" : ""
            }`}
            onClick={() => goToPage(label)}
            aria-label={label}
            aria-current={activePage === label ? "page" : undefined}
          >
            <span className="bottom-icon">
              <Icon size={19} strokeWidth={activePage === label ? 2.5 : 1.8} />
            </span>
            <span>{label === "My Profile" ? "Profile" : label === "Record Match" ? "Record" : label === "My Portfolio" ? "Portfolio" : label === "Match Prediction" ? "Predict" : "Home"}</span>
          </button>
        ))}
      </nav>
      <style jsx global>{`
:root{--sm-bg:#f7f9fc;--sm-surface:#fff;--sm-text:#17212f;--sm-muted:#667085;--sm-border:#e5eaf0;--sm-teal:#0d9488;--sm-teal-dark:#087f75;--sm-soft:#e7f7f4;--sm-shadow:0 10px 30px rgba(16,24,40,.045)}
.app-shell{min-height:100vh;background:var(--sm-bg);color:var(--sm-text);font-family:"DM Sans",sans-serif}.app-shell button{border:0}.sidebar{position:fixed;inset:0 auto 0 0;width:258px;background:#fff;border-right:1px solid var(--sm-border);padding:26px 18px 18px;display:flex;flex-direction:column;z-index:30}.brand{display:flex;align-items:center;gap:11px;min-width:0}.brand-mark,.mini-brand-mark{display:grid;place-items:center;background:linear-gradient(135deg,#14b8a6,#0f766e);color:#fff;border-radius:13px;width:42px;height:42px;flex-shrink:0;box-shadow:0 6px 14px #0d948826}.brand-copy{display:flex;flex-direction:column;gap:3px}.brand-copy span{font:800 17px Manrope,sans-serif;letter-spacing:-.045em}.brand-copy small{font-size:9px;letter-spacing:.12em;color:#7b8797;font-weight:700}.sidebar-brand{display:flex;align-items:center;justify-content:space-between;padding:0 3px 34px}.sidebar-label,.eyebrow{font-size:10px;letter-spacing:.12em;font-weight:800;color:#7b8797}.sidebar-label{padding:0 12px 12px}.sidebar-nav{display:flex;flex-direction:column;gap:6px}.nav-link{width:100%;display:flex;align-items:center;gap:12px;padding:12px 13px;border-radius:11px;background:transparent;color:#596579;text-align:left;font-size:13px;font-weight:600;transition:background .18s,color .18s}.nav-link:hover{background:#f5f8fa;color:#17212f}.nav-link.active{background:var(--sm-soft);color:var(--sm-teal-dark);font-weight:800}.nav-link.nav-record{margin-top:8px;background:#0d9488;color:#fff;box-shadow:0 7px 16px #0d94882a}.nav-link.nav-record:hover{background:#087f75}.nav-plus{margin-left:auto}.sidebar-bottom{margin-top:auto}.help-card{padding:17px 15px;background:#f6fafb;border:1px solid #e6f2f0;border-radius:15px}.help-icon{width:31px;height:31px;border-radius:10px;background:#d9f5f0;color:#0d9488;display:grid;place-items:center;margin-bottom:12px}.help-card strong{font:750 13px Manrope,sans-serif}.help-card p{font-size:11px;line-height:1.6;color:var(--sm-muted);margin:7px 0 12px}.help-card button{display:flex;align-items:center;gap:6px;color:var(--sm-teal-dark);font-size:11px;font-weight:800;background:transparent;padding:0}.sidebar-footer{display:flex;align-items:center;gap:10px;padding:18px 4px 0;margin-top:18px;border-top:1px solid var(--sm-border)}.mini-brand-mark{width:32px;height:32px;border-radius:10px}.sidebar-footer div:last-child{display:flex;flex-direction:column;gap:3px}.sidebar-footer strong{font-size:11px}.sidebar-footer span{font-size:10px;color:var(--sm-muted)}.main-area{margin-left:258px;min-height:100vh}.topbar{height:76px;padding:0 38px;border-bottom:1px solid var(--sm-border);background:rgba(255,255,255,.9);display:flex;align-items:center;justify-content:space-between;gap:20px;position:sticky;top:0;z-index:15;backdrop-filter:blur(12px)}.topbar-left,.topbar-right,.breadcrumb{display:flex;align-items:center}.topbar-left{gap:12px}.breadcrumb{gap:10px;font-size:12px;color:#8a94a4}.breadcrumb strong{color:#263244}.topbar-right{gap:15px}.top-search,.search-field{height:39px;border:1px solid var(--sm-border);background:#fff;border-radius:10px;display:flex;align-items:center;gap:9px;padding:0 11px;color:#8993a2}.top-search input,.search-field input{border:0;outline:0;min-width:0;width:150px;background:transparent;color:var(--sm-text);font-size:12px}.top-search kbd{font-size:10px;background:#f4f6f8;border:1px solid #e8ebef;border-radius:5px;padding:3px 5px;color:#8b95a3}.icon-button{width:38px;height:38px;display:grid;place-items:center;background:#fff;border:1px solid var(--sm-border)!important;border-radius:10px;color:#657184;position:relative;flex-shrink:0}.icon-button:hover{background:#f6f9fa;color:var(--sm-teal-dark)}.notification-button span{position:absolute;right:8px;top:7px;width:6px;height:6px;background:#f59e0b;border:1px solid #fff;border-radius:50%}.profile-chip{display:flex;align-items:center;gap:9px;background:transparent;color:#344054;font-size:12px;font-weight:700;max-width:190px}.profile-chip>span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.profile-chip-avatar{width:31px;height:31px;border-radius:50%;display:grid;place-items:center;overflow:hidden;background:#dff6f2;color:#0d9488}.profile-chip-avatar img{width:100%;height:100%;object-fit:cover}.page-content{max-width:1440px;padding:31px 38px 24px;margin:0 auto}.mobile-page-title,.mobile-logo,.mobile-menu-button,.sidebar-close,.bottom-nav,.mobile-overlay{display:none}.welcome-banner{position:relative;overflow:hidden;min-height:235px;border-radius:21px;padding:36px 39px;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(112deg,#087f75 0%,#0d9488 52%,#13a89a 100%);color:#fff;box-shadow:0 13px 28px #0d94881a}.welcome-content{max-width:510px;position:relative;z-index:2}.light-eyebrow{display:inline-flex;align-items:center;gap:7px;color:#c8fbf2}.welcome-banner h2{font:800 clamp(27px,3vw,38px)/1.15 Manrope,sans-serif;letter-spacing:-.055em;margin:15px 0 10px;max-width:440px}.welcome-banner p{font-size:13px;line-height:1.7;color:#e1fffa;max-width:390px;margin:0 0 22px}.button-white,.button-primary,.button-outline{display:inline-flex;align-items:center;justify-content:center;gap:9px;border-radius:10px;padding:11px 15px;font-size:12px;font-weight:800;transition:transform .15s,background .15s;white-space:nowrap}.button-white{background:#fff;color:#087f75}.button-white:hover,.button-primary:hover,.button-outline:hover{transform:translateY(-1px)}.banner-art{width:270px;height:190px;position:absolute;right:45px;top:20px;display:grid;place-items:center;opacity:.95}.art-circle{position:absolute;border:1px solid #c5fff455;border-radius:50%}.circle-one{width:190px;height:190px}.circle-two{width:140px;height:140px}.art-orbit{width:112px;height:112px;border-radius:50%;border:1px dashed #d6fff777;display:grid;place-items:center;transform:rotate(-18deg)}.art-shuttle{width:78px;height:78px;border-radius:25px;background:#ffffff22;border:1px solid #ffffff55;display:grid;place-items:center;transform:rotate(18deg);backdrop-filter:blur(5px)}.art-label{position:absolute;bottom:3px;right:12px;font-size:9px;letter-spacing:.1em;font-weight:800;display:flex;align-items:center;gap:6px;background:#ffffff20;border:1px solid #ffffff35;padding:8px 10px;border-radius:8px}.section-block{margin-top:31px}.section-heading,.panel-heading{display:flex;align-items:center;justify-content:space-between;gap:16px}.section-heading{margin-bottom:17px}.section-heading h2,.page-intro h2{font:800 22px/1.25 Manrope,sans-serif;letter-spacing:-.045em;margin:7px 0 5px}.section-heading p,.page-intro p,.panel-heading p{font-size:12px;color:var(--sm-muted);margin:0;line-height:1.6}.button-outline{border:1px solid var(--sm-border)!important;background:#fff;color:#465365}.button-outline:hover{background:#f8fafb}.metrics-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.metric-card{background:#fff;border:1px solid var(--sm-border);border-radius:15px;padding:18px 18px 17px;box-shadow:0 3px 10px #17212f03;min-width:0}.metric-top{display:flex;align-items:center;justify-content:space-between;gap:6px}.metric-icon,.action-icon{width:39px;height:39px;border-radius:12px;display:grid;place-items:center;flex-shrink:0}.metric-icon.teal,.action-icon.teal{background:#e3f8f4;color:#0d9488}.metric-icon.blue,.action-icon.blue{background:#eaf1ff;color:#4778d7}.metric-icon.orange,.action-icon.orange{background:#fff1e5;color:#e58a35}.metric-icon.purple,.action-icon.purple{background:#f2eaff;color:#8a5ad4}.trend-pill{display:inline-flex;align-items:center;gap:3px;background:#e8f8f2;color:#13866f;padding:5px 7px;border-radius:7px;font-size:9px;font-weight:800;white-space:nowrap}.trend-pill.neutral{background:#f3f5f7;color:#788394}.metric-title{font-size:11px;color:var(--sm-muted);margin:17px 0 6px}.metric-value{font:800 27px/1.2 Manrope,sans-serif;letter-spacing:-.04em}.dashboard-grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(320px,.85fr);gap:17px;margin-top:19px}.panel{background:#fff;border:1px solid var(--sm-border);border-radius:16px;padding:21px;box-shadow:0 3px 10px #17212f03;min-width:0}.panel-heading{margin-bottom:18px}.panel-heading h3{font:800 15px Manrope,sans-serif;letter-spacing:-.025em;margin:0 0 5px}.panel-heading p{font-size:11px}.chart-summary{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:17px}.chart-big-number{font:800 25px Manrope,sans-serif;letter-spacing:-.04em}.chart-caption{font-size:11px;color:var(--sm-muted)}.chart-tag{display:inline-flex;align-items:center;gap:5px;color:#0d9488;background:#e9f8f5;border-radius:7px;padding:6px 8px;font-size:9px;font-weight:800}.bar-chart{height:135px;display:flex;align-items:stretch;justify-content:space-around;gap:13px;padding:0 8px}.bar-column{display:flex;flex:1;max-width:48px;flex-direction:column;align-items:center;gap:8px;color:#8993a2;font-size:10px}.bar-track{height:110px;width:100%;display:flex;align-items:flex-end;background:#f3f7f8;border-radius:7px 7px 4px 4px;overflow:hidden}.bar-fill{width:100%;min-height:4px;background:linear-gradient(180deg,#7bd9cd,#c6f0e9);border-radius:6px 6px 0 0}.bar-fill.highlight{background:linear-gradient(180deg,#0d9488,#42c5b6)}.chart-disclaimer{font-size:10px;color:#98a1af;margin:12px 0 0}.quick-panel{padding-bottom:13px}.action-row{width:100%;display:flex;align-items:center;gap:12px;text-align:left;padding:12px 0;background:transparent;color:var(--sm-text);border-bottom:1px solid #f0f2f5!important}.action-row:last-child{border-bottom:0!important}.action-row:hover strong{color:var(--sm-teal-dark)}.action-icon{width:38px;height:38px;border-radius:11px}.action-row>div:nth-child(2){display:flex;flex-direction:column;gap:4px;flex:1;min-width:0}.action-row strong{font-size:12px}.action-row span{font-size:10px;color:var(--sm-muted)}.action-row>svg{color:#9aa4b2}.recent-panel{margin-top:18px}.match-list{display:flex;flex-direction:column}.match-row{display:flex;align-items:center;gap:12px;padding:14px 0;border-top:1px solid #f0f2f5;min-width:0}.match-row:first-child{border-top:0;padding-top:0}.result-mark{width:35px;height:35px;border-radius:11px;display:grid;place-items:center;flex-shrink:0}.result-mark.won{background:#e5f8f1;color:#12856d}.result-mark.lost{background:#fff0ed;color:#db695a}.match-main{display:flex;flex-direction:column;gap:5px;min-width:0;flex:1}.match-main strong{font-size:12px;overflow-wrap:anywhere}.match-main>span{display:flex;align-items:center;gap:5px;color:#8a94a3;font-size:10px}.match-main .match-stats{color:#667085;line-height:1.5}.match-right{display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0}.result-label{font-size:9px;font-weight:800;border-radius:6px;padding:5px 7px}.result-label.won{background:#e7f8f1;color:#14866d}.result-label.lost{background:#fff0ed;color:#d56354}.match-score{font-size:11px}.content-panel{display:flex;flex-direction:column;gap:19px}.page-intro{margin:2px 0 0}.page-intro h2{font-size:26px;margin:8px 0 6px}.profile-panel,.form-panel{padding:26px}.profile-avatar-wrap{display:flex;align-items:center;gap:17px;padding-bottom:23px;margin-bottom:23px;border-bottom:1px solid var(--sm-border)}.profile-avatar{width:76px;height:76px;object-fit:cover;border-radius:22px}.avatar-placeholder{display:grid;place-items:center;background:#e4f7f3;color:#0d9488}.profile-avatar-wrap h3{font:800 17px Manrope,sans-serif;margin:0 0 5px}.profile-avatar-wrap p{font-size:11px;color:var(--sm-muted);margin:0 0 10px}.upload-label{display:inline-flex;align-items:center;border:1px solid var(--sm-border);border-radius:8px;padding:7px 10px;font-size:10px;font-weight:800;color:#526071;cursor:pointer}.upload-label input{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:19px}.field{display:flex;flex-direction:column;gap:8px;min-width:0}.field>span{font-size:11px;font-weight:800;color:#465365}.field input,.field select,.field textarea{width:100%;height:43px;border:1px solid #dfe5eb;border-radius:9px;padding:0 12px;color:#263244;background:#fff;outline:none;font-size:12px;min-width:0}.field input:focus,.field select:focus{border-color:#53bdb1;box-shadow:0 0 0 3px #0d948814}.field small{font-size:10px;line-height:1.5;color:#8993a2}.full-width{grid-column:1/-1}.form-section-title{display:flex;align-items:center;gap:8px;color:#334155;font-size:12px;font-weight:800;border-bottom:1px solid #eef1f4;padding-bottom:11px;margin-bottom:-2px}.form-actions{display:flex;align-items:center;gap:10px;margin-top:3px}.button-primary{background:#0d9488;color:#fff}.button-primary:hover{background:#087f75}.form-note{font-size:10px;line-height:1.65;color:#8b95a3;margin:18px 0 0}.notice-bar{display:flex;align-items:center;gap:10px;background:#e8f8f2;color:#087f68;border:1px solid #c7eee2;border-radius:10px;padding:12px 14px;font-size:12px;margin-bottom:18px}.notice-bar span{flex:1}.notice-close{display:grid;place-items:center;background:transparent;color:inherit;padding:3px}.portfolio-metrics{margin-bottom:0}.portfolio-comparison{padding:23px}.comparison-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px}.comparison-item{border:1px solid #edf0f3;border-radius:12px;padding:15px;display:flex;flex-direction:column;align-items:flex-start;gap:10px;min-width:0}.comparison-item>span:first-child{font-size:11px;color:var(--sm-muted)}.comparison-item>strong{font:800 26px Manrope,sans-serif}.comparison-track{height:6px;background:#edf2f4;border-radius:20px;overflow:hidden;width:100%}.comparison-fill{height:100%;background:#0d9488;border-radius:20px}.comparison-item small{font-size:10px;color:#8b95a3}.comparison-status{font-size:9px;font-weight:800;line-height:1.5}.comparison-status.positive{color:#0d9488}.comparison-status.neutral{color:#9a6b2c}.search-field{height:36px}.search-field input{width:140px}.inline-empty{display:flex;align-items:center;gap:10px;color:#8b95a3;font-size:12px;padding:18px 0}.inline-empty p{margin:0}.empty-state{text-align:center;padding:28px 15px}.empty-icon{width:54px;height:54px;border-radius:17px;background:#e7f7f4;color:#0d9488;display:grid;place-items:center;margin:0 auto 13px}.empty-state h3{font:800 16px Manrope,sans-serif;margin:0 0 7px}.empty-state p{font-size:12px;color:var(--sm-muted);line-height:1.6;margin:0 auto 16px;max-width:320px}.prediction-banner{display:flex;align-items:center;gap:17px;padding:23px 25px;border-radius:16px;background:linear-gradient(110deg,#173c54,#145d66);color:#fff}.prediction-banner-icon{width:54px;height:54px;border-radius:16px;display:grid;place-items:center;background:#ffffff1d;color:#b5fff1;flex-shrink:0}.prediction-banner h3{font:800 19px Manrope,sans-serif;margin:7px 0}.prediction-banner p{font-size:11px;color:#d5e9ed;margin:0;line-height:1.6}.demo-notice{display:flex;align-items:flex-start;gap:12px;background:#fff8e8;border:1px solid #f5e1b6;color:#7c5b1c;border-radius:11px;padding:14px;margin-top:18px}.demo-notice>svg{flex-shrink:0;margin-top:1px}.demo-notice strong{font-size:12px}.demo-notice p{font-size:11px;line-height:1.6;margin:5px 0 0}.model-info{display:flex;flex-wrap:wrap;gap:10px 18px;padding-top:19px;margin-top:19px;border-top:1px solid #edf0f3}.model-info div{display:flex;align-items:center;gap:6px;font-size:10px;color:#687586}.model-info svg{color:#0d9488}.app-footer{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:23px 2px 0;color:#9aa3b1;font-size:10px}.app-footer span:last-child{display:flex;align-items:center;gap:6px}.app-footer svg{color:#0d9488}.sidebar-close{display:none}
@media(max-width:1200px){.sidebar{width:225px;padding-left:14px;padding-right:14px}.main-area{margin-left:225px}.topbar{padding:0 24px}.page-content{padding:25px 24px 22px}.metrics-grid{gap:10px}.metric-card{padding:15px}.metric-value{font-size:24px}.dashboard-grid{grid-template-columns:minmax(0,1fr) minmax(285px,.9fr)}.banner-art{right:10px;opacity:.7}.welcome-content{max-width:65%}}
@media(max-width:900px){.sidebar{width:250px;transform:translateX(-105%);transition:transform .22s ease;box-shadow:none}.sidebar.sidebar-open{transform:translateX(0);box-shadow:18px 0 50px #17212f24}.sidebar-close{display:grid}.mobile-overlay{display:block;position:fixed;inset:0;background:#17212f60;z-index:25;width:100%;height:100%}.main-area{margin-left:0}.mobile-menu-button{display:grid}.topbar{height:66px;padding:0 20px}.breadcrumb{display:none}.mobile-logo{display:flex;align-items:center;gap:9px;font-size:13px}.mobile-logo .brand-mark{width:34px;height:34px;border-radius:10px}.topbar-left{gap:10px}.top-search{display:none}.page-content{padding:22px 20px 28px}.mobile-page-title{display:block;margin:0 0 18px}.mobile-page-title h1{font:800 23px Manrope,sans-serif;letter-spacing:-.05em;margin:7px 0 0}.welcome-banner{min-height:210px;padding:28px}.banner-art{right:-45px;opacity:.42}.welcome-content{max-width:75%}.metrics-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.dashboard-grid{grid-template-columns:1fr}.bottom-nav{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));position:fixed;z-index:20;bottom:0;left:0;right:0;background:#fff;border-top:1px solid var(--sm-border);padding:7px 8px calc(7px + env(safe-area-inset-bottom));box-shadow:0 -5px 20px #17212f08}.bottom-nav-item{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-width:0;padding:4px 2px;border-radius:9px;background:transparent;color:#8993a2;font-size:9px;font-weight:700}.bottom-icon{width:30px;height:27px;border-radius:9px;display:grid;place-items:center}.bottom-nav-item.active{color:#0d9488}.bottom-nav-item.active .bottom-icon{background:#e5f8f4}.bottom-nav-item.bottom-record .bottom-icon{background:#0d9488;color:#fff;box-shadow:0 4px 10px #0d94882b}.page-content{padding-bottom:110px}.app-footer{padding-bottom:4px}.profile-chip{max-width:43px;padding:0}.profile-chip>span,.profile-chip>svg{display:none}.profile-chip-avatar{width:34px;height:34px}}
@media(max-width:560px){.topbar{padding:0 13px;gap:8px}.topbar-right{gap:8px}.page-content{padding:17px 13px 105px}.mobile-page-title h1{font-size:21px}.welcome-banner{padding:23px 20px;min-height:225px;border-radius:16px}.welcome-content{max-width:100%}.welcome-banner h2{font-size:27px;max-width:280px}.welcome-banner p{font-size:12px;max-width:270px}.banner-art{right:-120px;top:25px;opacity:.22}.art-label{display:none}.section-block{margin-top:25px}.section-heading{align-items:flex-start}.section-heading h2,.page-intro h2{font-size:20px}.section-heading p{max-width:235px}.desktop-only{display:none!important}.metrics-grid{gap:9px}.metric-card{padding:13px;border-radius:13px}.metric-icon{width:34px;height:34px;border-radius:10px}.trend-pill{font-size:8px;padding:4px 5px}.metric-title{font-size:10px;line-height:1.4;margin-top:13px}.metric-value{font-size:23px}.panel{padding:16px;border-radius:14px}.panel-heading{align-items:flex-start}.panel-heading h3{font-size:14px}.dashboard-grid{gap:13px;margin-top:14px}.bar-chart{gap:8px;padding:0 2px}.chart-summary{align-items:flex-start}.chart-tag{font-size:8px}.recent-panel .panel-heading{align-items:center}.match-row{gap:9px}.result-mark{width:31px;height:31px;border-radius:9px}.match-main strong{font-size:11px}.match-score{font-size:10px}.result-label{font-size:8px;padding:4px 5px}.content-panel{gap:14px}.page-intro h2{font-size:23px}.profile-panel,.form-panel{padding:17px}.profile-avatar{width:64px;height:64px;border-radius:18px}.profile-avatar-wrap{gap:12px}.profile-avatar-wrap h3{font-size:15px}.form-grid{grid-template-columns:1fr;gap:15px}.full-width{grid-column:auto}.form-section-title{grid-column:auto}.form-actions{grid-column:auto}.form-actions .button-primary{width:100%}.comparison-grid{grid-template-columns:1fr}.comparison-item{padding:13px}.portfolio-comparison{padding:16px}.search-field{max-width:145px;padding:0 8px}.search-field input{width:95px;font-size:11px}.prediction-banner{padding:18px;gap:12px}.prediction-banner-icon{width:44px;height:44px;border-radius:13px}.prediction-banner h3{font-size:16px}.prediction-banner p{font-size:10px}.model-info{flex-direction:column;gap:9px}.app-footer{font-size:9px;flex-wrap:wrap}.app-footer span:last-child{display:none}.topbar .icon-button{width:34px;height:34px}.mobile-logo strong{font-size:12px}.notice-bar{font-size:11px;padding:10px}.match-main .match-stats{font-size:9px}}

.stat-bar-row{display:flex;flex-direction:column;gap:9px;margin:20px 0}.stat-bar-label{display:flex;justify-content:space-between;gap:12px;font-size:12px}.stat-bar-label span{color:var(--sm-muted);font-size:11px}.highlight-card{padding:20px;border-radius:14px;background:linear-gradient(135deg,#e9faf6,#f6fbff);border:1px solid #d8f1eb}.highlight-card>strong{display:block;font:800 42px Manrope,sans-serif;margin-top:12px;color:#087f75}.highlight-card p{font-size:12px;color:var(--sm-muted);margin:4px 0 12px}.stat-summary-line{display:flex;justify-content:space-between;gap:12px;border-top:1px solid var(--sm-border);margin-top:18px;padding-top:14px;font-size:12px;color:var(--sm-muted)}.stat-summary-line strong{color:var(--sm-text)}.analytics-match{padding:14px 0;border-top:1px solid #eef1f4}.analytics-match:first-child{border-top:0}.analytics-match-head{display:flex;justify-content:space-between;gap:10px;font-size:12px;margin-bottom:9px}.analytics-match-head span{font-size:10px;font-weight:800;color:#0d9488}.analytics-match small{display:block;color:var(--sm-muted);font-size:10px;margin-top:8px}.result-breakdown{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:24px 0 18px}.result-breakdown-number{padding:20px;border-radius:13px;background:#f7fafb;display:flex;flex-direction:column;gap:5px}.result-breakdown-number strong{font:800 30px Manrope,sans-serif}.result-breakdown-number span{font-size:11px;color:var(--sm-muted)}.breakdown-track{height:9px}.settings-panel{padding:8px 22px}.settings-row{display:flex;align-items:center;gap:14px;padding:19px 0;border-bottom:1px solid #eef1f4}.settings-row:last-of-type{border-bottom:0}.settings-row-icon{width:40px;height:40px;display:grid;place-items:center;background:#e5f8f4;color:#0d9488;border-radius:12px;flex-shrink:0}.settings-row-copy{flex:1;min-width:0}.settings-row-copy strong{font-size:13px}.settings-row-copy p{font-size:11px;color:var(--sm-muted);margin:5px 0 0;line-height:1.5}.switch-control{position:relative;display:inline-flex;width:42px;height:24px;flex-shrink:0}.switch-control input{position:absolute;opacity:0;width:1px;height:1px}.switch-control span{position:absolute;inset:0;background:#d3dbe3;border-radius:99px;cursor:pointer;transition:background .2s}.switch-control span:before{content:"";position:absolute;width:18px;height:18px;left:3px;top:3px;border-radius:50%;background:white;box-shadow:0 1px 4px #0002;transition:transform .2s}.switch-control input:checked+span{background:#0d9488}.switch-control input:checked+span:before{transform:translateX(18px)}.switch-control input:focus-visible+span{outline:3px solid #8ee7dc;outline-offset:3px}.app-shell.compact-dashboard .metric-card{padding:12px}.app-shell.compact-dashboard .panel{padding:16px}
@media(max-width:560px){.settings-panel{padding:6px 15px}.settings-row{gap:10px}.settings-row-copy strong{font-size:12px}.highlight-card>strong{font-size:35px}.stat-bar-label{font-size:11px}}
/* Clean Athlete Dashboard: polished navy, white and teal theme */
.clean-athlete-dashboard-theme{}
.app-shell .sidebar{background:linear-gradient(180deg,#0b2430 0%,#102d38 100%);border-right:1px solid #21414b;color:#edf7f8}
.app-shell .sidebar-label,.app-shell .brand-copy small{color:#9db6c0}
.app-shell .sidebar-footer{border-top-color:#24434c}
.app-shell .sidebar-footer span{color:#a7bbc3}
.app-shell .help-card{background:#153642;border-color:#2a515b;color:#eff9fa}
.app-shell .help-card p{color:#b4c8ce}
.app-shell .help-icon{background:#1b5155;color:#79e4d5}
.app-shell .help-card button{color:#70e2d2}
.app-shell .nav-link{color:#c0d0d6}
.app-shell .nav-link:hover{background:#193d48;color:#fff}
.app-shell .nav-link.active{background:#174b53;color:#7ce5d5}
.app-shell .nav-link.nav-record{background:#0d9488;color:#fff}
.app-shell .nav-link.nav-record:hover{background:#10a395}
.app-shell .topbar{background:rgba(255,255,255,.94)}
.app-shell .welcome-banner{background:linear-gradient(112deg,#123b4a 0%,#14606a 58%,#168c83 100%)}
.app-shell .metric-card,.app-shell .panel{box-shadow:0 5px 18px rgba(16,36,48,.035)}
.app-shell .button-primary{background:#0b9186}
.app-shell .button-primary:hover{background:#08796f}
.app-shell .bottom-nav{background:#fff}
@media(max-width:900px){.app-shell .sidebar{background:linear-gradient(180deg,#0b2430 0%,#102d38 100%)}.app-shell .sidebar.sidebar-open{box-shadow:18px 0 50px rgba(8,28,37,.35)}}

/* UI overhaul v2: distinct editorial dashboard layout */
.app-shell{background:#f1f5f7;color:#142a35;font-family:"DM Sans",Inter,system-ui,sans-serif}
.app-shell .sidebar{width:246px;padding:25px 15px 18px;background:#102a36;border-right:0;color:#e8f3f5;box-shadow:8px 0 28px rgba(13,43,54,.06)}
.app-shell .brand{padding:0 7px 27px}.app-shell .brand-copy span{font-size:18px;letter-spacing:-.055em}.app-shell .sidebar-label{padding:0 11px;margin:8px 0 12px;font-size:9px;letter-spacing:.18em;color:#7ea0ab}
.app-shell .sidebar-nav{gap:6px}.app-shell .nav-link{min-height:46px;border-radius:11px;padding:0 12px;color:#b8cbd1;font-weight:650;font-size:12px;transition:background .18s,color .18s,transform .18s}
.app-shell .nav-link svg{opacity:.88}.app-shell .nav-link:hover{background:#1b414e;color:#fff;transform:translateX(2px)}
.app-shell .nav-link.active{background:#d9f8f1;color:#087f75;box-shadow:inset 3px 0 #14b8a6}.app-shell .nav-link.nav-record{background:#0d9488;color:#fff;box-shadow:0 7px 18px #0d94882a;margin:7px 0}.app-shell .nav-link.nav-record:hover{background:#10a395}
.app-shell .help-card{background:linear-gradient(145deg,#173b49,#14313d);border:1px solid #28505c;border-radius:16px;padding:16px}.app-shell .sidebar-footer{padding:16px 4px 0}
.app-shell .main-area{margin-left:246px;background:#f1f5f7}.app-shell .topbar{height:72px;padding:0 34px;background:#f8fafb;border-bottom:1px solid #e1e9ed;box-shadow:none}
.app-shell .breadcrumb{font-size:12px}.app-shell .breadcrumb strong{font-weight:800;color:#142a35}.app-shell .top-search{background:#fff;border-color:#dfe8ec;border-radius:12px;height:41px}.app-shell .icon-button{border-color:#dfe8ec!important;border-radius:12px}.app-shell .profile-chip-avatar{background:#d8f5ee}
.app-shell .page-content{max-width:1580px;padding:28px 34px 34px}
.app-shell .welcome-banner{min-height:250px;padding:38px 42px;border-radius:22px;background:linear-gradient(115deg,#102f40 0%,#155a64 57%,#0d9488 100%);box-shadow:0 16px 35px rgba(13,75,84,.13)}
.app-shell .welcome-banner:after{content:"";position:absolute;inset:auto 0 0;height:4px;background:linear-gradient(90deg,#a8f0e2,#0d9488,#c8fff2);opacity:.9}
.app-shell .welcome-content{max-width:560px}.app-shell .welcome-banner h2{font-size:clamp(32px,3.2vw,45px);line-height:1.08;max-width:480px;margin:17px 0 13px;letter-spacing:-.06em}
.app-shell .welcome-banner p{font-size:14px;max-width:420px;line-height:1.8;color:#d5e9ec}.app-shell .button-white{border-radius:10px;padding:13px 17px;color:#0d655f;box-shadow:0 7px 18px #071b2422}
.app-shell .banner-art{right:55px;width:290px;height:205px}.app-shell .art-shuttle{background:#ffffff18;border-color:#ffffff5c}
.app-shell .section-block{margin-top:34px}.app-shell .section-heading{align-items:flex-end;margin-bottom:20px}.app-shell .eyebrow{font-size:9px;letter-spacing:.17em;font-weight:850;color:#0d9488}.app-shell .section-heading h2,.app-shell .page-intro h2{font-size:25px;letter-spacing:-.055em;color:#142a35}.app-shell .section-heading p,.app-shell .page-intro p{font-size:12px;color:#71818c}
.app-shell .metrics-grid{gap:16px}.app-shell .metric-card{position:relative;overflow:hidden;padding:20px;border-radius:17px;border:1px solid #e1e9ed;box-shadow:0 7px 24px rgba(20,42,53,.035);transition:transform .18s,box-shadow .18s}
.app-shell .metric-card:hover{transform:translateY(-3px);box-shadow:0 12px 28px rgba(20,42,53,.075)}.app-shell .metric-card:after{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:#bfeee5}
.app-shell .metric-title{font-size:11px;font-weight:650;color:#71818c;margin-top:18px}.app-shell .metric-value{font-size:31px;letter-spacing:-.06em;color:#102a36}.app-shell .trend-pill{border-radius:20px;padding:6px 9px}
.app-shell .dashboard-grid{gap:18px;margin-top:20px}.app-shell .panel{border-radius:18px;border-color:#e1e9ed;padding:23px;box-shadow:0 7px 24px rgba(20,42,53,.03)}
.app-shell .panel-heading{margin-bottom:20px}.app-shell .panel-heading h3{font-size:15px;letter-spacing:-.035em;color:#142a35}.app-shell .panel-heading p{color:#81909a}
.app-shell .bar-chart{height:150px}.app-shell .bar-track{height:120px;background:#f0f5f6;border-radius:8px}.app-shell .bar-fill{background:linear-gradient(180deg,#8edfd2,#d6f4ed)}.app-shell .bar-fill.highlight{background:linear-gradient(180deg,#13b8a5,#087f75)}
.app-shell .chart-tag{border-radius:20px;padding:7px 10px}.app-shell .quick-panel{padding-bottom:13px}.app-shell .action-row{padding:14px 0;border-color:#edf1f3!important}.app-shell .action-row strong{font-size:12px}.app-shell .action-icon{border-radius:12px}
.app-shell .recent-panel{margin-top:20px}.app-shell .match-row{padding:16px 0;border-color:#edf1f3}.app-shell .result-mark{border-radius:12px}.app-shell .content-panel{gap:20px}.app-shell .page-intro{padding:4px 0 2px}.app-shell .page-intro h2{font-size:29px;margin-top:8px}
.app-shell .form-panel,.app-shell .profile-panel{border-radius:19px;padding:29px}.app-shell .field>span{font-size:11px;color:#3d5260}.app-shell .field input,.app-shell .field select,.app-shell .field textarea{height:46px;border-radius:11px;border-color:#dce6ea;background:#fbfdfd;font-size:12px}
.app-shell .button-primary{background:#0d9488;border-radius:11px;padding:13px 17px;box-shadow:0 6px 14px #0d94881d}.app-shell .button-primary:hover{background:#08796f}
.app-shell .button-outline{border-radius:10px!important;background:#fff}.app-shell .prediction-banner{border-radius:18px;padding:27px 29px;background:linear-gradient(115deg,#102f40,#176b70);box-shadow:0 12px 25px rgba(13,75,84,.09)}
.app-shell .portfolio-comparison{background:linear-gradient(135deg,#fff,#fafdfe)}.app-shell .comparison-item{border-radius:14px;background:#fbfdfd}.app-shell .comparison-fill{background:linear-gradient(90deg,#0d9488,#5bd3c0)}
.app-shell .settings-panel{border-radius:17px}.app-shell .app-footer{color:#84939d}
.app-shell.compact-dashboard .metric-card{padding:14px}.app-shell.compact-dashboard .panel{padding:18px}
@media(max-width:1200px){.app-shell .sidebar{width:230px}.app-shell .main-area{margin-left:230px}.app-shell .page-content{padding:25px 24px 30px}.app-shell .welcome-banner{padding:31px}.app-shell .banner-art{right:15px}}
@media(max-width:900px){.app-shell .sidebar{width:255px}.app-shell .main-area{margin-left:0}.app-shell .topbar{padding:0 20px}.app-shell .page-content{padding:22px 20px 112px}.app-shell .welcome-banner{min-height:225px}.app-shell .bottom-nav{border-radius:18px 18px 0 0;box-shadow:0 -8px 28px rgba(16,42,54,.08)}}
@media(max-width:560px){.app-shell .page-content{padding:17px 13px 108px}.app-shell .welcome-banner{padding:23px 20px;min-height:220px}.app-shell .welcome-banner h2{font-size:29px}.app-shell .metrics-grid{gap:10px}.app-shell .metric-card{padding:14px}.app-shell .metric-value{font-size:26px}.app-shell .panel{padding:17px}.app-shell .page-intro h2{font-size:25px}.app-shell .form-panel,.app-shell .profile-panel{padding:18px}}

@media(prefers-reduced-motion:reduce){.app-shell *{scroll-behavior:auto!important;animation-duration:.01ms!important;transition-duration:.01ms!important}}
`}</style>

    </div>
  );
}