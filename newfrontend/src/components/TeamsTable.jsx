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

                // clinching indicators — 96 game season, remaining games per team vary (makeups)
                // worst case for team: loses all remaining; best case for chaser: wins all remaining
                // since all teams play 96 total games, final win% = wins/96, so compare wins directly
                const seasonGames = 96;
                const gamesLeft = (t) => seasonGames - t.games_played;
                if (withGB.length >= 2) {
                    const t1 = withGB[0];
                    const t2 = withGB[1];
                    // t1 clinches 1st if even losing all remaining, t2 winning all remaining can't catch t1
                    if (t1.wins / seasonGames > (t2.wins + gamesLeft(t2)) / seasonGames) {
                        withGB[0].clinched1st = true;
                    }
                }
                if (withGB.length >= 3) {
                    const t2 = withGB[1];
                    const t3 = withGB[2];
                    if (t2.wins / seasonGames > (t3.wins + gamesLeft(t3)) / seasonGames) {
                        withGB[1].clinched2nd = true;
                    }
                }

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
      background: "linear-gradient(90deg,#7c4310,#c8650f,#f2a33a)",
      marginTop: 12,
      // boxShadow tint changed to match dark orange
      boxShadow: "0 6px 18px rgba(200,101,15,0.08)"
    };

    const theadStyle = {
      background: "transparent",
      color: "#dbe6f0"
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
      background: "linear-gradient(180deg,#141a21 0%, #1d2630 100%)",
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
      background: "rgba(200,101,15,0.12)",
      color: "#ffd7b0",
      fontWeight: 700,
      textAlign: "center"
    });

    return (
         // attach ref and data-printable so print helper can capture the whole component
         <div ref={containerRef} data-printable className="card">
           <div className="card-header">
             <h1 style={titleStyle}>Team Standings</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ color: "#9fb0c0", fontSize: 14 }}>Season standings (computed from results)</div>
              <button
                className="no-print"
                onClick={() => printElement(containerRef.current)}
                style={{ padding: '6px 10px', cursor: 'pointer', borderRadius: 6, border: 'none', background: '#c8650f', color: '#fff' }}
              >
                Print
              </button>
            </div>
           </div>

           <div style={accentBar} />

           <div style={{ height: 12 }} />

           <div className="table-wrap">
             <table className="data-table sticky-first">
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
                            <td style={{ ...cellStyle, paddingLeft: 18 }}>
                                {team.name}
                                {team.clinched1st && <span style={{ color: '#ff9800', fontWeight: 700, marginLeft: 4 }}>-y</span>}
                                {team.clinched2nd && <span style={{ color: '#aaa', fontWeight: 700, marginLeft: 4 }}>-x</span>}
                            </td>
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