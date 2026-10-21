import React, { useEffect } from "react";
import { BrowserRouter as Router, useLocation, useNavigate } from "react-router-dom";
import TeamsTable from "./components/TeamsTable";
import StatsPage from "./components/StatsPage";
import AdminLogin from "./components/AdminLogin";
import HeaderImage from "./components/HeaderImage";
import AdminPwdPage from "./components/AdminPwd";
import Schedule from "./components/Schedule";
import Leaders from "./components/Leaders"; // added
import Rules from "./components/Rules";
import Playoffs from "./components/Playoffs";
import Archive from "./components/Archive";
import PrivacyPolicy from "./components/PrivacyPolicy";
import { initGA, pageview } from "./utils/analytics";
import Home from "./components/Home";

const API_BASE = process.env.REACT_APP_API_URL || "https://dartball-backend-654879525708.us-central1.run.app";

// page key -> URL path. The keys are what the rest of the app (Home's onNavigate) already uses.
const PAGE_PATHS = {
  home: "/",
  teams: "/standings",
  Stats: "/stats",
  schedule: "/schedule",
  rules: "/rules",
  archive: "/past-seasons",
  leaders: "/leaders",
  playoffs: "/playoffs",
  privacy: "/privacy",
  admin: "/admin",
};

const PAGE_TITLES = {
  home: "Home",
  teams: "Standings",
  Stats: "All Stats",
  schedule: "Schedule",
  rules: "Rules",
  archive: "Past Seasons",
  leaders: "Leaders",
  playoffs: "Playoffs",
  privacy: "Privacy Policy",
  admin: "Admin",
};

const pageFromPath = (pathname) => {
  const clean = pathname.replace(/\/+$/, "") || "/";
  const match = Object.keys(PAGE_PATHS).find((k) => PAGE_PATHS[k] === clean);
  return match || "home";
};

const NAV_ITEMS = [
  { key: "home", label: "Home" },
  { key: "teams", label: "Standings" },
  { key: "Stats", label: "All Stats" },
  { key: "schedule", label: "Schedule" },
  { key: "rules", label: "Rules" },
  { key: "archive", label: "Past Seasons" },
];

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const page = pageFromPath(location.pathname);
  const setPage = (key) => {
    navigate(PAGE_PATHS[key] || "/");
    window.scrollTo(0, 0);
  };
  const [teams, setTeams] = React.useState([]);
  const [isAdmin, setIsAdmin] = React.useState(false);

  useEffect(() => {
    initGA();
  }, []);

  // pageview + tab title on every route change (back/forward included)
  useEffect(() => {
    pageview(location.pathname + location.search);
    document.title = page === "home"
      ? "Labelle Dartball League"
      : `${PAGE_TITLES[page]} | Labelle Dartball League`;
  }, [location.pathname, location.search, page]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/routes/teams`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setTeams(data);
      } catch (err) {
        console.error("fetch failed", err);
      }
    }
    load();
  }, []);

  // Reset admin flag whenever user navigates away from the admin page
  useEffect(() => {
    if (page !== "admin" && isAdmin) {
      setIsAdmin(false);
    }
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
      <div
        style={{
          background: "#000",
          minHeight: "100vh",
          color: "#fff",
          position: "relative",
        }}
      >
        <HeaderImage />
        <nav
          className="site-nav"
          style={{
            /* main nav background (keeps existing look) */
            backgroundImage: "linear-gradient(90deg, #232526 0%, #000000 100%) , linear-gradient(90deg, #663e01ff, #663e01ff)",
            /* create a stylish gradient bottom border using a second background + transparent border */
            borderBottom: "6px solid transparent",
            backgroundOrigin: "padding-box, border-box",
            backgroundClip: "padding-box, border-box",
            boxShadow: "0 2px 8px rgba(0,0,0,0.7)",
          }}
        >
          {NAV_ITEMS.map(({ key, label }) => (
            <button
              key={key}
              className={"nav-btn" + (page === key ? " nav-btn-active" : "")}
              onClick={() => setPage(key)}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="site-content">
         {page === "home" && <Home onNavigate={setPage} />}
        {page === "teams" && <TeamsTable teams={teams} />}
        {page === "Stats" && <StatsPage />}
        {page === "schedule" && <Schedule />}
{page === "leaders" && <Leaders />}
        {page === "playoffs" && <Playoffs />}
        {page === "rules" && <Rules />}
        {page === "archive" && <Archive />}
        {page === "privacy" && <PrivacyPolicy />}
        {page === "admin" &&
          (isAdmin ? (
            <AdminLogin setIsAdmin={setIsAdmin} />
          ) : (
            <AdminPwdPage setIsAdmin={setIsAdmin} />
          ))}
        </div>
        <footer style={{ textAlign: "center", padding: "1rem 0", color: "#666", fontSize: "0.9rem" }}>
        &copy; {new Date().getFullYear()} Labelle Dartball League
        <br />
        <a
          href="#"
          onClick={e => { e.preventDefault(); setPage("privacy"); }}
          style={{ color: "#555", fontSize: "0.75rem", textDecoration: "underline", cursor: "pointer" }}
        >
          Privacy Policy
        </a>
      </footer>
        <div
          style={{
            left: 0,
            bottom: 0,
            width: "100%",
            background: "#222",
            textAlign: "center",
            padding: "1rem 0",
            boxShadow: "0 -2px 8px rgba(0,0,0,0.7)",
          }}
        >
          {page !== "admin" && (
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                setPage("admin");
              }}
              style={{
                color: "#ff9800",
                fontWeight: "bold",
                fontSize: "1.1rem",
                textDecoration: "none",
                padding: "0.75rem 2rem",
                borderRadius: "25px",
                background: "#222",
                boxShadow: "0 0 10px #ff9800",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Admin
            </a>
          )}
        </div>
      </div>
  );
}

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default App;
