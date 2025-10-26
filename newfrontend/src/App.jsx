import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import TeamsTable from "./components/TeamsTable";
import PlayersPage from "./components/PlayersTable";
import AdminLogin from "./components/AdminLogin";
import HeaderImage from "./components/HeaderImage";
import AdminPwdPage from "./components/AdminPwd";
import Schedule from "./components/Schedule";
import Leaders from "./components/Leaders"; // added
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
              margin: "0 .5rem",
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
              padding: "0.75rem 1.25rem",
              margin: "0 .5rem",
              fontSize: "1.1rem",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: page === "teams" ? "0 0 10px #ff9800" : "none",
              transition: "all 0.2s",
            }}
          >
            Teams
          </button>
          <button
            onClick={() => setPage("players")}
            style={{
              background: page === "players" ? "#ff9800" : "#222",
              color: "#fff",
              border: "none",
              borderRadius: "25px",
              padding: "0.75rem 1.25rem",
              margin: "0 .5rem",
              fontSize: "1.1rem",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: page === "players" ? "0 0 10px #ff9800" : "none",
              transition: "all 0.2s",
            }}
          >
            Players
          </button>
          <button
            onClick={() => setPage("schedule")}
            style={{
              background: page === "schedule" ? "#ff9800" : "#222",
              color: "#fff",
              border: "none",
              borderRadius: "25px",
              padding: "0.75rem 1.25rem",
              margin: "0 .5rem",
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
            onClick={() => setPage("leaders")}
            style={{
              background: page === "leaders" ? "#ff9800" : "#222",
              color: "#fff",
              border: "none",
              borderRadius: "25px",
              padding: "0.75rem 1.25rem",
              margin: "0 .5rem",
              fontSize: "1.1rem",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: page === "leaders" ? "0 0 10px #ff9800" : "none",
              transition: "all 0.2s",
            }}
          >
            Leaders
          </button>
        </nav>
        <div style={{ maxWidth: 900, height: "100%", minHeight: "800px", margin: "auto", background: "#111", padding: "2rem", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.8)" }}>
         {page === "home" && <Home />}
        {page === "teams" && <TeamsTable teams={teams} />}
        {page === "players" && <PlayersPage />}
        {page === "schedule" && <Schedule />}
        {page === "leaders" && <Leaders />}
        {page === "admin" &&
          (isAdmin ? (
            <AdminLogin setIsAdmin={setIsAdmin} />
          ) : (
            <AdminPwdPage setIsAdmin={setIsAdmin} />
          ))}
        </div>
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