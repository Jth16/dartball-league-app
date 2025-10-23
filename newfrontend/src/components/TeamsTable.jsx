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

                const getGP = (t) => Number(t.games_played ?? t.GP ?? t.games ?? t.gamesPlayed ?? 0) || 0;

                const normalizeWinPct = (t) => {
                    const raw = Number(t.win_pct ?? t.win_percentage ?? t.WP ?? 0) || 0;
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
        const v = n / 100;
        const s = v.toFixed(3);
        return s.replace(/^0\./, '.');
    };

    // themed styles (blue accents changed to dark orange)
    const containerStyle = {
      maxWidth: 1100,
      margin: "2rem auto",
      background: "linear-gradient(180deg, rgba(8,18,24,0.95) 0%, rgba(6,30,36,0.95) 100%)",
      color: "#e6f7ff",
      padding: "1.5rem",
      borderRadius: 14,
      boxShadow: "0 10px 30px rgba(2,6,8,0.6)",
      boxSizing: "border-box",
    };

    const headerStyle = {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "1rem"
    };

    const titleStyle = {
      margin: 0,
      color: "#fff",
      fontSize: "1.5rem",
      letterSpacing: "0.02em"
    };

    const accentBar = {
      height: 6,
      borderRadius: 6,
      // replaced teal/cyan with dark orange gradient
      background: "linear-gradient(90deg,#7a2b00,#c2410c,#ff8a00)",
      marginTop: 12,
      // boxShadow tint changed to match dark orange
      boxShadow: "0 6px 18px rgba(194,65,12,0.08)"
    };

    const tableWrap = { overflowX: "auto", borderRadius: 10 };

    const tableStyle = {
      width: "100%",
      minWidth: 520,
      borderCollapse: "separate",
      borderSpacing: "0 10px",
      fontSize: "0.95rem"
    };

    const theadStyle = {
      background: "transparent",
      color: "#cdeef2"
    };

    const thStyle = {
      padding: "12px 14px",
      textAlign: "left",
      // header text warmed slightly to match orange theme
      color: "#ffe8d0",
      fontWeight: 700,
      fontSize: "0.95rem"
    };

    const rowStyle = {
      background: "linear-gradient(180deg,#07101a 0%, #0b1520 100%)",
      color: "#fff",
      borderRadius: 8,
      boxShadow: "inset 0 -1px 0 rgba(255,255,255,0.02)"
    };

    const cellStyle = {
      padding: "10px 12px",
      verticalAlign: "middle"
    };

    const pctBadge = (pct) => ({
      display: "inline-block",
      minWidth: 64,
      padding: "6px 8px",
      borderRadius: 8,
      // badge background and text updated to dark orange tones
      background: "rgba(194,65,12,0.12)",
      color: "#ffd7b0",
      fontWeight: 700,
      textAlign: "center"
    });

    return (
         <div style={containerStyle}>
           <div style={headerStyle}>
             <h1 style={titleStyle}>Team Standings</h1>
             <div style={{ color: "#9fb8d6", fontSize: 14 }}>Season standings</div>
           </div>

           <div style={accentBar} />

           <div style={{ height: 12 }} />

           <div style={tableWrap}>
             <table style={tableStyle}>
               <thead style={theadStyle}>
                <tr>
                  <th style={thStyle}>Team Name</th>
                  <th style={{ ...thStyle, textAlign: "center", width: 64 }}>W</th>
                  <th style={{ ...thStyle, textAlign: "center", width: 64 }}>L</th>
                  <th style={{ ...thStyle, textAlign: "center", width: 120 }}>Win Pct.</th>
                  <th style={{ ...thStyle, textAlign: "center", width: 90 }}>Games Behind</th>
                  <th style={{ ...thStyle, textAlign: "center", width: 90 }}>Games Played</th>
                </tr>
               </thead>
               <tbody>
                    {teams.map((team) => (
                        <tr key={team.id} style={rowStyle}>
                            <td style={{ ...cellStyle, paddingLeft: 18 }}>{team.name}</td>
                            <td style={{ ...cellStyle, textAlign: "center" }}>{team.wins}</td>
                            <td style={{ ...cellStyle, textAlign: "center" }}>{team.losses}</td>
                            <td style={{ ...cellStyle, textAlign: "center" }}>
                                {team.games_played > 0
                                    ? <span style={pctBadge(formatPct(team.win_pct))}>{formatPct(team.win_pct)}</span>
                                    : <span style={pctBadge('.000')}>.000</span>}
                            </td>
                            <td style={{ ...cellStyle, textAlign: "center" }}>
                                {team.games_behind === 0 ? "—" : Number(team.games_behind).toFixed(1)}
                            </td>
                            <td style={{ ...cellStyle, textAlign: "center" }}>{team.games_played}</td>
                        </tr>
                    ))}
               </tbody>
             </table>
           </div>
        </div>
    );
};

export default TeamsTable;