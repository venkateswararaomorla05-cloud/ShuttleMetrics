"use client";

import { useEffect, useState, type FormEvent } from "react";
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

  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem("shuttlemetrics-player-profile");
      if (!savedProfile) return;

      const profile = JSON.parse(savedProfile);

      if (typeof profile.playerName === "string" && profile.playerName.trim()) {
        setPlayerName(profile.playerName);
      }
      if (typeof profile.playingLevel === "string") {
        setPlayingLevel(profile.playingLevel);
      }
      if (typeof profile.playingStyle === "string") {
        setPlayingStyle(profile.playingStyle);
      }
    } catch {
      localStorage.removeItem("shuttlemetrics-player-profile");
    }
  }, []);


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

  function saveMatch(event: FormEvent<HTMLFormElement>) {
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

  function runDemoPrediction(event: FormEvent<HTMLFormElement>) {
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

              const name = playerName.trim();
              if (!name) {
                setNotice("Please enter your player name.");
                return;
              }

              const profile = {
                playerName: name,
                playingLevel,
                playingStyle,
              };

              try {
                localStorage.setItem(
                  "shuttlemetrics-player-profile",
                  JSON.stringify(profile)
                );
                setPlayerName(name);
                setNotice("Profile saved successfully in this browser.");
              } catch {
                setNotice("Could not save the profile in this browser. Check browser storage settings.");
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
            Your player name and playing preferences are saved in this browser.
            Supabase syncing across devices will be added separately.
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
      <style jsx global>{`
:root{--sm-bg:#f7f9fc;--sm-surface:#fff;--sm-text:#17212f;--sm-muted:#667085;--sm-border:#e5eaf0;--sm-teal:#0d9488;--sm-teal-dark:#087f75;--sm-soft:#e7f7f4;--sm-shadow:0 10px 30px rgba(16,24,40,.045)}
.app-shell{min-height:100vh;background:var(--sm-bg);color:var(--sm-text);font-family:"DM Sans",sans-serif}.app-shell button{border:0}.sidebar{position:fixed;inset:0 auto 0 0;width:258px;background:#fff;border-right:1px solid var(--sm-border);padding:26px 18px 18px;display:flex;flex-direction:column;z-index:30}.brand{display:flex;align-items:center;gap:11px;min-width:0}.brand-mark,.mini-brand-mark{display:grid;place-items:center;background:linear-gradient(135deg,#14b8a6,#0f766e);color:#fff;border-radius:13px;width:42px;height:42px;flex-shrink:0;box-shadow:0 6px 14px #0d948826}.brand-copy{display:flex;flex-direction:column;gap:3px}.brand-copy span{font:800 17px Manrope,sans-serif;letter-spacing:-.045em}.brand-copy small{font-size:9px;letter-spacing:.12em;color:#7b8797;font-weight:700}.sidebar-brand{display:flex;align-items:center;justify-content:space-between;padding:0 3px 34px}.sidebar-label,.eyebrow{font-size:10px;letter-spacing:.12em;font-weight:800;color:#7b8797}.sidebar-label{padding:0 12px 12px}.sidebar-nav{display:flex;flex-direction:column;gap:6px}.nav-link{width:100%;display:flex;align-items:center;gap:12px;padding:12px 13px;border-radius:11px;background:transparent;color:#596579;text-align:left;font-size:13px;font-weight:600;transition:background .18s,color .18s}.nav-link:hover{background:#f5f8fa;color:#17212f}.nav-link.active{background:var(--sm-soft);color:var(--sm-teal-dark);font-weight:800}.nav-link.nav-record{margin-top:8px;background:#0d9488;color:#fff;box-shadow:0 7px 16px #0d94882a}.nav-link.nav-record:hover{background:#087f75}.nav-plus{margin-left:auto}.sidebar-bottom{margin-top:auto}.help-card{padding:17px 15px;background:#f6fafb;border:1px solid #e6f2f0;border-radius:15px}.help-icon{width:31px;height:31px;border-radius:10px;background:#d9f5f0;color:#0d9488;display:grid;place-items:center;margin-bottom:12px}.help-card strong{font:750 13px Manrope,sans-serif}.help-card p{font-size:11px;line-height:1.6;color:var(--sm-muted);margin:7px 0 12px}.help-card button{display:flex;align-items:center;gap:6px;color:var(--sm-teal-dark);font-size:11px;font-weight:800;background:transparent;padding:0}.sidebar-footer{display:flex;align-items:center;gap:10px;padding:18px 4px 0;margin-top:18px;border-top:1px solid var(--sm-border)}.mini-brand-mark{width:32px;height:32px;border-radius:10px}.sidebar-footer div:last-child{display:flex;flex-direction:column;gap:3px}.sidebar-footer strong{font-size:11px}.sidebar-footer span{font-size:10px;color:var(--sm-muted)}.main-area{margin-left:258px;min-height:100vh}.topbar{height:76px;padding:0 38px;border-bottom:1px solid var(--sm-border);background:rgba(255,255,255,.9);display:flex;align-items:center;justify-content:space-between;gap:20px;position:sticky;top:0;z-index:15;backdrop-filter:blur(12px)}.topbar-left,.topbar-right,.breadcrumb{display:flex;align-items:center}.topbar-left{gap:12px}.breadcrumb{gap:10px;font-size:12px;color:#8a94a4}.breadcrumb strong{color:#263244}.topbar-right{gap:15px}.top-search,.search-field{height:39px;border:1px solid var(--sm-border);background:#fff;border-radius:10px;display:flex;align-items:center;gap:9px;padding:0 11px;color:#8993a2}.top-search input,.search-field input{border:0;outline:0;min-width:0;width:150px;background:transparent;color:var(--sm-text);font-size:12px}.top-search kbd{font-size:10px;background:#f4f6f8;border:1px solid #e8ebef;border-radius:5px;padding:3px 5px;color:#8b95a3}.icon-button{width:38px;height:38px;display:grid;place-items:center;background:#fff;border:1px solid var(--sm-border)!important;border-radius:10px;color:#657184;position:relative;flex-shrink:0}.icon-button:hover{background:#f6f9fa;color:var(--sm-teal-dark)}.notification-button span{position:absolute;right:8px;top:7px;width:6px;height:6px;background:#f59e0b;border:1px solid #fff;border-radius:50%}.profile-chip{display:flex;align-items:center;gap:9px;background:transparent;color:#344054;font-size:12px;font-weight:700;max-width:190px}.profile-chip>span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.profile-chip-avatar{width:31px;height:31px;border-radius:50%;display:grid;place-items:center;overflow:hidden;background:#dff6f2;color:#0d9488}.profile-chip-avatar img{width:100%;height:100%;object-fit:cover}.page-content{max-width:1440px;padding:31px 38px 24px;margin:0 auto}.mobile-page-title,.mobile-logo,.mobile-menu-button,.sidebar-close,.bottom-nav,.mobile-overlay{display:none}.welcome-banner{position:relative;overflow:hidden;min-height:235px;border-radius:21px;padding:36px 39px;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(112deg,#087f75 0%,#0d9488 52%,#13a89a 100%);color:#fff;box-shadow:0 13px 28px #0d94881a}.welcome-content{max-width:510px;position:relative;z-index:2}.light-eyebrow{display:inline-flex;align-items:center;gap:7px;color:#c8fbf2}.welcome-banner h2{font:800 clamp(27px,3vw,38px)/1.15 Manrope,sans-serif;letter-spacing:-.055em;margin:15px 0 10px;max-width:440px}.welcome-banner p{font-size:13px;line-height:1.7;color:#e1fffa;max-width:390px;margin:0 0 22px}.button-white,.button-primary,.button-outline{display:inline-flex;align-items:center;justify-content:center;gap:9px;border-radius:10px;padding:11px 15px;font-size:12px;font-weight:800;transition:transform .15s,background .15s;white-space:nowrap}.button-white{background:#fff;color:#087f75}.button-white:hover,.button-primary:hover,.button-outline:hover{transform:translateY(-1px)}.banner-art{width:270px;height:190px;position:absolute;right:45px;top:20px;display:grid;place-items:center;opacity:.95}.art-circle{position:absolute;border:1px solid #c5fff455;border-radius:50%}.circle-one{width:190px;height:190px}.circle-two{width:140px;height:140px}.art-orbit{width:112px;height:112px;border-radius:50%;border:1px dashed #d6fff777;display:grid;place-items:center;transform:rotate(-18deg)}.art-shuttle{width:78px;height:78px;border-radius:25px;background:#ffffff22;border:1px solid #ffffff55;display:grid;place-items:center;transform:rotate(18deg);backdrop-filter:blur(5px)}.art-label{position:absolute;bottom:3px;right:12px;font-size:9px;letter-spacing:.1em;font-weight:800;display:flex;align-items:center;gap:6px;background:#ffffff20;border:1px solid #ffffff35;padding:8px 10px;border-radius:8px}.section-block{margin-top:31px}.section-heading,.panel-heading{display:flex;align-items:center;justify-content:space-between;gap:16px}.section-heading{margin-bottom:17px}.section-heading h2,.page-intro h2{font:800 22px/1.25 Manrope,sans-serif;letter-spacing:-.045em;margin:7px 0 5px}.section-heading p,.page-intro p,.panel-heading p{font-size:12px;color:var(--sm-muted);margin:0;line-height:1.6}.button-outline{border:1px solid var(--sm-border)!important;background:#fff;color:#465365}.button-outline:hover{background:#f8fafb}.metrics-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.metric-card{background:#fff;border:1px solid var(--sm-border);border-radius:15px;padding:18px 18px 17px;box-shadow:0 3px 10px #17212f03;min-width:0}.metric-top{display:flex;align-items:center;justify-content:space-between;gap:6px}.metric-icon,.action-icon{width:39px;height:39px;border-radius:12px;display:grid;place-items:center;flex-shrink:0}.metric-icon.teal,.action-icon.teal{background:#e3f8f4;color:#0d9488}.metric-icon.blue,.action-icon.blue{background:#eaf1ff;color:#4778d7}.metric-icon.orange,.action-icon.orange{background:#fff1e5;color:#e58a35}.metric-icon.purple,.action-icon.purple{background:#f2eaff;color:#8a5ad4}.trend-pill{display:inline-flex;align-items:center;gap:3px;background:#e8f8f2;color:#13866f;padding:5px 7px;border-radius:7px;font-size:9px;font-weight:800;white-space:nowrap}.trend-pill.neutral{background:#f3f5f7;color:#788394}.metric-title{font-size:11px;color:var(--sm-muted);margin:17px 0 6px}.metric-value{font:800 27px/1.2 Manrope,sans-serif;letter-spacing:-.04em}.dashboard-grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(320px,.85fr);gap:17px;margin-top:19px}.panel{background:#fff;border:1px solid var(--sm-border);border-radius:16px;padding:21px;box-shadow:0 3px 10px #17212f03;min-width:0}.panel-heading{margin-bottom:18px}.panel-heading h3{font:800 15px Manrope,sans-serif;letter-spacing:-.025em;margin:0 0 5px}.panel-heading p{font-size:11px}.chart-summary{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:17px}.chart-big-number{font:800 25px Manrope,sans-serif;letter-spacing:-.04em}.chart-caption{font-size:11px;color:var(--sm-muted)}.chart-tag{display:inline-flex;align-items:center;gap:5px;color:#0d9488;background:#e9f8f5;border-radius:7px;padding:6px 8px;font-size:9px;font-weight:800}.bar-chart{height:135px;display:flex;align-items:stretch;justify-content:space-around;gap:13px;padding:0 8px}.bar-column{display:flex;flex:1;max-width:48px;flex-direction:column;align-items:center;gap:8px;color:#8993a2;font-size:10px}.bar-track{height:110px;width:100%;display:flex;align-items:flex-end;background:#f3f7f8;border-radius:7px 7px 4px 4px;overflow:hidden}.bar-fill{width:100%;min-height:4px;background:linear-gradient(180deg,#7bd9cd,#c6f0e9);border-radius:6px 6px 0 0}.bar-fill.highlight{background:linear-gradient(180deg,#0d9488,#42c5b6)}.chart-disclaimer{font-size:10px;color:#98a1af;margin:12px 0 0}.quick-panel{padding-bottom:13px}.action-row{width:100%;display:flex;align-items:center;gap:12px;text-align:left;padding:12px 0;background:transparent;color:var(--sm-text);border-bottom:1px solid #f0f2f5!important}.action-row:last-child{border-bottom:0!important}.action-row:hover strong{color:var(--sm-teal-dark)}.action-icon{width:38px;height:38px;border-radius:11px}.action-row>div:nth-child(2){display:flex;flex-direction:column;gap:4px;flex:1;min-width:0}.action-row strong{font-size:12px}.action-row span{font-size:10px;color:var(--sm-muted)}.action-row>svg{color:#9aa4b2}.recent-panel{margin-top:18px}.match-list{display:flex;flex-direction:column}.match-row{display:flex;align-items:center;gap:12px;padding:14px 0;border-top:1px solid #f0f2f5;min-width:0}.match-row:first-child{border-top:0;padding-top:0}.result-mark{width:35px;height:35px;border-radius:11px;display:grid;place-items:center;flex-shrink:0}.result-mark.won{background:#e5f8f1;color:#12856d}.result-mark.lost{background:#fff0ed;color:#db695a}.match-main{display:flex;flex-direction:column;gap:5px;min-width:0;flex:1}.match-main strong{font-size:12px;overflow-wrap:anywhere}.match-main>span{display:flex;align-items:center;gap:5px;color:#8a94a3;font-size:10px}.match-main .match-stats{color:#667085;line-height:1.5}.match-right{display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0}.result-label{font-size:9px;font-weight:800;border-radius:6px;padding:5px 7px}.result-label.won{background:#e7f8f1;color:#14866d}.result-label.lost{background:#fff0ed;color:#d56354}.match-score{font-size:11px}.content-panel{display:flex;flex-direction:column;gap:19px}.page-intro{margin:2px 0 0}.page-intro h2{font-size:26px;margin:8px 0 6px}.profile-panel,.form-panel{padding:26px}.profile-avatar-wrap{display:flex;align-items:center;gap:17px;padding-bottom:23px;margin-bottom:23px;border-bottom:1px solid var(--sm-border)}.profile-avatar{width:76px;height:76px;object-fit:cover;border-radius:22px}.avatar-placeholder{display:grid;place-items:center;background:#e4f7f3;color:#0d9488}.profile-avatar-wrap h3{font:800 17px Manrope,sans-serif;margin:0 0 5px}.profile-avatar-wrap p{font-size:11px;color:var(--sm-muted);margin:0 0 10px}.upload-label{display:inline-flex;align-items:center;border:1px solid var(--sm-border);border-radius:8px;padding:7px 10px;font-size:10px;font-weight:800;color:#526071;cursor:pointer}.upload-label input{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:19px}.field{display:flex;flex-direction:column;gap:8px;min-width:0}.field>span{font-size:11px;font-weight:800;color:#465365}.field input,.field select,.field textarea{width:100%;height:43px;border:1px solid #dfe5eb;border-radius:9px;padding:0 12px;color:#263244;background:#fff;outline:none;font-size:12px;min-width:0}.field input:focus,.field select:focus{border-color:#53bdb1;box-shadow:0 0 0 3px #0d948814}.field small{font-size:10px;line-height:1.5;color:#8993a2}.full-width{grid-column:1/-1}.form-section-title{display:flex;align-items:center;gap:8px;color:#334155;font-size:12px;font-weight:800;border-bottom:1px solid #eef1f4;padding-bottom:11px;margin-bottom:-2px}.form-actions{display:flex;align-items:center;gap:10px;margin-top:3px}.button-primary{background:#0d9488;color:#fff}.button-primary:hover{background:#087f75}.form-note{font-size:10px;line-height:1.65;color:#8b95a3;margin:18px 0 0}.notice-bar{display:flex;align-items:center;gap:10px;background:#e8f8f2;color:#087f68;border:1px solid #c7eee2;border-radius:10px;padding:12px 14px;font-size:12px;margin-bottom:18px}.notice-bar span{flex:1}.notice-close{display:grid;place-items:center;background:transparent;color:inherit;padding:3px}.portfolio-metrics{margin-bottom:0}.portfolio-comparison{padding:23px}.comparison-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px}.comparison-item{border:1px solid #edf0f3;border-radius:12px;padding:15px;display:flex;flex-direction:column;align-items:flex-start;gap:10px;min-width:0}.comparison-item>span:first-child{font-size:11px;color:var(--sm-muted)}.comparison-item>strong{font:800 26px Manrope,sans-serif}.comparison-track{height:6px;background:#edf2f4;border-radius:20px;overflow:hidden;width:100%}.comparison-fill{height:100%;background:#0d9488;border-radius:20px}.comparison-item small{font-size:10px;color:#8b95a3}.comparison-status{font-size:9px;font-weight:800;line-height:1.5}.comparison-status.positive{color:#0d9488}.comparison-status.neutral{color:#9a6b2c}.search-field{height:36px}.search-field input{width:140px}.inline-empty{display:flex;align-items:center;gap:10px;color:#8b95a3;font-size:12px;padding:18px 0}.inline-empty p{margin:0}.empty-state{text-align:center;padding:28px 15px}.empty-icon{width:54px;height:54px;border-radius:17px;background:#e7f7f4;color:#0d9488;display:grid;place-items:center;margin:0 auto 13px}.empty-state h3{font:800 16px Manrope,sans-serif;margin:0 0 7px}.empty-state p{font-size:12px;color:var(--sm-muted);line-height:1.6;margin:0 auto 16px;max-width:320px}.prediction-banner{display:flex;align-items:center;gap:17px;padding:23px 25px;border-radius:16px;background:linear-gradient(110deg,#173c54,#145d66);color:#fff}.prediction-banner-icon{width:54px;height:54px;border-radius:16px;display:grid;place-items:center;background:#ffffff1d;color:#b5fff1;flex-shrink:0}.prediction-banner h3{font:800 19px Manrope,sans-serif;margin:7px 0}.prediction-banner p{font-size:11px;color:#d5e9ed;margin:0;line-height:1.6}.demo-notice{display:flex;align-items:flex-start;gap:12px;background:#fff8e8;border:1px solid #f5e1b6;color:#7c5b1c;border-radius:11px;padding:14px;margin-top:18px}.demo-notice>svg{flex-shrink:0;margin-top:1px}.demo-notice strong{font-size:12px}.demo-notice p{font-size:11px;line-height:1.6;margin:5px 0 0}.model-info{display:flex;flex-wrap:wrap;gap:10px 18px;padding-top:19px;margin-top:19px;border-top:1px solid #edf0f3}.model-info div{display:flex;align-items:center;gap:6px;font-size:10px;color:#687586}.model-info svg{color:#0d9488}.app-footer{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:23px 2px 0;color:#9aa3b1;font-size:10px}.app-footer span:last-child{display:flex;align-items:center;gap:6px}.app-footer svg{color:#0d9488}.sidebar-close{display:none}
@media(max-width:1200px){.sidebar{width:225px;padding-left:14px;padding-right:14px}.main-area{margin-left:225px}.topbar{padding:0 24px}.page-content{padding:25px 24px 22px}.metrics-grid{gap:10px}.metric-card{padding:15px}.metric-value{font-size:24px}.dashboard-grid{grid-template-columns:minmax(0,1fr) minmax(285px,.9fr)}.banner-art{right:10px;opacity:.7}.welcome-content{max-width:65%}}
@media(max-width:900px){.sidebar{width:250px;transform:translateX(-105%);transition:transform .22s ease;box-shadow:none}.sidebar.sidebar-open{transform:translateX(0);box-shadow:18px 0 50px #17212f24}.sidebar-close{display:grid}.mobile-overlay{display:block;position:fixed;inset:0;background:#17212f60;z-index:25;width:100%;height:100%}.main-area{margin-left:0}.mobile-menu-button{display:grid}.topbar{height:66px;padding:0 20px}.breadcrumb{display:none}.mobile-logo{display:flex;align-items:center;gap:9px;font-size:13px}.mobile-logo .brand-mark{width:34px;height:34px;border-radius:10px}.topbar-left{gap:10px}.top-search{display:none}.page-content{padding:22px 20px 28px}.mobile-page-title{display:block;margin:0 0 18px}.mobile-page-title h1{font:800 23px Manrope,sans-serif;letter-spacing:-.05em;margin:7px 0 0}.welcome-banner{min-height:210px;padding:28px}.banner-art{right:-45px;opacity:.42}.welcome-content{max-width:75%}.metrics-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.dashboard-grid{grid-template-columns:1fr}.bottom-nav{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));position:fixed;z-index:20;bottom:0;left:0;right:0;background:#fff;border-top:1px solid var(--sm-border);padding:7px 8px calc(7px + env(safe-area-inset-bottom));box-shadow:0 -5px 20px #17212f08}.bottom-nav-item{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-width:0;padding:4px 2px;border-radius:9px;background:transparent;color:#8993a2;font-size:9px;font-weight:700}.bottom-icon{width:30px;height:27px;border-radius:9px;display:grid;place-items:center}.bottom-nav-item.active{color:#0d9488}.bottom-nav-item.active .bottom-icon{background:#e5f8f4}.bottom-nav-item.bottom-record .bottom-icon{background:#0d9488;color:#fff;box-shadow:0 4px 10px #0d94882b}.page-content{padding-bottom:110px}.app-footer{padding-bottom:4px}.profile-chip{max-width:43px;padding:0}.profile-chip>span,.profile-chip>svg{display:none}.profile-chip-avatar{width:34px;height:34px}}
@media(max-width:560px){.topbar{padding:0 13px;gap:8px}.topbar-right{gap:8px}.page-content{padding:17px 13px 105px}.mobile-page-title h1{font-size:21px}.welcome-banner{padding:23px 20px;min-height:225px;border-radius:16px}.welcome-content{max-width:100%}.welcome-banner h2{font-size:27px;max-width:280px}.welcome-banner p{font-size:12px;max-width:270px}.banner-art{right:-120px;top:25px;opacity:.22}.art-label{display:none}.section-block{margin-top:25px}.section-heading{align-items:flex-start}.section-heading h2,.page-intro h2{font-size:20px}.section-heading p{max-width:235px}.desktop-only{display:none!important}.metrics-grid{gap:9px}.metric-card{padding:13px;border-radius:13px}.metric-icon{width:34px;height:34px;border-radius:10px}.trend-pill{font-size:8px;padding:4px 5px}.metric-title{font-size:10px;line-height:1.4;margin-top:13px}.metric-value{font-size:23px}.panel{padding:16px;border-radius:14px}.panel-heading{align-items:flex-start}.panel-heading h3{font-size:14px}.dashboard-grid{gap:13px;margin-top:14px}.bar-chart{gap:8px;padding:0 2px}.chart-summary{align-items:flex-start}.chart-tag{font-size:8px}.recent-panel .panel-heading{align-items:center}.match-row{gap:9px}.result-mark{width:31px;height:31px;border-radius:9px}.match-main strong{font-size:11px}.match-score{font-size:10px}.result-label{font-size:8px;padding:4px 5px}.content-panel{gap:14px}.page-intro h2{font-size:23px}.profile-panel,.form-panel{padding:17px}.profile-avatar{width:64px;height:64px;border-radius:18px}.profile-avatar-wrap{gap:12px}.profile-avatar-wrap h3{font-size:15px}.form-grid{grid-template-columns:1fr;gap:15px}.full-width{grid-column:auto}.form-section-title{grid-column:auto}.form-actions{grid-column:auto}.form-actions .button-primary{width:100%}.comparison-grid{grid-template-columns:1fr}.comparison-item{padding:13px}.portfolio-comparison{padding:16px}.search-field{max-width:145px;padding:0 8px}.search-field input{width:95px;font-size:11px}.prediction-banner{padding:18px;gap:12px}.prediction-banner-icon{width:44px;height:44px;border-radius:13px}.prediction-banner h3{font-size:16px}.prediction-banner p{font-size:10px}.model-info{flex-direction:column;gap:9px}.app-footer{font-size:9px;flex-wrap:wrap}.app-footer span:last-child{display:none}.topbar .icon-button{width:34px;height:34px}.mobile-logo strong{font-size:12px}.notice-bar{font-size:11px;padding:10px}.match-main .match-stats{font-size:9px}}
@media(prefers-reduced-motion:reduce){.app-shell *{scroll-behavior:auto!important;animation-duration:.01ms!important;transition-duration:.01ms!important}}
`}</style>

    </div>
  );
}
