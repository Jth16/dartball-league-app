import React, { useEffect, useState, useRef } from 'react';
import { printElement } from '../utils/print';

const API_BASE = process.env.REACT_APP_API_URL || 'https://dartball-backend-654879525708.us-central1.run.app';
const TOP_N = 5;

const normalizeNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const Leaders = () => {
  const [players, setPlayers] = useState([]);
  const [teamsMap, setTeamsMap] = useState({});
  const containerRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const teamsRes = await fetch(`${API_BASE}/routes/teams`);
        const teams = teamsRes.ok ? await teamsRes.json() : [];
        const map = {};
        teams.forEach(t => { map[t.id] = t.name; });
        if (!mounted) return;
        setTeamsMap(map);

        const playersRes = await fetch(`${API_BASE}/routes/players`);
        const allPlayers = playersRes.ok ? await playersRes.json() : [];
        if (!mounted) return;

        const normalized = (allPlayers || []).map(p => ({
          ...p,
          Avg: normalizeNum(p.Avg),
          hits: normalizeNum(p.hits),
          GP: normalizeNum(p.GP),
          Singles: normalizeNum(p.Singles),
          Doubles: normalizeNum(p.Doubles),
          Triples: normalizeNum(p.Triples),
          Dimes: normalizeNum(p.Dimes),
          HRs: normalizeNum(p.HRs),
          team_id: p.team_id
        }));

        setPlayers(normalized);
      } catch (err) {
        console.error('load leaders failed', err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const topBy = (key, n = TOP_N) => {
    const sorted = [...players].sort((a, b) => {
      const av = normalizeNum(b[key]) - normalizeNum(a[key]);
      if (av !== 0) return av;
      // tie-breaker by hits then GP
      return (normalizeNum(b.hits) - normalizeNum(a.hits)) || (normalizeNum(b.GP) - normalizeNum(a.GP));
    });
    return sorted.slice(0, n);
  };

  const tables = [
    { title: 'Batting Average', key: 'Avg', label: 'Top Avg', format: (v) => (typeof v === 'number' ? v.toFixed(3).replace(/^0\./, '.') : v) },
    { title: 'Most Hits', key: 'hits', label: 'Most Hits', format: (v) => v },
    { title: 'Most Singles', key: 'Singles', label: 'Most Singles', format: (v) => v },
    { title: 'Most Doubles', key: 'Doubles', label: 'Most Doubles', format: (v) => v },
    { title: 'Most Triples', key: 'Triples', label: 'Most Triples', format: (v) => v },
    { title: 'Most HRs', key: 'HRs', label: 'Most HRs', format: (v) => v },
    { title: 'Most Dimes', key: 'Dimes', label: 'Most Dimes', format: (v) => v },
  ];

  // Styles matched to TeamsTable theme (dark + dark-orange accent)
  const containerStyle = {
    maxWidth: 1100,
    margin: "2rem auto",
    background: "linear-gradient(180deg, rgba(8,18,24,0.95) 0%, rgba(6,30,36,0.95) 100%)",
    color: "#e6f7ff",
    padding: "1.75rem",
    borderRadius: 14,
    boxShadow: "0 10px 30px rgba(2,6,8,0.6)",
    boxSizing: "border-box"
  };

  const headerStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "0.5rem"
  };

  const titleStyle = {
    margin: 0,
    color: "#fff",
    fontSize: "1.5rem",
    letterSpacing: "0.02em"
  };

  const descStyle = {
    color: "#cbd5e1",
    fontSize: 13
  };

  const accentBar = {
    height: 6,
    borderRadius: 6,
    background: "linear-gradient(90deg,#7a2b00,#c2410c,#ff8a00)",
    marginTop: 12,
    boxShadow: "0 6px 18px rgba(194,65,12,0.08)"
  };

  const tableWrapperStyle = {
    display: 'grid',
    /* auto-fit makes the blocks stack on narrow viewports and fill available columns on wide screens */
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 12,
    marginTop: 14
  };

  const smallTableStyle = {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '0 12px',
    minWidth: 280,
    fontSize: "0.95rem"
  };

  const thStyle = {
    padding: '10px',
    textAlign: 'left',
    background: '#222',
    color: '#fff',
    fontWeight: 700
  };

  const tdStyle = {
    padding: '10px',
    color: '#fff'
  };

  const rowStyle = {
    background: 'linear-gradient(180deg,#07101a 0%, #0b1520 100%)',
    borderRadius: 6
  };

  return (
    <div ref={containerRef} data-printable style={containerStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <div>
          <h1 style={titleStyle}>League Leaders</h1>
          <div style={descStyle}>Top players by category</div>
        </div>
        <button
          className="no-print"
          onClick={() => printElement(containerRef.current)}
          style={{ padding: '6px 10px', cursor: 'pointer', borderRadius: 6, border: 'none', background: '#c2410c', color: '#fff' }}
        >
          Print
        </button>
      </div>

      <div style={accentBar} />

      <div style={tableWrapperStyle}>
        {tables.map(tbl => {
          const rows = topBy(tbl.key);
          return (
            <div key={tbl.key} style={{ overflowX: 'auto' }}>
              <div style={{ marginBottom: 8, textAlign: 'center', color: '#fff', fontWeight: 700 }}>{tbl.title}</div>

              <table style={smallTableStyle}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: 36, textAlign: 'center' }}>#</th>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Team</th>
                    <th style={{ ...thStyle, textAlign: 'center', width: 80 }}>{tbl.title.includes('Avg') ? 'Avg' : 'Total'}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr><td colSpan="4" style={{ padding: 12, textAlign: 'center', color: '#cbd5e1' }}>—</td></tr>
                  ) : rows.map((p, idx) => (
                    <tr key={p.id || idx} style={rowStyle}>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>{idx + 1}</td>
                      <td style={tdStyle}>{p.name}</td>
                      <td style={tdStyle}>{teamsMap[p.team_id] ?? p.team_id}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>{tbl.format(p[tbl.key] ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Leaders;