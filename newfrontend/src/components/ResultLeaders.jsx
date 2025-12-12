import React, { useEffect, useState } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'https://dartball-backend-654879525708.us-central1.run.app';

const container = { marginBottom: 12, padding: 12, background: 'linear-gradient(180deg,#07131a,#081821)', borderRadius: 10 };
const title = { margin: 0, color: '#fff', fontSize: 16, fontWeight: 700 };
const small = { color: '#9fb0bd', fontSize: 13 };
const statBox = { flex: 1, padding: 12, background: 'linear-gradient(180deg,#071724,#07202a)', borderRadius: 8, minWidth: 200, width: '100%' };
const statValue = { fontSize: 20, fontWeight: 800, color: '#ffdfb5' };
const meta = { marginTop: 6, color: '#cbd5e1', fontSize: 13 };

const table = { width: '100%', borderCollapse: 'collapse', marginTop: 8 };
const th = { textAlign: 'left', color: '#fff', fontWeight: 800, padding: '6px 8px', fontSize: 13 };
const td = { padding: '6px 8px', color: '#e6f7ff' };

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
  const [mostRunsList, setMostRunsList] = useState([]);
  const [diffList, setDiffList] = useState([]);

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

        (results || []).forEach(r => {
          const s1 = Number(r.team1_score) || 0;
          const s2 = Number(r.team2_score) || 0;

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
          // sum runs per team across the group's games
          let aTotal = 0;
          let bTotal = 0;
          g.games.forEach(game => {
            // map scores to normalized team order (a corresponds to g.teamA)
            const ta = Number(game.team1_id) === Number(g.teamA) ? Number(game.team1_score || 0) : Number(game.team2_score || 0);
            const tb = Number(game.team2_id) === Number(g.teamB) ? Number(game.team2_score || 0) : Number(game.team1_score || 0);
            // But because we normalized a,b by numeric order, need robust mapping:
            if (Number(game.team1_id) === Number(g.teamA)) {
              aTotal += Number(game.team1_score || 0);
              bTotal += Number(game.team2_score || 0);
            } else if (Number(game.team2_id) === Number(g.teamA)) {
              aTotal += Number(game.team2_score || 0);
              bTotal += Number(game.team1_score || 0);
            } else {
              // fallback, try matching by equality
              aTotal += Number(game.team1_id) === Number(g.teamA) ? Number(game.team1_score||0) : Number(game.team2_score||0);
              bTotal += Number(game.team2_id) === Number(g.teamB) ? Number(game.team2_score||0) : Number(game.team1_score||0);
            }
          });

          // decide which team had higher series total
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
        });

        // build most runs list (season totals) and diff list
        const arr = Object.values(stats).map(x => ({ ...x, diff: x.runsFor - x.runsAgainst }));
        const runsSorted = [...arr].sort((a,b) => b.runsFor - a.runsFor || b.diff - a.diff).slice(0, topN);
        const diffSorted = [...arr].sort((a,b) => b.diff - a.diff || b.runsFor - a.runsFor).slice(0, topN);

        setTopSingleTeam(bestSingle);
        setTopCombined(bestCombinedLocal);
        setBestSeries(bestSeriesLocal);
        setMostRunsList(runsSorted);
        setDiffList(diffSorted);
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
      <div style={{ display: 'flex', gap: 12, alignItems: 'stretch', flexWrap: 'wrap' }}>
        {/* stack the single-game and series stat panels vertically */}
        <div style={{ display: 'flex', gap: 12, flexDirection: 'column', flex: 2, minWidth: 240 }}>
          <div style={statBox}>
            <h4 style={title}>Most runs by a team in a single game</h4>
            {topSingleTeam ? (
              <>
                <div style={statValue}>{topSingleTeam.score}</div>
                <div style={{ marginTop: 8, fontWeight: 700 }}>{topSingleTeam.teamName}</div>
                <div style={meta}>
                  vs {topSingleTeam.opponentName} · Game {topSingleTeam.game_number} · {formatDisplayDate(topSingleTeam.date)}
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
                <div style={{ marginTop: 8, fontWeight: 700 }}>{topCombined.team1Name} vs {topCombined.team2Name}</div>
                <div style={meta}>Game {topCombined.game_number} · {formatDisplayDate(topCombined.date)}</div>
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
                <div style={{ marginTop: 8, fontWeight: 700 }}>{bestSeries.teamName}</div>
                <div style={meta}>
                  vs {bestSeries.opponentName} · {bestSeries.gamesCount} games · {formatDisplayDate(bestSeries.date)}
                </div>
              </>
            ) : (
              <div style={meta}>No complete 3-game series found</div>
            )}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ background: 'linear-gradient(180deg,#071724,#071b22)', padding: 12, borderRadius: 8 }}>
            <h4 style={{ ...title, fontSize: 14 }}>Most Runs (season)</h4>
            <div style={small}>Total runs scored</div>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Team</th>
                  <th style={th}>Runs</th>
                  <th style={th}>G</th>
                </tr>
              </thead>
              <tbody>
                {mostRunsList.map(t => (
                  <tr key={t.id}>
                    <td style={td}>{teamsMap[t.id] ?? t.id}</td>
                    <td style={td}>{t.runsFor}</td>
                    <td style={td}>{t.games}</td>
                  </tr>
                ))}
                {mostRunsList.length === 0 && <tr><td colSpan="3" style={{ padding: 12, color: '#9fb0bd' }}>—</td></tr>}
              </tbody>
            </table>
          </div>

          <div style={{ height: 12 }} />

          <div style={{ background: 'linear-gradient(180deg,#071724,#071b22)', padding: 12, borderRadius: 8 }}>
            <h4 style={{ ...title, fontSize: 14 }}>Run Diff (season)</h4>
            <div style={small}>Runs For − Against</div>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Team</th>
                  <th style={th}>Diff</th>
                  <th style={th}>RF</th>
                </tr>
              </thead>
              <tbody>
                {diffList.map(t => (
                  <tr key={t.id}>
                    <td style={td}>{teamsMap[t.id] ?? t.id}</td>
                    <td style={td}>{t.diff}</td>
                    <td style={td}>{t.runsFor}</td>
                  </tr>
                ))}
                {diffList.length === 0 && <tr><td colSpan="3" style={{ padding: 12, color: '#9fb0bd' }}>—</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultLeaders;