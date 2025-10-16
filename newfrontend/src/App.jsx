import React, { useState, useEffect } from "react";
import TeamsTable from "./components/TeamsTable";
import AdminLogin from "./components/AdminLogin";
import PlayersPage from "./components/PlayersTable";
import HeaderImage from "./components/HeaderImage"; // Import the header
import { BrowserRouter } from "react-router-dom";

function App() {
  const [page, setPage] = useState("teams");
  const [teams, setTeams] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/routes/teams")
      .then((res) => res.json())
      .then(setTeams);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        fontFamily: "Segoe UI, Arial, sans-serif",
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
          Teams Table
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
          Players Page
        </button>
        <button
          onClick={() => setPage("admin")}
          style={{
            background: page === "admin" ? "#ff9800" : "#222",
            color: "#fff",
            border: "none",
            borderRadius: "25px",
            padding: "0.75rem 2rem",
            margin: "0 1rem",
            fontSize: "1.1rem",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: page === "admin" ? "0 0 10px #ff9800" : "none",
            transition: "all 0.2s",
          }}
        >
          Admin Login
        </button>
      </nav>
      <div style={{ maxWidth: 900, margin: "2rem auto", background: "#111", padding: "2rem", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.8)" }}>
        {page === "teams" && <TeamsTable teams={teams} />}
        {page === "players" && <PlayersPage />}
        {page === "admin" &&
          (isAdmin ? (
            <AdminLogin setIsAdmin={setIsAdmin} setTeams={setTeams} teams={teams} />
          ) : (
            <button
              onClick={() => setIsAdmin(true)}
              style={{
                background: "#ff9800",
                color: "#fff",
                border: "none",
                borderRadius: "25px",
                padding: "0.75rem 2rem",
                fontSize: "1.1rem",
                fontWeight: "bold",
                cursor: "pointer",
                boxShadow: "0 0 10px #ff9800",
                marginTop: "1rem",
              }}
            >
              Login as Admin
            </button>
          ))}
      </div>
    </div>
  );
}

export default App;