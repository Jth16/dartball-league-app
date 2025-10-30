import React, { useState, useEffect, useRef } from 'react';
import { fetchWithToken } from '../api';

const PlayerSearch = () => {
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  // normalize a player's display name (use returned "name" if present)
  const normalizeName = (p = {}) => {
    const name =
      p.name ||
      p.fullName ||
      p.player_name ||
      `${p.first_name || p.firstName || ''} ${p.last_name || p.lastName || ''}`.trim();
    return (name || '').toString().trim();
  };

  // robustly convert backend response -> array of player objects
  const coerceResponseToArray = (res) => {
    if (!res && res !== 0) return [];
    if (Array.isArray(res)) return res;
    if (typeof res === 'string') {
      try { const parsed = JSON.parse(res); if (Array.isArray(parsed)) return parsed; res = parsed; }
      catch (e) { return []; }
    }
    if (typeof res === 'object' && res !== null) {
      if (Array.isArray(res.players)) return res.players;
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.result)) return res.result;
      if (Array.isArray(res.items)) return res.items;
      if (res.name || res.id) return [res];
    }
    return [];
  };

  // fetch from server and return normalized array (no extra client-side filtering)
  const fetchPlayers = async (q) => {
    const qtrim = (q || '').trim();
    if (!qtrim) return [];
    setLoading(true);
    try {
      // use the correct backend path
      const path = `/routes/players/search?q=${encodeURIComponent(qtrim)}`;
      const res = await fetchWithToken(path);

      // If fetchWithToken returned a Response object, read/parse the body
      let payload = res;
      if (res && typeof res === 'object' && typeof res.json === 'function') {
        try {
          payload = await res.json();
        } catch (errJson) {
          // fallback to text -> try parse JSON
          let txt = null;
          try {
            txt = await res.text();
            payload = JSON.parse(txt);
          } catch (errTxt) {
            payload = txt || null;
          }
        }
      }

      const arr = coerceResponseToArray(payload);

      // ensure each item has a usable "name" for display
      const normalized = arr.map(p => ({ ...p, name: normalizeName(p) }));

      return normalized;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('PlayerSearch.fetchPlayers error', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // suggestions (debounced) call fetchPlayers and use first 12 results
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query || query.trim() === '') { setMatches([]); return; }
    debounceRef.current = setTimeout(async () => {
      const list = await fetchPlayers(query);
      setMatches(list.slice(0, 12));
    }, 220);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // "Search" button -> fetch server results and display them directly
  const onSubmit = async (e) => {
    if (e) e.preventDefault();
    setShowResults(true);
    const list = await fetchPlayers(query);

    // DEBUG: inspect what we're about to render
    // eslint-disable-next-line no-console
    console.log('PlayerSearch.onSubmit: server list =', list);

    // show exactly what server returned (with normalized name)
    setMatches(Array.isArray(list) ? list : []);
  };

  const pick = (p) => {
    setSelected(p);
    setQuery(p.name);
    setMatches([]);
    setShowResults(false);
  };

  const clear = () => {
    setSelected(null);
    setQuery('');
    setMatches([]);
    setShowResults(false);
  };

  const fmt = (v) => (v === null || v === undefined ? '—' : v);

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <label style={{ color: '#cbd5e1', fontWeight: 700 }}>Find player</label>
        {selected && (
          <button onClick={clear} style={{ background: 'transparent', color: '#ffd7b0', border: 'none', cursor: 'pointer' }}>
            Clear
          </button>
        )}
      </div>

      <form onSubmit={onSubmit}>
        <input
          aria-label="Search players"
          placeholder="Type player name..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
          }}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.06)',
            background: '#061018',
            color: '#fff',
          }}
        />

        <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
          <button type="submit" style={{ padding: '8px 12px', borderRadius: 8, background: '#c2410c', color: '#fff', border: 'none' }}>
            Search
          </button>
          <button type="button" onClick={clear} style={{ padding: '8px 12px', borderRadius: 8, background: 'transparent', color: '#ffd7b0', border: '1px solid rgba(255,215,176,0.08)' }}>
            Clear
          </button>
        </div>
      </form>

      {/* suggestion list */}
      {!showResults && matches.length > 0 && (
        <div style={{ background: '#07101a', borderRadius: 8, marginTop: 8, padding: 8 }}>
          {matches.map((p) => (
            <div key={p.id || p.name} style={{ padding: '8px 10px', borderRadius: 6, cursor: 'pointer', color: '#e6f7ff' }} onClick={() => pick(p)}>
              <div style={{ fontWeight: 800 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: '#9fb8d6' }}>{p.team || p.team_name || ''}</div>
            </div>
          ))}
        </div>
      )}

      {/* results table */}
      {showResults && (
        <div style={{ marginTop: 12 }}>
          {loading ? (
            <div style={{ color: '#cbd5e1', padding: 12 }}>Loading…</div>
          ) : matches.length === 0 ? (
            <div style={{ color: '#cbd5e1', padding: 12 }}>No players found.</div>
          ) : (
            <table className="responsive" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px 10px', color: '#ffd7b0' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px', color: '#ffd7b0' }}>Team</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px', color: '#ffd7b0' }}>At Bats</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px', color: '#ffd7b0' }}>Hits</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px', color: '#ffd7b0' }}>Avg</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px', color: '#ffd7b0' }}>GP</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((p, idx) => (
                  <tr key={p.id || `${p.name}-${idx}`} style={{ background: idx % 2 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '8px 10px' }} data-label="Name">{p.name}</td>
                    <td style={{ padding: '8px 10px' }} data-label="Team">{p.team || p.team_name || ''}</td>
                    <td style={{ padding: '8px 10px' }} data-label="At Bats">{fmt(p.AtBats ?? p.atBats ?? p.ab)}</td>
                    <td style={{ padding: '8px 10px' }} data-label="Hits">{fmt(p.hits ?? p.Hits)}</td>
                    <td style={{ padding: '8px 10px' }} data-label="Avg">{fmt(p.Avg ?? p.avg)}</td>
                    <td style={{ padding: '8px 10px' }} data-label="GP">{fmt(p.GP ?? p.gp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default PlayerSearch;