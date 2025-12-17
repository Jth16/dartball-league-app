import React, { useEffect, useState } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'https://dartball-backend-654879525708.us-central1.run.app';

// compacted panel styles — increased sizes for single panels
const container = { marginBottom: 10, padding: 10, background: 'linear-gradient(180deg,#07131a,#081821)', borderRadius: 8 };
const title = { margin: 0, color: '#fff', fontSize: 18, fontWeight: 700 }; // bigger
const small = { color: '#9fb0bd', fontSize: 12 };
// each stat panel will take about half the width so two panels appear per row
const statBox = { flex: '0 0 48%', padding: 10, background: 'linear-gradient(180deg,#071724,#07202a)', borderRadius: 6, minWidth: 160, boxSizing: 'border-box' };
const statValue = { fontSize: 22, fontWeight: 800, color: '#ffdfb5', lineHeight: 1 }; // bigger
const meta = { marginTop: 6, color: '#cbd5e1', fontSize: 13 }; // slightly bigger

const table = { width: '100%', borderCollapse: 'collapse', marginTop: 6, fontSize: 13 };
const th = { textAlign: 'left', color: '#fff', fontWeight: 800, padding: '6px 8px', fontSize: 12 };
const td = { padding: '6px 8px', color: '#e6f7ff', fontSize: 13 };

// format dates using UTC so local timezone won't shift the displayed day
const formatDisplayDate = (isoDate) => {
  try {
    const d = new Date(isoDate);
    if (Number.isNaN(d.getTime())) return isoDate;
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(d);
  } catch (e) { return isoDate; }
};

// helper to get YYYY-MM-DD using UTC (used where needed)
const toYMDUTC = (isoDate) => {
  try {
    const d = new Date(isoDate);
    if (Number.isNaN(d.getTime())) return null;
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch (e) { return null; }
};

const ResultLeaders = ({ topN = 9 }) => {
  const [loading, setLoading] = useState(true);
  const [teamsMap, setTeamsMap] = useState({});
  const [topSingleTeam, setTopSingleTeam] = useState(null);
  const [topCombined, setTopCombined] = useState(null);
  const [bestSeries, setBestSeries] = useState(null);
  const [topOneRun, setTopOneRun] = useState(null);
  const [topOneRunLoss, setTopOneRunLoss] = useState(null);
  const [statsList, setStatsList] = useState([]); // combined runs + diff list
  const [sweepsTable, setSweepsTable] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [tRes, rRes] = await Promise.all([
          fetch(`${API_BASE}/routes/teams`),
          fetch(`${API_BASE}/routes/results`)
        ]);
        const teams = tRes.ok ? await tRes.json() : [];
        const results = rRes.ok ? await rRes.json() : [];

        if (!mounted) return;

        const tmap = {};
        teams.forEach(t => { tmap[String(t.id)] = t.name || t.team_name || `Team ${t.id}`; });
        setTeamsMap(tmap);

        let bestSingle = null;
        let bestCombinedLocal = null;

        // aggregate season stats
        const stats = {};
        // group by date+matchup for series calculation
        const groups = {}; // key: `${date}|${minId}-${maxId}` -> { date, aId, bId, games: [r...] }

        // sweeps counters (for sweeps table)
        const sweepsFor = {};     // teamId -> number of sweeps (won 3-0)
        const sweptAgainst = {};  // teamId -> number of times they got swept (lost 0-3)

        // one-run victory / loss counters
        const oneRunWins = {};   // teamId -> count of wins by exactly 1 run
        const oneRunLosses = {}; // teamId -> count of losses by exactly 1 run

        (results || []).forEach(r => {
          const s1 = Number(r.team1_score) || 0;
          const s2 = Number(r.team2_score) || 0;

          // count one-run wins per game
          if (s1 - s2 === 1) {
            const idWin = String(r.team1_id);
            oneRunWins[idWin] = (oneRunWins[idWin] || 0) + 1;
            // team2 lost by 1
            const idLoss = String(r.team2_id);
            oneRunLosses[idLoss] = (oneRunLosses[idLoss] || 0) + 1;
          } else if (s2 - s1 === 1) {
            const idWin = String(r.team2_id);
            oneRunWins[idWin] = (oneRunWins[idWin] || 0) + 1;
            // team1 lost by 1
            const idLoss = String(r.team1_id);
            oneRunLosses[idLoss] = (oneRunLosses[idLoss] || 0) + 1;
          }

          // single-game best team
          if (!bestSingle || s1 > bestSingle.score) {
            bestSingle = {
              teamId: String(r.team1_id),
              teamName: tmap[String(r.team1_id)] || String(r.team1_id),
              score: s1,
              date: r.date,
              game_number: r.game_number,
              opponentId: String(r.team2_id),
              opponentName: tmap[String(r.team2_id)] || String(r.team2_id)
            };
          }
          if (!bestSingle || s2 > bestSingle.score) {
            bestSingle = {
              teamId: String(r.team2_id),
              teamName: tmap[String(r.team2_id)] || String(r.team2_id),
              score: s2,
              date: r.date,
              game_number: r.game_number,
              opponentId: String(r.team1_id),
              opponentName: tmap[String(r.team1_id)] || String(r.team1_id)
            };
          }

          // best combined in single game
          const total = s1 + s2;
          if (!bestCombinedLocal || total > bestCombinedLocal.total) {
            bestCombinedLocal = {
              total,
              team1Id: String(r.team1_id),
              team1Name: tmap[String(r.team1_id)] || String(r.team1_id),
              team2Id: String(r.team2_id),
              team2Name: tmap[String(r.team2_id)] || String(r.team2_id),
              date: r.date,
              game_number: r.game_number
            };
          }

          // aggregate season stats
          const t1 = String(r.team1_id);
          const t2 = String(r.team2_id);
          stats[t1] = stats[t1] || { id: t1, runsFor: 0, runsAgainst: 0, games: 0 };
          stats[t2] = stats[t2] || { id: t2, runsFor: 0, runsAgainst: 0, games: 0 };

          stats[t1].runsFor += s1;
          stats[t1].runsAgainst += s2;
          stats[t1].games += 1;

          stats[t2].runsFor += s2;
          stats[t2].runsAgainst += s1;
          stats[t2].games += 1;

          // group by date + matchup key (order independent)
          const dateKey = toYMDUTC(r.date) || 'unknown';
          const id1 = Number(r.team1_id);
          const id2 = Number(r.team2_id);
          const [a,b] = (Number.isFinite(id1) && Number.isFinite(id2)) ? (id1 <= id2 ? [id1,id2] : [id2,id1]) : [String(r.team1_id), String(r.team2_id)];
          const matchKey = `${dateKey}|${a}-${b}`;
          groups[matchKey] = groups[matchKey] || { date: dateKey, teamA: a, teamB: b, games: [] };
          groups[matchKey].games.push(r);
        });

        // evaluate best 3-game series (require at least 3 games in group)
        let bestSeriesLocal = null;
        Object.values(groups).forEach(g => {
          if (!g.games || g.games.length < 3) return; // require full 3-game series

          // sum runs per team across the group's games and count wins
          let aTotal = 0;
          let bTotal = 0;
          let aWins = 0;
          let bWins = 0;

          g.games.forEach(game => {
            let aScore = 0;
            let bScore = 0;
            if (Number(game.team1_id) === Number(g.teamA)) {
              aScore = Number(game.team1_score || 0);
              bScore = Number(game.team2_score || 0);
            } else if (Number(game.team2_id) === Number(g.teamA)) {
              aScore = Number(game.team2_score || 0);
              bScore = Number(game.team1_score || 0);
            } else {
              // fallback (shouldn't happen)
              aScore = Number(game.team1_score || 0);
              bScore = Number(game.team2_score || 0);
            }

            aTotal += aScore;
            bTotal += bScore;

            if (aScore > bScore) aWins += 1;
            else if (bScore > aScore) bWins += 1;
          });

          // best series logic (highest total for one team across the group's games)
          if (!bestSeriesLocal || aTotal > bestSeriesLocal.total) {
            bestSeriesLocal = {
              total: aTotal,
              teamId: String(g.teamA),
              teamName: tmap[String(g.teamA)] || String(g.teamA),
              opponentId: String(g.teamB),
              opponentName: tmap[String(g.teamB)] || String(g.teamB),
              date: g.date,
              gamesCount: g.games.length
            };
          }
          if (bTotal > (bestSeriesLocal ? bestSeriesLocal.total : -1)) {
            bestSeriesLocal = {
              total: bTotal,
              teamId: String(g.teamB),
              teamName: tmap[String(g.teamB)] || String(g.teamB),
              opponentId: String(g.teamA),
              opponentName: tmap[String(g.teamA)] || String(g.teamA),
              date: g.date,
              gamesCount: g.games.length
            };
          }

          // sweep detection: team wins all 3 games
          // require strictly more wins than opponent (3-0)
          if (aWins >= 3 && aWins > bWins) {
            const key = String(g.teamA);
            sweepsFor[key] = (sweepsFor[key] || 0) + 1;
            sweptAgainst[String(g.teamB)] = (sweptAgainst[String(g.teamB)] || 0) + 1;
          } else if (bWins >= 3 && bWins > aWins) {
            const key = String(g.teamB);
            sweepsFor[key] = (sweepsFor[key] || 0) + 1;
            sweptAgainst[String(g.teamA)] = (sweptAgainst[String(g.teamA)] || 0) + 1;
          }
        });

        // determine best one-run victories
        let bestOneRunLocal = null;
        Object.keys(oneRunWins).forEach(tid => {
          const cnt = oneRunWins[tid];
          if (!bestOneRunLocal || cnt > bestOneRunLocal.count) {
            bestOneRunLocal = { teamId: tid, teamName: tmap[tid] || `Team ${tid}`, count: cnt };
          }
        });

        // determine most one-run losses
        let bestOneRunLossLocal = null;
        Object.keys(oneRunLosses).forEach(tid => {
          const cnt = oneRunLosses[tid];
          if (!bestOneRunLossLocal || cnt > bestOneRunLossLocal.count) {
            bestOneRunLossLocal = { teamId: tid, teamName: tmap[tid] || `Team ${tid}`, count: cnt };
          }
        });

        // build combined stats list (runs + diff) and sort for display
        // compute avg runs scored per team (runs for / games) and diff
        const arr = Object.values(stats).map(x => {
          const diff = x.runsFor - x.runsAgainst;
          const avgRunsPerGame = x.games > 0 ? (x.runsFor / x.games) : 0;
          return { ...x, diff, avgRunsPerGame };
        });
        const combinedSorted = [...arr].sort((a,b) => b.runsFor - a.runsFor || b.diff - a.diff).slice(0, topN);

        // build sweeps table (all teams): columns sweeps_for (how many sweeps they have) and swept_against (how many times swept)
        const allTeamIds = new Set([
          ...Object.keys(tmap),
          ...Object.keys(stats),
          ...Object.keys(sweepsFor),
          ...Object.keys(sweptAgainst)
        ]);
        const sweepsArr = Array.from(allTeamIds).map(id => ({
          id,
          name: tmap[id] || `Team ${id}`,
          sweeps_for: sweepsFor[id] || 0,
          swept_against: sweptAgainst[id] || 0
        })).sort((a,b) => b.sweeps_for - a.sweeps_for || a.swept_against - b.swept_against || a.name.localeCompare(b.name));

        setTopSingleTeam(bestSingle);
        setTopCombined(bestCombinedLocal);
        setBestSeries(bestSeriesLocal);
        setTopOneRun(bestOneRunLocal);
        setTopOneRunLoss(bestOneRunLossLocal);
        setStatsList(combinedSorted);
        setSweepsTable(sweepsArr);
      } catch (e) {
        console.warn('ResultLeaders load failed', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [topN]);

  if (loading) return <div style={{ ...container }}><div style={small}>Loading leaders…</div></div>;

  return (
    <div style={container}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'stretch', flexWrap: 'wrap' }}>
        {/* place single-game and series stat panels in a two-up grid */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 2, minWidth: 200 }}>
          <div style={statBox}>
            <h4 style={title}>Most runs by a team in a single game</h4>
            {topSingleTeam ? (
              <>
                <div style={statValue}>{topSingleTeam.score}</div>
                <div style={{ marginTop: 8, fontWeight: 700, fontSize: 15 }}>{topSingleTeam.teamName}</div>
                <div style={meta}>
                  vs {topSingleTeam.opponentName} · G{topSingleTeam.game_number} · {formatDisplayDate(topSingleTeam.date)}
                </div>
              </>
            ) : (
              <div style={meta}>No game data</div>
            )}
          </div>

          <div style={statBox}>
            <h4 style={title}>Most combined runs in a single game</h4>
            {topCombined ? (
              <>
                <div style={statValue}>{topCombined.total}</div>
                <div style={{ marginTop: 8, fontWeight: 700, fontSize: 15 }}>{topCombined.team1Name} vs {topCombined.team2Name}</div>
                <div style={meta}>G{topCombined.game_number} · {formatDisplayDate(topCombined.date)}</div>
              </>
            ) : (
              <div style={meta}>No game data</div>
            )}
          </div>

          <div style={statBox}>
            <h4 style={title}>Most runs over a 3-game series</h4>
            {bestSeries ? (
              <>
                <div style={statValue}>{bestSeries.total}</div>
                <div style={{ marginTop: 8, fontWeight: 700, fontSize: 15 }}>{bestSeries.teamName}</div>
                <div style={meta}>
                  vs {bestSeries.opponentName} · {bestSeries.gamesCount} games · {formatDisplayDate(bestSeries.date)}
                </div>
              </>
            ) : (
              <div style={meta}>No complete 3-game series found</div>
            )}
          </div>

          <div style={statBox}>
            <h4 style={title}>Most 1-run victories</h4>
            {topOneRun ? (
              <>
                <div style={statValue}>{topOneRun.count}</div>
                <div style={{ marginTop: 8, fontWeight: 700, fontSize: 15 }}>{topOneRun.teamName}</div>
                <div style={meta}>games decided by one run</div>
              </>
            ) : (
              <div style={meta}>No 1-run victories recorded</div>
            )}
          </div>

          <div style={statBox}>
            <h4 style={title}>Most 1-run losses</h4>
            {topOneRunLoss ? (
              <>
                <div style={statValue}>{topOneRunLoss.count}</div>
                <div style={{ marginTop: 8, fontWeight: 700, fontSize: 15 }}>{topOneRunLoss.teamName}</div>
                <div style={meta}>games lost by one run</div>
              </>
            ) : (
              <div style={meta}>No 1-run losses recorded</div>
            )}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 300 }}>
          <div style={{ background: 'linear-gradient(180deg,#071724,#071b22)', padding: 10, borderRadius: 8 }}>
            <h4 style={{ ...title, fontSize: 13 }}>Season: Runs & Diff</h4>
            <div style={small}>Combined table of total runs and run differential</div>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Team</th>
                  <th style={th}>Runs</th>
                  <th style={th}>Diff</th>
                  <th style={th}>G</th>
                  <th style={th}>Avg R/G</th>
                </tr>
              </thead>
              <tbody>
                {statsList.map(t => (
                  <tr key={t.id}>
                    <td style={td}>{teamsMap[t.id] ?? t.id}</td>
                    <td style={td}>{t.runsFor}</td>
                    <td style={td}>{t.diff}</td>
                    <td style={td}>{t.games}</td>
                    <td style={td}>{Number(t.avgRunsPerGame || 0).toFixed(1)}</td>
                  </tr>
                ))}
                {statsList.length === 0 && <tr><td colSpan="5" style={{ padding: 10, color: '#9fb0bd' }}>—</td></tr>}
              </tbody>
            </table>
          </div>

          <div style={{ height: 10 }} />

          <div style={{ background: 'linear-gradient(180deg,#071724,#071b22)', padding: 10, borderRadius: 8 }}>
            <h4 style={{ ...title, fontSize: 13 }}>Sweeps (3–0) — For & Against</h4>
            <div style={small}>How many 3–0 series each team has won and lost</div>
            <table style={{ ...table, marginTop: 6 }}>
              <thead>
                <tr>
                  <th style={th}>Team</th>
                  <th style={{ ...th, textAlign: 'center', width: 70 }}>Sweeps</th>
                  <th style={{ ...th, textAlign: 'center', width: 80 }}>Swept</th>
                </tr>
              </thead>
              <tbody>
                {sweepsTable.map(row => (
                  <tr key={row.id}>
                    <td style={td}>{row.name}</td>
                    <td style={{ ...td, textAlign: 'center' }}>{row.sweeps_for}</td>
                    <td style={{ ...td, textAlign: 'center' }}>{row.swept_against}</td>
                  </tr>
                ))}
                {sweepsTable.length === 0 && <tr><td colSpan="3" style={{ padding: 10, color: '#9fb0bd' }}>—</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultLeaders;