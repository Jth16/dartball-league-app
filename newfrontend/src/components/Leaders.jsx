import React, { useEffect, useState, useRef } from 'react';
import { printElement } from '../utils/print';

const API_BASE = process.env.REACT_APP_API_URL || 'https://dartball-backend-654879525708.us-central1.run.app';
const TOP_N = 5;

const normalizeNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// build rank maps (returns maps for keys: avg, singles, doubles, triples, hrs, dimes)
// each map stores entries as { rank, tied } keyed by stringified id/name
const buildRankMaps = (players = []) => {
  const metrics = [
    { key: 'Avg', getter: p => parseFloat(p.Avg ?? p.avg ?? NaN) },
    { key: 'Singles', getter: p => Number(p.Singles ?? p.singles ?? NaN) },
    { key: 'Doubles', getter: p => Number(p.Doubles ?? p.doubles ?? NaN) },
    { key: 'Triples', getter: p => Number(p.Triples ?? p.triples ?? NaN) },
    { key: 'HRs', getter: p => Number(p.HRs ?? p.hrs ?? NaN) },
    { key: 'Dimes', getter: p => Number(p.Dimes ?? p.dimes ?? NaN) },
    { key: 'hits', getter: p => Number(p.hits ?? NaN) }
  ];

  const idFor = (p) => String(p.id ?? p.player_id ?? p.name ?? '');

  const maps = {};
  metrics.forEach(m => {
    const sorted = [...players].sort((a, b) => {
      const av = m.getter(a), bv = m.getter(b);
      const an = Number.isFinite(av) ? av : -Infinity;
      const bn = Number.isFinite(bv) ? bv : -Infinity;
      return bn - an;
    });

    // count identical numeric values to detect ties
    const counts = new Map();
    sorted.forEach(s => {
      const v = m.getter(s);
      const key = Number.isFinite(v) ? String(v) : '__NA__';
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    let lastVal = null;
    let lastRank = 0;
    const map = new Map();
    for (let i = 0; i < sorted.length; i++) {
      const val = m.getter(sorted[i]);
      const valKey = Number.isFinite(val) ? String(val) : '__NA__';
      const rank = (i === 0 || val !== lastVal) ? (i + 1) : lastRank;
      const tied = (counts.get(valKey) || 0) > 1;
      map.set(idFor(sorted[i]), Number.isFinite(val) ? { rank, tied } : { rank: null, tied: false });
      lastVal = val;
      lastRank = rank;
    }
    maps[m.key] = map;
  });

  return maps;
};

const Leaders = () => {
  const [players, setPlayers] = useState([]);
  const [teamsMap, setTeamsMap] = useState({});
  const containerRef = useRef(null);
  const rankMapsRef = useRef(null);

  // submenu selection state
  const [selectedCategory, setSelectedCategory] = useState('all');

  const menuItems = [
    { label: 'Overall Leaders', key: 'all' },
    { label: 'Sngles', key: 'Singles' },
    { label: 'Dbles', key: 'Doubles' },
    { label: 'Trples', key: 'Triples' },
    { label: 'HRs', key: 'HRs' },
    { label: 'Hits', key: 'hits' },
    { label: 'Dimes', key: 'Dimes' }
  ];

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

  // rebuild rank maps whenever players change
  useEffect(() => {
    if (Array.isArray(players) && players.length > 0) {
      rankMapsRef.current = buildRankMaps(players);
      // optional debug exposure
      // window.__leadersRankMaps = rankMapsRef.current;
    } else {
      rankMapsRef.current = null;
    }
  }, [players]);

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

  const submenuStyle = {
    display: 'flex',
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center'
  };
  const menuBtn = (active) => ({
    padding: '6px 10px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.06)',
    background: active ? 'linear-gradient(90deg,#7a2b00,#c2410c)' : '#111',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: active ? 800 : 600,
    fontSize: 13
  });

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

  // helper to get id key used in rank maps
  const idForPlayer = (p) => String(p.id ?? p.player_id ?? p.name ?? '');

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

      {/* submenu */}
      <div style={submenuStyle}>
        {menuItems.map(mi => (
          <button
            key={mi.key}
            onClick={() => setSelectedCategory(mi.key)}
            style={menuBtn(selectedCategory === mi.key)}
            className="no-print"
          >
            {mi.label}
          </button>
        ))}
      </div>

      <div style={tableWrapperStyle}>
        {(
          selectedCategory === 'all'
            ? tables
            : tables.filter(t => t.key === selectedCategory)
        ).map(tbl => {
          // show TOP_N when "all" (overview), otherwise show the full sorted list for the selected category
          const rows = topBy(tbl.key, selectedCategory === 'all' ? TOP_N : (players.length || 0));
          const maps = rankMapsRef.current;

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
                  ) : rows.map((p, idx) => {
                    const idKey = idForPlayer(p);
                    const entry = maps && maps[tbl.key] ? (maps[tbl.key].get(idKey) || { rank: null, tied: false }) : { rank: null, tied: false };
                    const rankDisplay = entry.rank ? (entry.tied ? `T-${entry.rank}` : String(entry.rank)) : String(idx + 1);

                    return (
                      <tr key={p.id || idx} style={rowStyle}>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>{rankDisplay}</td>
                        <td style={tdStyle}>{p.name}</td>
                        <td style={tdStyle}>{teamsMap[p.team_id] ?? p.team_id}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>{tbl.format(p[tbl.key] ?? 0)}</td>
                      </tr>
                    );
                  })}
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