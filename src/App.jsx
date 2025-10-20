import React, { useState, useEffect } from "react";
import TeamsTable from "./components/TeamsTable";
import PlayersPage from "./components/PlayersTable";
import AdminLogin from "./components/AdminLogin";
import HeaderImage from "./components/HeaderImage";
import AdminPwdPage from "./components/AdminPwd";
import Schedule from "./components/Schedule";

function App() {
  const [page, setPage] = useState("teams");
  const [teams, setTeams] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/routes/teams`)
      .then((res) => res.json())
      .then(setTeams);
  }, []);

  // Reset admin flag whenever user navigates away from the admin page
  useEffect(() => {
    if (page !== "admin" && isAdmin) {
      setIsAdmin(false);
    }
  }, [page]);

  return (
    <div
      style={{
        minWidth: "600px",
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
          background: "linear-gradient(90deg, #232526 0%, #000000 100%)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.7)",
        }}
      >
        <button
          onClick={() => setPage("teams")}
          style={{
            background: page === "teams" ? "#ff9800" : "#222",
            color: "#fff",
            border: "none",
            borderRadius: "25px",
            padding: "0.75rem 2rem",
            margin: "0 1rem",
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
            padding: "0.75rem 2rem",
            margin: "0 1rem",
            fontSize: "1.1rem",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: page === "players" ? "0 0 10px #ff9800" : "none",
            transition: "all 0.2s",
          }}
        >
          Player Stats
        </button>
        <button
          onClick={() => setPage("schedule")}
          style={{
            background: page === "schedule" ? "#ff9800" : "#222",
            color: "#fff",
            border: "none",
            borderRadius: "25px",
            padding: "0.75rem 2rem",
            margin: "0 1rem",
            fontSize: "1.1rem",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: page === "schedule" ? "0 0 10px #ff9800" : "none",
            transition: "all 0.2s",
          }}
        >
          Schedule
        </button>
      </nav>
      <div style={{ maxWidth: 900, height: "800px", margin: "auto", background: "#111", padding: "2rem", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.8)" }}>
        {page === "teams" && <TeamsTable teams={teams} />}
        {page === "players" && <PlayersPage />}
        {page === "schedule" && <Schedule />}
        {page === "admin" &&
          (isAdmin ? (
            <AdminLogin setIsAdmin={setIsAdmin} setTeams={setTeams} teams={teams} />
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
          Admin Login
        </a>
      </div>
    </div>
  );
}

export default App;