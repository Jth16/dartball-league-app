import React, { useEffect, useState } from 'react';
import { fetchWithToken } from '../api';

const HeadToHead = () => {
  const [teams, setTeams] = useState([]);
  const [matrix, setMatrix] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [teamsResp, resultsResp] = await Promise.all([
          fetchWithToken('/routes/teams', { method: 'GET' }),
          fetchWithToken('/routes/results?limit=10000', { method: 'GET' })
        ]);
        if (!teamsResp.ok) throw new Error(`Teams HTTP ${teamsResp.status}`);
        if (!resultsResp.ok) throw new Error(`Results HTTP ${resultsResp.status}`);
        const teamsData = await teamsResp.json();
        const resultsData = await resultsResp.json();

        // Build name map
        const nameMap = {};
        (Array.isArray(teamsData) ? teamsData : []).forEach(t => {
          nameMap[String(t.id)] = t.name || t.team_name || `Team ${t.id}`;
        });

        // Seed all teams from teamsData so teams with no results still appear
        const overallStats = {};
        (Array.isArray(teamsData) ? teamsData : []).forEach(t => {
          overallStats[String(t.id)] = { wins: 0, losses: 0, games_played: 0 };
        });

        // Build h2h[teamId][opponentId] = { wins, losses }
        const h2h = {};
        const ensureH2H = (a, b) => {
          if (!h2h[a]) h2h[a] = {};
          if (!h2h[a][b]) h2h[a][b] = { wins: 0, losses: 0 };
        };
        const ensureOverall = (id) => {
          if (!overallStats[id]) overallStats[id] = { wins: 0, losses: 0, games_played: 0 };
          return overallStats[id];
        };

        (Array.isArray(resultsData) ? resultsData : []).forEach(r => {
          const t1 = String(r.team1_id);
          const t2 = String(r.team2_id);
          const s1 = Number(r.team1_score) || 0;
          const s2 = Number(r.team2_score) || 0;

          ensureH2H(t1, t2);
          ensureH2H(t2, t1);
          const st1 = ensureOverall(t1);
          const st2 = ensureOverall(t2);
          st1.games_played++;
          st2.games_played++;

          if (s1 > s2) {
            h2h[t1][t2].wins++;
            h2h[t2][t1].losses++;
            st1.wins++;
            st2.losses++;
          } else if (s2 > s1) {
            h2h[t2][t1].wins++;
            h2h[t1][t2].losses++;
            st2.wins++;
            st1.losses++;
          }
          // ties: games_played incremented but no wins/losses
        });

        // Sort by win_pct desc, then wins desc — same order as standings
        const sortedTeams = Object.keys(overallStats)
          .map(id => {
            const s = overallStats[id];
            return {
              id,
              name: nameMap[id] ?? `Team ${id}`,
              ...s,
              win_pct: s.games_played > 0 ? s.wins / s.games_played : 0
            };
          })
          .sort((a, b) => {
            if (b.win_pct !== a.win_pct) return b.win_pct - a.win_pct;
            return (b.wins || 0) - (a.wins || 0);
          });

        setTeams(sortedTeams);
        setMatrix(h2h);
      } catch (err) {
        console.error('HeadToHead load failed', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getCellStyle = (rowId, colId) => {
    if (rowId === colId) return { background: '#1c1c1c', color: '#555' };
    const record = matrix[rowId]?.[colId];
    if (!record || (record.wins === 0 && record.losses === 0)) {
      return { background: 'transparent', color: '#9fb0bd' };
    }
    if (record.wins > record.losses) return { background: 'rgba(255,152,0,0.15)', color: '#ffd7b0' };
    if (record.losses > record.wins) return { background: 'rgba(180,30,30,0.18)', color: '#ffaaaa' };
    return { background: 'transparent', color: '#e6f7ff' };
  };

  const getCellText = (rowId, colId) => {
    if (rowId === colId) return '—';
    const record = matrix[rowId]?.[colId];
    if (!record) return '—';
    return `${record.wins}-${record.losses}`;
  };

  const stickyColBg = (ri) => ri % 2 === 0 ? '#0d1b2a' : '#0b1520';

  return (
    <div style={{
      margin: '2rem auto',
      background: 'linear-gradient(180deg, rgba(8,18,24,0.95) 0%, rgba(6,30,36,0.95) 100%)',
      color: '#e6f7ff',
      padding: '1.5rem',
      borderRadius: 14,
      boxShadow: '0 10px 30px rgba(2,6,8,0.6)',
      boxSizing: 'border-box',
    }}>
      <h1 style={{ margin: 0, color: '#fff', fontSize: '1.5rem', letterSpacing: '0.02em' }}>
        Head-to-Head Records
      </h1>
      <div style={{ color: '#9fb0bd', fontSize: '0.85rem', marginTop: 4 }}>
        Row team's W-L record against each column team · Teams sorted by standings
      </div>
      <div style={{
        height: 6,
        borderRadius: 6,
        background: 'linear-gradient(90deg,#7a2b00,#c2410c,#ff8a00)',
        marginTop: 12,
        marginBottom: 16,
      }} />

      {loading ? (
        <div style={{ color: '#9fb0bd', textAlign: 'center', padding: '2rem' }}>Loading...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
            <thead>
              <tr>
                <th style={{
                  padding: '10px 14px',
                  textAlign: 'left',
                  color: '#ffe8d0',
                  fontWeight: 700,
                  position: 'sticky',
                  left: 0,
                  background: '#0d1b2a',
                  zIndex: 2,
                  borderBottom: '2px solid #c2410c',
                  borderRight: '1px solid #333',
                  minWidth: 100,
                }}>Team</th>
                {teams.map(t => (
                  <th key={t.id} style={{
                    padding: '4px 6px',
                    textAlign: 'center',
                    color: '#ffe8d0',
                    fontWeight: 700,
                    borderBottom: '2px solid #c2410c',
                    minWidth: 36,
                    height: 110,
                    verticalAlign: 'bottom',
                  }}>
                    <div style={{
                      writingMode: 'vertical-rl',
                      transform: 'rotate(180deg)',
                      whiteSpace: 'nowrap',
                      paddingBottom: 4,
                    }}>{t.name}</div>
                  </th>
                ))}
                <th style={{
                  padding: '10px 14px',
                  textAlign: 'center',
                  color: '#ffe8d0',
                  fontWeight: 700,
                  borderBottom: '2px solid #c2410c',
                  borderLeft: '2px solid #c2410c',
                  minWidth: 72,
                }}>Overall</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((rowTeam, ri) => (
                <tr key={rowTeam.id} style={{ background: ri % 2 === 0 ? '#0d1b2a' : '#0b1520' }}>
                  <td style={{
                    padding: '9px 14px',
                    fontWeight: 700,
                    color: '#fff',
                    position: 'sticky',
                    left: 0,
                    background: stickyColBg(ri),
                    zIndex: 1,
                    borderRight: '1px solid #333',
                  }}>{rowTeam.name}</td>
                  {teams.map(colTeam => {
                    const cs = getCellStyle(rowTeam.id, colTeam.id);
                    return (
                      <td key={colTeam.id} style={{
                        padding: '9px 10px',
                        textAlign: 'center',
                        fontWeight: rowTeam.id === colTeam.id ? 400 : 600,
                        ...cs,
                      }}>
                        {getCellText(rowTeam.id, colTeam.id)}
                      </td>
                    );
                  })}
                  <td style={{
                    padding: '9px 14px',
                    textAlign: 'center',
                    fontWeight: 700,
                    color: '#ffd7b0',
                    borderLeft: '2px solid #c2410c',
                    background: 'rgba(194,65,12,0.12)',
                  }}>
                    {rowTeam.wins}-{rowTeam.losses}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HeadToHead;
