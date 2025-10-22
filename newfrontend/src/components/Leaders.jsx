import React, { useEffect, useState } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'https://dartball-backend-654879525708.us-central1.run.app';

const TOP_N = 5; // changed to top 5

const normalizeNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const Leaders = () => {
  const [players, setPlayers] = useState([]);
  const [teamsMap, setTeamsMap] = useState({});

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

  if (!players.length) {
    return (
      <div style={{ maxWidth: 1100, margin: "2rem auto", background: "#0b1220", color: "#fff", padding: "2rem", borderRadius: 16 }}>
        <h2 style={{ color: '#fff', marginBottom: 12 }}>Leaders</h2>
        <p style={{ color: '#cbd5e1' }}>Loading…</p>
      </div>
    );
  }

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

  const containerStyle = {
    maxWidth: 1100,
    margin: "2rem auto",
    background: "rgba(17, 17, 17, 1)",
    color: "#fff",
    padding: "2rem",
    borderRadius: 16
  };

  const tableWrapperStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(280px, 1fr))', // two per row
    gap: 16,
    marginTop: 12
  };

  // styled like TeamsTable: spaced rows, header dark, rows darker, responsive scroll
  const smallTableStyle = {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '0 12px',
    minWidth: 320
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
    background: '#111',
    borderRadius: 6
  };

  const tableLabelStyle = {
    color: '#fff',
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 4
  };

  const tableDescStyle = {
    color: '#cbd5e1',
    fontSize: 12,
    marginBottom: 8
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ color: '#fff', marginBottom: 6 ,textAlign: 'center'}}>League Leaders</h1>
      <p style={{ color: '#cbd5e1', marginTop: 0, marginBottom: 12,textAlign: 'center' }}>Top players by category</p>

      <div style={tableWrapperStyle}>
        {tables.map(tbl => {
          const rows = topBy(tbl.key);
          return (
            <div key={tbl.key}>
              <div style={{ marginBottom: 8 }}>
                <div style={{ ...tableLabelStyle, textAlign: 'center' }}>{tbl.title}</div>
              </div>

              <div style={{ overflowX: 'auto' }}>
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
                      <tr key={p.id} style={rowStyle}>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>{idx + 1}</td>
                        <td style={tdStyle}>{p.name}</td>
                        <td style={tdStyle}>{teamsMap[p.team_id] ?? p.team_id}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>{tbl.format(p[tbl.key] ?? 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Leaders;