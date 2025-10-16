import React, { useEffect, useState } from "react";

const PlayersPage = () => {
    const [teams, setTeams] = useState([]);
    const [selectedTeamId, setSelectedTeamId] = useState("");
    const [players, setPlayers] = useState([]);

    useEffect(() => {
        // Fetch teams for dropdown
        fetch("https://dartball-backend-669423444851.us-central1.run.app/routes/teams")
            .then((res) => res.json())
            .then(setTeams);
    }, []);

    useEffect(() => {
        if (selectedTeamId) {
            fetch(`https://dartball-backend-669423444851.us-central1.run.app/routes/players?team_id=${selectedTeamId}`)
                .then((res) => res.json())
                .then(setPlayers);
        } else {
            setPlayers([]);
        }
    }, [selectedTeamId]);

    return (
        <div style={{ maxWidth: 900, margin: "2rem auto", background: "#111", color: "#fff", padding: "2rem", borderRadius: 16 }}>
            <h1 style={{ marginBottom: "2rem" }}>Players</h1>
            <div style={{ marginBottom: "2rem" }}>
                <label htmlFor="team-select" style={{ marginRight: "1rem" }}>Select Team:</label>
                <select
                    id="team-select"
                    value={selectedTeamId}
                    onChange={e => setSelectedTeamId(e.target.value)}
                    style={{ padding: "0.5rem 1rem", borderRadius: 8, fontSize: "1rem" }}
                >
                    <option value="">-- Choose a Team --</option>
                    {teams.map(team => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                </select>
            </div>
            {players.length > 0 ? (
                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 12px" }}>
                    <thead>
                        <tr style={{ background: "#222", color: "#fff" }}>
                            <th style={{ padding: "12px" }}>Name</th>
                            <th style={{ padding: "12px" }}>Singles</th>
                            <th style={{ padding: "12px" }}>Doubles</th>
                            <th style={{ padding: "12px" }}>Triples</th>
                            <th style={{ padding: "12px" }}>Dimes</th>
                            <th style={{ padding: "12px" }}>HRs</th>
                            <th style={{ padding: "12px" }}>Avg</th>
                            <th style={{ padding: "12px" }}>GP</th>
                            <th style={{ padding: "12px" }}>At Bats</th>
                        </tr>
                    </thead>
                    <tbody>
                        {players.map(player => (
                            <tr key={player.id} style={{ background: "#191919" }}>
                                <td style={{ padding: "12px" }}>{player.name}</td>
                                <td style={{ padding: "12px", textAlign: "center" }}>{player.Singles}</td>
                                <td style={{ padding: "12px", textAlign: "center" }}>{player.Doubles}</td>
                                <td style={{ padding: "12px", textAlign: "center" }}>{player.Triples}</td>
                                <td style={{ padding: "12px", textAlign: "center" }}>{player.Dimes}</td>
                                <td style={{ padding: "12px", textAlign: "center" }}>{player.HRs}</td>
                                <td style={{ padding: "12px", textAlign: "center" }}>{player.Avg?.toFixed(3).replace(/^0\./, ".")}</td>
                                <td style={{ padding: "12px", textAlign: "center" }}>{player.GP}</td>
                                <td style={{ padding: "12px", textAlign: "center" }}>{player.AtBats}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : selectedTeamId ? (
                <p>No players found for this team.</p>
            ) : null}
        </div>
    );
};

export default PlayersPage;