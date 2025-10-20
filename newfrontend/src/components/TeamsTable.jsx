import React, { useEffect, useState } from 'react';
import { fetchWithToken } from '../api';

const TeamsTable = () => {
    const [teams, setTeams] = useState([]);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const response = await fetchWithToken('/routes/teams', { method: 'GET' });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();

                const teamsWithPct = data.map(team => {
                    const winPct = team.games_played > 0 ? (team.wins / team.games_played) : 0;
                    return { ...team, win_pct: winPct };
                });

                const leader = teamsWithPct.reduce((best, t) => {
                    if (t.win_pct > best.win_pct) return t;
                    if (t.win_pct === best.win_pct && t.wins > best.wins) return t;
                    return best;
                }, teamsWithPct[0] || { wins: 0, losses: 0, win_pct: 0 });

                const teamsWithGB = teamsWithPct.map(team => {
                    const gb = ((leader.wins - team.wins) + (team.losses - leader.losses)) / 2;
                    return { ...team, games_behind: gb };
                });

                const sortedTeams = teamsWithGB.sort((a, b) => b.win_pct - a.win_pct);
                setTeams(sortedTeams);
            } catch (err) {
                console.error('fetchTeams failed', err);
                setTeams([]);
            }
        };

        fetchTeams();
    }, []);

    return (
        <div>
           <h1 style={{ marginBottom: "2rem" }}>Team Standings</h1>
           <table style={{
                width: "100%",
                minWidth: "300px",
                borderCollapse: "separate",
                borderSpacing: "0 12px",
                fontSize: "0.95rem"
            }}>
                <thead>
                    <tr style={{ background: "#222", color: "#fff" }}>
                        <th style={{ padding: "2px" }}>Team Name</th>
                        <th style={{ padding: "2px" }}>W</th>
                        <th style={{ padding: "2px" }}>L</th>
                        <th style={{ padding: "2px" }}>Win Pct.</th>
                        <th style={{ padding: "2px" }}>Games Behind</th>
                        <th style={{ padding: "2px" }}>Games Played</th>
                    </tr>
                </thead>
                <tbody>
                    {teams.map((team) => (
                        <tr key={team.id} style={{ background: "#111", color: "#fff" }}>
                            <td style={{ padding: "2px 8px" }}>{team.name}</td>
                            <td style={{ padding: "2px 8px", textAlign: "center" }}>{team.wins}</td>
                            <td style={{ padding: "2px 8px", textAlign: "center" }}>{team.losses}</td>
                            <td style={{ padding: "2px 8px", textAlign: "center" }}>
                                {team.games_played > 0
                                    ? (team.win_pct).toFixed(3).replace(/^0\./, ".") + '%'
                                    : '.0%'}
                            </td>
                            <td style={{ padding: "2px 8px", textAlign: "center" }}>
                                {team.games_behind === 0
                                    ? "—"
                                    : team.games_behind.toFixed(1)}
                            </td>
                            <td style={{ padding: "2px 8px", textAlign: "center" }}>{team.games_played}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TeamsTable;