import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import TeamsTable from "./components/TeamsTable";
import StatsPage from "./components/StatsPage";
import AdminLogin from "./components/AdminLogin";
import HeaderImage from "./components/HeaderImage";
import AdminPwdPage from "./components/AdminPwd";
import Schedule from "./components/Schedule";
import Leaders from "./components/Leaders"; // added
import Rules from "./components/Rules";
import PrivacyPolicy from "./components/PrivacyPolicy";
import { initGA, pageview } from "./utils/analytics";
import Home from "./components/Home";

const API_BASE = process.env.REACT_APP_API_URL || "https://dartball-backend-654879525708.us-central1.run.app";

function App() {
  const [page, setPage] = React.useState("home");
  const [teams, setTeams] = React.useState([]);
  const [isAdmin, setIsAdmin] = React.useState(false);

  useEffect(() => {
    initGA();
    // send first pageview
    pageview(window.location.pathname + window.location.search);
  }, []);

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
  }, [page]);

  return (
    <Router>
      <div
        style={{
          minWidth: "660px",
          background: "#000",
          minHeight: "100vh",
          color: "#fff",
          fontFamily: "Segoe UI, Arial, sans-serif",
          position: "relative",
        }}
      >
        <HeaderImage />
        <nav
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "1.5rem 0",
            /* main nav background (keeps existing look) */
            backgroundImage: "linear-gradient(90deg, #232526 0%, #000000 100%) , linear-gradient(90deg, #663e01ff, #663e01ff)",
            /* create a stylish gradient bottom border using a second background + transparent border */
            borderBottom: "6px solid transparent",
            backgroundOrigin: "padding-box, border-box",
            backgroundClip: "padding-box, border-box",
            boxShadow: "0 2px 8px rgba(0,0,0,0.7)",
          }}
        >
          <button
            onClick={() => setPage("home")}
            style={{
              background: page === "home" ? "#ff9800" : "#222",
              color: "#fff",
              border: "none",
              borderRadius: "25px",
              padding: "0.75rem 1.25rem",
              margin: "0 .25rem",
              fontSize: "1.1rem",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: page === "home" ? "0 0 10px #ff9800" : "none",
              transition: "all 0.2s",
            }}
          >
            Home
          </button>
          <button
            onClick={() => setPage("teams")}
            style={{
              background: page === "teams" ? "#ff9800" : "#222",
              color: "#fff",
              border: "none",
              borderRadius: "25px",
              padding: "0.75rem 1rem",
              margin: "0 .25rem",
              fontSize: "1.1rem",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: page === "teams" ? "0 0 10px #ff9800" : "none",
              transition: "all 0.2s",
            }}
          >
            Standings
          </button>
          <button
            onClick={() => setPage("Stats")}
            style={{
              background: page === "Stats" ? "#ff9800" : "#222",
              color: "#fff",
              border: "none",
              borderRadius: "25px",
              padding: "0.75rem 1.25rem",
              margin: "0 .25rem",
              fontSize: "1.1rem",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: page === "players" ? "0 0 10px #ff9800" : "none",
              transition: "all 0.2s",
            }}
          >
           All Stats
          </button>
 
      
          <button
            onClick={() => setPage("schedule")}
            style={{
              background: page === "schedule" ? "#ff9800" : "#222",
              color: "#fff",
              border: "none",
              borderRadius: "25px",
              padding: "0.75rem 1.25rem",
              margin: "0 .25rem",
              fontSize: "1.1rem",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: page === "schedule" ? "0 0 10px #ff9800" : "none",
              transition: "all 0.2s",
            }}
          >
            Schedule
          </button>

          <button
            onClick={() => setPage("rules")}
            style={{
              background: page === "rules" ? "#ff9800" : "#222",
              color: "#fff",
              border: "none",
              borderRadius: "25px",
              padding: "0.75rem 1.25rem",
              margin: "0 .25rem",
              fontSize: "1.1rem",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: page === "rules" ? "0 0 10px #ff9800" : "none",
              transition: "all 0.2s",
            }}
          >
            Rules
          </button>

        </nav>
        <div style={{ maxWidth: 900, height: "100%", minHeight: "800px", margin: "auto", background: "#111", padding: "2rem", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.8)" }}>
         {page === "home" && <Home onNavigate={setPage} />}
        {page === "teams" && <TeamsTable teams={teams} />}
        {page === "Stats" && <StatsPage />}
        {page === "schedule" && <Schedule />}
        {page === "leaders" && <Leaders />}
        {page === "rules" && <Rules />}
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
      
    </Router>
  );
}

export default App;