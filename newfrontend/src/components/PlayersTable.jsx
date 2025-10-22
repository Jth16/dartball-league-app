import React, { useEffect, useState } from "react";
import { fetchWithToken } from '../api';

const PlayersTable = () => {
    const [teams, setTeams] = useState([]);
    const [groupedPlayers, setGroupedPlayers] = useState([]);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                const teamsRes = await fetchWithToken('/routes/teams', { method: 'GET' });
                if (!teamsRes.ok) throw new Error(`teams fetch ${teamsRes.status}`);
                const teamsData = await teamsRes.json();
                if (!mounted) return;
                setTeams(teamsData);

                // fetch players for each team in parallel
                const groups = await Promise.all(teamsData.map(async (t) => {
                    try {
                        const res = await fetchWithToken(`/routes/players?team_id=${t.id}`, { method: 'GET' });
                        const players = res.ok ? await res.json() : [];
                        return { teamId: t.id, teamName: t.name, players };
                    } catch (err) {
                        console.error('fetch players for team failed', t.id, err);
                        return { teamId: t.id, teamName: t.name, players: [] };
                    }
                }));

                if (mounted) setGroupedPlayers(groups);
            } catch (err) {
                console.error('load teams/players failed', err);
                if (mounted) {
                    setTeams([]);
                    setGroupedPlayers([]);
                }
            }
        };

        load();
        return () => { mounted = false; };
    }, []);

    return (
        // make container full width like TeamsTable and allow table scrolling on small screens
        <div style={{ width: "100%", margin: "1rem 0", background: "rgba(17, 17, 17, 1)", color: "#fff", padding: "1rem", boxSizing: "border-box", borderRadius: 16 }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <h1 style={{ marginBottom: "1rem" }}>All Players</h1>

            {groupedPlayers.length === 0 ? (
                <p>Loading teams and players…</p>
            ) : (
                groupedPlayers.map(group => (
                    <section key={group.teamId} style={{ marginBottom: 28 }}>
                        <h2 style={{ margin: "8px 0 12px", color: "#fff" }}>{group.teamName}</h2>

                        {group.players && group.players.length > 0 ? (
                            // horizontal scroll wrapper to fit on mobile
                            <div style={{ overflowX: "auto" }}>
                              <table style={{ width: "100%", minWidth: 300, borderCollapse: "separate", borderSpacing: "0 10px" }}>
                                <thead>
                                    <tr style={{ background: "rgba(34, 34, 34, 1)", color: "#e6f7ff" }}>
                                        <th style={{ padding: "5px", textAlign: "left" }}>Name</th>
                                        <th style={{ padding: "5px" }}>At Bats</th>
                                        <th style={{ padding: "5px" }}>Hits</th>
                                        <th style={{ padding: "5px" }}>Avg</th>
                                        <th style={{ padding: "5px" }}>Singles</th>
                                        <th style={{ padding: "5px" }}>Doubles</th>
                                        <th style={{ padding: "5px" }}>Triples</th>
                                        <th style={{ padding: "5px" }}>Dimes</th>
                                        <th style={{ padding: "5px" }}>HRs</th>
                                        <th style={{ padding: "5px" }}>GP</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {group.players.map(player => (
                                        <tr key={player.id} style={{ background: "rgba(17, 17, 17, 1)", borderRadius: 6 }}>   
                                            <td style={{ padding: "10px" }}>{player.name}</td>
                                            <td style={{ padding: "10px", textAlign: "center" }}>{player.AtBats ?? 0}</td>
                                              <td style={{ padding: "10px", textAlign: "center" }}>{player.hits ?? 0}</td>
                                              <td style={{ padding: "10px", textAlign: "center" }}>
                                                {typeof player.Avg === 'number'
                                                    ? player.Avg.toFixed(3).replace(/^0\./, ".")
                                                    : 'N/A'}
                                            </td>
                                            <td style={{ padding: "10px", textAlign: "center" }}>{player.Singles ?? 0}</td>
                                            <td style={{ padding: "10px", textAlign: "center" }}>{player.Doubles ?? 0}</td>
                                            <td style={{ padding: "10px", textAlign: "center" }}>{player.Triples ?? 0}</td>     
                                            <td style={{ padding: "10px", textAlign: "center" }}>{player.HRs ?? 0}</td>
                                            <td style={{ padding: "10px", textAlign: "center" }}>{player.Dimes ?? 0}</td>
                                            <td style={{ padding: "10px", textAlign: "center" }}>{player.GP ?? 0}</td>
                                        </tr>
                                    ))}
                                </tbody>
                              </table>
                            </div>
                        ) : (
                            <p style={{ margin: "8px 0 0", color: "#9fb8d6" }}>No players for this team.</p>
                        )}
                    </section>
                ))
            )}
          </div>
        </div>
    );
};

export default PlayersTable;