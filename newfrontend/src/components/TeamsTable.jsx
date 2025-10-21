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

                // helper to read games played from any field name
                const getGP = (t) => {
                    return Number(t.games_played ?? t.GP ?? t.games ?? t.gamesPlayed ?? 0) || 0;
                };

                // Use win_pct returned from the route (do not compute from wins/gp)
                const normalizeWinPct = (t) => {
                    const raw = Number(t.win_pct ?? t.win_percentage ?? t.WP ?? 0) || 0;
                    // if backend returned fraction (<= 1) convert to percent, otherwise assume percent already
                    return raw <= 1 ? raw * 100 : raw;
                };

                const teamsWithPct = data.map(team => {
                    const gp = getGP(team);
                    const winPct = normalizeWinPct(team);
                    return { ...team, games_played: gp, win_pct: winPct };
                });

                const leader = teamsWithPct.reduce((best, t) => {
                    if (!best) return t;
                    if (t.win_pct > best.win_pct) return t;
                    if (t.win_pct === best.win_pct && (t.wins || 0) > (best.wins || 0)) return t;
                    return best;
                }, teamsWithPct[0] || null) || { wins: 0, losses: 0, win_pct: 0 };

                const teamsWithGB = teamsWithPct.map(team => {
                    const gb = ((leader.wins - (team.wins || 0)) + ((team.losses || 0) - leader.losses)) / 2;
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

    const formatPct = (pct) => {
        const n = Number(pct) || 0;
        const v = n / 100;               // divide win percentage by 100
        const s = v.toFixed(3);          // show 3 decimal places
        return s.replace(/^0\./, '.');   // display like .750
    };

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
                                    ? formatPct(team.win_pct)
                                    : '.000'}
                            </td>
                            <td style={{ padding: "2px 8px", textAlign: "center" }}>
                                {team.games_behind === 0
                                    ? "—"
                                    : Number(team.games_behind).toFixed(1)}
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