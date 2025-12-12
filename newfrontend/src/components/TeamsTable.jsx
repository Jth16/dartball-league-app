import React, { useEffect, useState, useRef } from 'react';
import { fetchWithToken } from '../api';
import { printElement } from '../utils/print';

const TeamsTable = () => {
    const [teams, setTeams] = useState([]);
    const containerRef = useRef(null);

    useEffect(() => {
        const fetchStandingsFromResults = async () => {
            try {
                // fetch teams for names and results for computing standings
                const [teamsResp, resultsResp] = await Promise.all([
                    fetchWithToken('/routes/teams', { method: 'GET' }),
                    fetchWithToken('/routes/results?limit=10000', { method: 'GET' })
                ]);

                if (!teamsResp.ok) throw new Error(`Teams HTTP ${teamsResp.status}`);
                if (!resultsResp.ok) throw new Error(`Results HTTP ${resultsResp.status}`);

                const teamsData = await teamsResp.json();
                const resultsData = await resultsResp.json();

                // build name map
                const nameMap = {};
                (Array.isArray(teamsData) ? teamsData : []).forEach(t => {
                    nameMap[String(t.id)] = t.name || t.team_name || `Team ${t.id}`;
                });

                // aggregate stats from results
                const stats = {}; // keyed by team id (string)
                const addTeamIfMissing = (id) => {
                    const key = String(id);
                    if (!stats[key]) stats[key] = { id: key, wins: 0, losses: 0, games_played: 0 };
                    return stats[key];
                };

                (Array.isArray(resultsData) ? resultsData : []).forEach(r => {
                    const t1 = String(r.team1_id);
                    const t2 = String(r.team2_id);
                    const s1 = Number(r.team1_score) || 0;
                    const s2 = Number(r.team2_score) || 0;

                    const st1 = addTeamIfMissing(t1);
                    const st2 = addTeamIfMissing(t2);

                    // each result counts as one game for both teams
                    st1.games_played += 1;
                    st2.games_played += 1;

                    if (s1 > s2) {
                        st1.wins += 1;
                        st2.losses += 1;
                    } else if (s2 > s1) {
                        st2.wins += 1;
                        st1.losses += 1;
                    } else {
                        // tie — do not increment wins/losses (keeps parity with existing logic)
                    }
                });

                // compute win_pct (as percent like 65.4)
                const rows = Object.values(stats).map(s => {
                    const winPct = s.games_played > 0 ? (s.wins / s.games_played) * 100 : 0;
                    return { ...s, win_pct: winPct, name: nameMap[s.id] ?? `Team ${s.id}` };
                });

                // determine leader (highest win_pct, break ties by most wins)
                const leader = rows.reduce((best, t) => {
                    if (!best) return t;
                    if (t.win_pct > best.win_pct) return t;
                    if (t.win_pct === best.win_pct && (t.wins || 0) > (best.wins || 0)) return t;
                    return best;
                }, rows[0] || { wins: 0, losses: 0, win_pct: 0 });

                // compute games behind
                const withGB = rows.map(t => {
                    const gb = ((leader.wins - (t.wins || 0)) + ((t.losses || 0) - leader.losses)) / 2;
                    return { ...t, games_behind: gb };
                });

                // sort by win_pct desc, then wins desc
                withGB.sort((a, b) => {
                    if (b.win_pct !== a.win_pct) return b.win_pct - a.win_pct;
                    return (b.wins || 0) - (a.wins || 0);
                });

                setTeams(withGB);
            } catch (err) {
                console.error('fetchStandingsFromResults failed', err);
                setTeams([]);
            }
        };

        fetchStandingsFromResults();
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
         // attach ref and data-printable so print helper can capture the whole component
         <div ref={containerRef} data-printable style={containerStyle}>
           <div style={headerStyle}>
             <h1 style={titleStyle}>Team Standings</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ color: "#9fb8d6", fontSize: 14 }}>Season standings (computed from results)</div>
              <button
                className="no-print"
                onClick={() => printElement(containerRef.current)}
                style={{ padding: '6px 10px', cursor: 'pointer', borderRadius: 6, border: 'none', background: '#c2410c', color: '#fff' }}
              >
                Print
              </button>
            </div>
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
                                {Number(team.games_behind) === 0 ? "—" : Number(team.games_behind).toFixed(1)}
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