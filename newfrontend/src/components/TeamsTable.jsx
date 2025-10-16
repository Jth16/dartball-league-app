import React, { useEffect, useState } from 'react';

const TeamsTable = () => {
    const [teams, setTeams] = useState([]);

    useEffect(() => {
        const fetchTeams = async () => {
            const response = await fetch('http://dartball-backend-669423444851.us-central1.run.app/routes/teams');
            const data = await response.json();

            // Calculate win percentage for each team
            const teamsWithPct = data.map(team => {
                const winPct = team.games_played > 0 ? (team.wins / team.games_played) : 0;
                return { ...team, win_pct: winPct };
            });

            // Sort teams by most wins
            const sortedTeams = teamsWithPct.sort((a, b) => b.wins - a.wins);
            setTeams(sortedTeams);
        };

        fetchTeams();
    }, []);

    return (
        <div>
           <h1 style={{ marginBottom: "2rem" }}>Dartball League Teams</h1>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 16px" }}>
                <thead>
                    <tr style={{ background: "#222", color: "#fff" }}>
                        <th style={{ padding: "16px" }}>Team Name</th>
                        <th style={{ padding: "16px" }}>Wins</th>
                        <th style={{ padding: "16px" }}>Losses</th>
                        <th style={{ padding: "16px" }}>Games Behind</th>
                        <th style={{ padding: "16px" }}>Games Played</th>
                        <th style={{ padding: "16px" }}>Win Pct.</th>
                    </tr>
                </thead>
                <tbody>
                    {teams.map((team) => (
                        <tr key={team.id} style={{ background: "#111", color: "#fff" }}>
                            <td style={{ padding: "16px 24px" }}>{team.name}</td>
                            <td style={{ padding: "16px 24px", textAlign: "center" }}>{team.wins}</td>
                            <td style={{ padding: "16px 24px", textAlign: "center" }}>{team.losses}</td>
                            <td style={{ padding: "16px 24px", textAlign: "center" }}>{team.games_behind}</td>
                            <td style={{ padding: "16px 24px", textAlign: "center" }}>{team.games_played}</td>
                            <td style={{ padding: "16px 24px", textAlign: "center" }}>
                                {team.games_played > 0 ? (team.win_pct * 100).toFixed(1) + '%' : '0.0%'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TeamsTable;