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
        <div style={{ maxWidth: 1100, margin: "2rem auto", background: "#0b1220", color: "#fff", padding: "2rem", borderRadius: 16 }}>
            <h1 style={{ marginBottom: "1rem" }}>Players by Team</h1>

            {groupedPlayers.length === 0 ? (
                <p>Loading teams and players…</p>
            ) : (
                groupedPlayers.map(group => (
                    <section key={group.teamId} style={{ marginBottom: 28 }}>
                        <h2 style={{ margin: "8px 0 12px", color: "#a8d8ff" }}>{group.teamName}</h2>

                        {group.players && group.players.length > 0 ? (
                            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 10px" }}>
                                <thead>
                                    <tr style={{ background: "#102231", color: "#e6f7ff" }}>
                                        <th style={{ padding: "10px", textAlign: "left" }}>Name</th>
                                        <th style={{ padding: "10px" }}>At Bats</th>
                                        <th style={{ padding: "10px" }}>Hits</th>
                                        <th style={{ padding: "10px" }}>Avg</th>
                                        <th style={{ padding: "10px" }}>Singles</th>
                                        <th style={{ padding: "10px" }}>Doubles</th>
                                        <th style={{ padding: "10px" }}>Triples</th>
                                        <th style={{ padding: "10px" }}>Dimes</th>
                                        <th style={{ padding: "10px" }}>HRs</th>
                                        <th style={{ padding: "10px" }}>GP</th>
                                        
                                    </tr>
                                </thead>
                                <tbody>
                                    {group.players.map(player => (
                                        <tr key={player.id} style={{ background: "#07101a", borderRadius: 6 }}>   
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
                        ) : (
                            <p style={{ margin: "8px 0 0", color: "#9fb8d6" }}>No players for this team.</p>
                        )}
                    </section>
                ))
            )}
        </div>
    );
};

export default PlayersTable;