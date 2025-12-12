import React, { useEffect, useState } from 'react';
import ResultLeaders from './ResultLeaders';

const API_BASE = process.env.REACT_APP_API_URL || 'https://dartball-backend-654879525708.us-central1.run.app';

const containerStyle = {
  maxWidth: 980,
  margin: '1.5rem auto',
  padding: 16,
  background: 'linear-gradient(180deg, #071018, #081821)',
  color: '#e6f7ff',
  borderRadius: 10,
  boxShadow: '0 8px 24px rgba(2,6,8,0.6)'
};
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const dateHeaderStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '10px 12px', cursor: 'pointer',
  background: 'linear-gradient(180deg,#0c2430,#06202a)', borderRadius: 6,
  marginBottom: 8
};
const matchupHeaderStyle = {
  padding: '8px 12px', fontWeight: 800, color: '#fff', cursor: 'pointer',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.02)'
};
const gameRowStyle = { padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between' };
const smallMuted = { color: '#9fb0bd', fontSize: 13 };

// format dates using UTC so local timezone won't shift the displayed day
const formatDisplayDate = (isoDate) => {
  try {
    const d = new Date(isoDate);
    if (Number.isNaN(d.getTime())) return isoDate;
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC'
    }).format(d);
  } catch (e) { return isoDate; }
};

// return YYYY-MM-DD using UTC parts (stable across timezones)
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

const Results = () => {
  const [teamsMap, setTeamsMap] = useState({});
  const [byDate, setByDate] = useState({});
  const [expandedDates, setExpandedDates] = useState({});
  const [expandedMatchups, setExpandedMatchups] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErr(null);

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
        (teams || []).forEach(t => { tmap[String(t.id)] = t.name || t.team_name || `Team ${t.id}`; });
        setTeamsMap(tmap);

        // normalize results to array and group by date, then by matchup (team pair)
        const arr = Array.isArray(results) ? results : (results.created || results.items || []);
        const groupedByDate = {};
        (arr || []).forEach(r => {
          // normalize date key to YYYY-MM-DD using UTC (prevent timezone shift)
          let key = toYMDUTC(r.date) || 'unknown';
          groupedByDate[key] = groupedByDate[key] || {};

          // normalize matchup key so pair order doesn't matter
          const t1 = Number(r.team1_id);
          const t2 = Number(r.team2_id);
          const [a, b] = (Number.isFinite(t1) && Number.isFinite(t2)) ? (t1 <= t2 ? [t1, t2] : [t2, t1]) : [String(r.team1_id), String(r.team2_id)];
          const matchKey = `${a}-${b}`;

          if (!groupedByDate[key][matchKey]) {
            groupedByDate[key][matchKey] = {
              teamA_id: a,
              teamB_id: b,
              games: []
            };
          }
          groupedByDate[key][matchKey].games.push(r);
        });

        // convert match objects to arrays and sort games by game_number
        const grouped = {};
        Object.keys(groupedByDate).forEach(dateKey => {
          const matches = Object.values(groupedByDate[dateKey]).map(m => {
            m.games.sort((a, b) => (Number(a.game_number) || 0) - (Number(b.game_number) || 0));
            return m;
          });
          grouped[dateKey] = matches;
        });

        setByDate(grouped);

        // default: expand most recent date
        const dates = Object.keys(grouped).sort((a,b) => (a < b ? 1 : -1));
        const nextExpanded = {};
        if (dates.length) nextExpanded[dates[0]] = true;
        setExpandedDates(nextExpanded);
      } catch (e) {
        console.error(e);
        if (mounted) setErr('Failed to load results');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  const toggleDate = (d) => setExpandedDates(prev => ({ ...prev, [d]: !prev[d] }));
  const toggleMatchup = (dateKey, matchKey) => {
    const key = `${dateKey}|${matchKey}`;
    setExpandedMatchups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const dateKeys = Object.keys(byDate).sort((a,b) => (a < b ? 1 : -1)); // newest first

  return (
    <div style={containerStyle}>
      {/* Result leaders summary above the results list */}
      <ResultLeaders />
      <div style={headerStyle}>
        <div>
          <h2 style={{ margin: 0 }}>Results by Date</h2>
          <div style={smallMuted}>Collapsible list grouped by date and matchup</div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        {loading && <div style={{ padding: 12, color: '#9fb0bd' }}>Loading results…</div>}
        {err && <div style={{ padding: 12, color: '#ffb4a2' }}>{err}</div>}
        {!loading && dateKeys.length === 0 && <div style={{ padding: 12, color: '#9fb0bd' }}>No results found</div>}

        {dateKeys.map(dateKey => {
          const matchups = byDate[dateKey] || [];
          const gamesCount = matchups.reduce((s, m) => s + (m.games?.length || 0), 0);
          const isOpen = !!expandedDates[dateKey];
          return (
            <div key={dateKey} style={{ marginBottom: 10 }}>
              <div style={dateHeaderStyle} onClick={() => toggleDate(dateKey)}>
                <div>
                  <div style={{ fontWeight: 700 }}>{formatDisplayDate(dateKey)}</div>
                  <div style={smallMuted}>{gamesCount} game{gamesCount !== 1 ? 's' : ''} — {matchups.length} matchup{matchups.length !== 1 ? 's' : ''}</div>
                </div>
                <div style={{ fontSize: 14, color: '#fff', opacity: 0.85 }}>{isOpen ? '▾' : '▸'}</div>
              </div>

              {isOpen && (
                <div style={{ borderRadius: 6, overflow: 'hidden', marginBottom: 6 }}>
                  {matchups.map((m, mi) => {
                    const matchKey = `${m.teamA_id}-${m.teamB_id}`;
                    const matchOpen = !!expandedMatchups[`${dateKey}|${matchKey}`];
                    const teamA = teamsMap[String(m.teamA_id)] || String(m.teamA_id);
                    const teamB = teamsMap[String(m.teamB_id)] || String(m.teamB_id);
                    return (
                      <div key={`${dateKey}-match-${mi}`} style={{ marginBottom: 8, background: 'rgba(255,255,255,0.01)', borderRadius: 6 }}>
                        <div
                          style={matchupHeaderStyle}
                          onClick={() => toggleMatchup(dateKey, matchKey)}
                        >
                          <div>{teamA} <span style={smallMuted}>vs</span> {teamB}</div>
                          <div style={{ fontSize: 14, opacity: 0.9 }}>{matchOpen ? '▾' : '▸'}</div>
                        </div>

                        {matchOpen && (
                          <div>
                            {m.games.map(g => {
                              const gTeamA_score = Number(g.team1_id) === Number(m.teamA_id) ? g.team1_score : g.team2_score;
                              const gTeamB_score = Number(g.team2_id) === Number(m.teamB_id) ? g.team2_score : g.team1_score;
                              return (
                                <div key={`${dateKey}-${m.teamA_id}-${m.teamB_id}-g${g.game_number}`} style={gameRowStyle}>
                                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                    <div style={{ fontWeight: 700 }}>G{g.game_number}</div>
                                    {/* determine winner styling */}
                                    {(() => {
                                      const aScore = Number(gTeamA_score) || 0;
                                      const bScore = Number(gTeamB_score) || 0;
                                      const aIsWinner = aScore > bScore;
                                      const bIsWinner = bScore > aScore;
                                      const winnerStyle = { fontWeight: 800, color: '#ffdfb5' , background: 'rgba(194,65,12,0.08)', padding: '2px 6px', borderRadius: 6 };
                                      const normalStyle = { color: '#e6f7ff' };
                                      return (
                                        <>
                                          <div style={aIsWinner ? winnerStyle : normalStyle}>{teamA} <span style={{ marginLeft: 8, opacity: 0.9 }}>{aScore}</span></div>
                                          <div style={smallMuted}>vs</div>
                                          <div style={bIsWinner ? winnerStyle : normalStyle}>{teamB} <span style={{ marginLeft: 8, opacity: 0.9 }}>{bScore}</span></div>
                                        </>
                                      );
                                    })()}
                                  </div>
                                </div>
                               );
                             })}
                           </div>
                         )}
                       </div>
                     );
                   })}
                 </div>
               )}
             </div>
           );
         })}
      </div>
    </div>
  );
};

export default Results;