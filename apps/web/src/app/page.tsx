
"use client";

import { useState } from "react";
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
  | "Match Prediction";

type Match = {
  id: number;
  opponent: string;
  date: string;
  result: "Won" | "Lost";
  score: string;
  unforced: number;
  forced: number;
  smashes: number;
};

const initialMatches: Match[] = [
  {
    id: 1,
    opponent: "Player Alpha",
    date: "Oct 17, 2026",
    result: "Won",
    score: "21–17, 21–14",
    unforced: 8,
    forced: 12,
    smashes: 15,
  },
  {
    id: 2,
    opponent: "Player Bravo",
    date: "Oct 15, 2026",
    result: "Won",
    score: "21–19, 18–21, 21–16",
    unforced: 11,
    forced: 14,
    smashes: 12,
  },
  {
    id: 3,
    opponent: "Player Charlie",
    date: "Oct 12, 2026",
    result: "Lost",
    score: "17–21, 16–21",
    unforced: 16,
    forced: 9,
    smashes: 8,
  },
];

const navItems: { label: Page; icon: typeof Home }[] = [
  { label: "Home", icon: Home },
  { label: "My Profile", icon: UserRound },
  { label: "Record Match", icon: Plus },
  { label: "My Portfolio", icon: BarChart3 },
  { label: "Match Prediction", icon: Target },
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
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [playerName, setPlayerName] = useState("Your Player Profile");
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
  const [search, setSearch] = useState("");

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

  function saveMatch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!opponent.trim()) {
      setNotice("Please enter your opponent's name.");
      return;
    }

    const newMatch: Match = {
      id: Date.now(),
      opponent: opponent.trim(),
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      result: matchResult,
      score: matchScore.trim() || "Score not entered",
      unforced: Math.max(0, Number(unforced) || 0),
      forced: Math.max(0, Number(forced) || 0),
      smashes: Math.max(0, Number(smashes) || 0),
    };

    setMatches((current) => [newMatch, ...current]);
    setOpponent("");
    setMatchScore("");
    setUnforced("0");
    setForced("0");
    setSmashes("0");
    setNotice("Match added to this session.");
  }

  function runDemoPrediction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!playerOne.trim() || !playerTwo.trim()) {
      setNotice("Enter both player names to continue.");
      return;
    }

    setPrediction(true);
    setNotice(
      "Demo only: the Python prediction API is not connected yet. No real prediction was calculated.",
    );
  }

  function renderHome() {
    return (
      <>
        <section className="welcome-banner">
          <div className="welcome-content">
            <span className="eyebrow light-eyebrow">
              <Sparkles size={14} /> YOUR PERFORMANCE HUB
            </span>
            <h2>Every rally tells a story.</h2>
            <p>
              Understand your game, track your progress, and make every match
              count.
            </p>
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
                      setProfileImage(URL.createObjectURL(file));
                    }
                  }}
                />
              </label>
            </div>
          </div>
          <form
            className="form-grid"
            onSubmit={(event) => {
              event.preventDefault();
              setNotice("Profile updated for this session.");
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
            This preview stores changes only in the current browser session.
            Persistent profiles will be added with Supabase.
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
            Match records are temporary in this frontend prototype. Supabase
            persistence will be implemented later.
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
              <p>{matches.length} records in this session</p>
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
                value={playerOne}
                onChange={(event) => setPlayerOne(event.target.value)}
                placeholder="First player"
                maxLength={80}
                required
              />
            </label>
            <label className="field">
              <span>Player 2</span>
              <input
                value={playerTwo}
                onChange={(event) => setPlayerTwo(event.target.value)}
                placeholder="Second player"
                maxLength={80}
                required
              />
            </label>
            <div className="full-width form-actions">
              <button type="submit" className="button-primary">
                Prepare prediction <ArrowRight size={16} />
              </button>
            </div>
          </form>
          {prediction && (
            <div className="demo-notice">
              <CircleHelp size={20} />
              <div>
                <strong>Prediction API not connected</strong>
                <p>
                  Your matchup is ready for the integration phase. This page
                  has not calculated a winner or probability.
                </p>
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
      default:
        return renderHome();
    }
  }

  return (
    <div className="app-shell">
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
          <div className="help-card">
            <div className="help-icon">
              <CircleHelp size={18} />
            </div>
            <strong>Keep improving</strong>
            <p>Small insights can make a big difference on court.</p>
            <button onClick={() => goToPage("My Portfolio")}>
              Explore your stats <ArrowRight size={14} />
            </button>
          </div>
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
          </div>
        </header>

        <div className="page-content">
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
        {navItems.map(({ label, icon: Icon }) => (
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
    </div>
  );
}
