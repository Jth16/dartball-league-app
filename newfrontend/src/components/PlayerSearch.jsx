import React, { useState, useEffect, useRef } from 'react';
import { fetchWithToken } from '../api';

const PlayerSearch = () => {
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [allPlayers, setAllPlayers] = useState([]);
  const rankMapsRef = useRef(null);
  // map of teamId -> teamName
  const teamsMapRef = useRef(null);
  const debounceRef = useRef(null);

  // Build / expose rank maps whenever we receive the full players list
  useEffect(() => {
    try {
      if (Array.isArray(allPlayers) && allPlayers.length > 0) {
        rankMapsRef.current = buildRankMaps(allPlayers);
        // expose for debugging in browser console
        // open DevTools and inspect window.__rankMaps
        // eslint-disable-next-line no-undef
        window.__rankMaps = rankMapsRef.current;
        console.log('buildRankMaps: sizes', {
          avg: rankMapsRef.current.avg?.size ?? 0,
          singles: rankMapsRef.current.singles?.size ?? 0,
          doubles: rankMapsRef.current.doubles?.size ?? 0,
          triples: rankMapsRef.current.triples?.size ?? 0,
          hrs: rankMapsRef.current.hrs?.size ?? 0,
          dimes: rankMapsRef.current.dimes?.size ?? 0,
          allPlayersCount: allPlayers.length
        });
        // show a few keys to verify what format is being used
        try {
          console.log('sample avg keys', [...(rankMapsRef.current.avg?.keys()||[])].slice(0,20));
        } catch (e) {}
      } else {
        rankMapsRef.current = null;
        // eslint-disable-next-line no-undef
        window.__rankMaps = null;
        console.log('buildRankMaps: no players yet');
      }
    } catch (e) {
      console.warn('buildRankMaps effect error', e);
    }
  }, [allPlayers]);

  // used to skip the immediate suggestion fetch caused by programmatic setQuery (when picking)
  const skipSuggestRef = useRef(false);

  // normalize a player's display name (use returned "name" if present)
  const normalizeName = (p = {}) => {
    const name =
      p.name ||
      p.fullName ||
      p.player_name ||
      `${p.first_name || p.firstName || ''} ${p.last_name || p.lastName || ''}`.trim();
    return (name || '').toString().trim();
  };

  // Helper: try several keys to lookup a metric entry (id, player_id, name)
  const getRankEntry = (maps, metricKey, p) => {
    if (!maps || !maps[metricKey]) return { rank: null, tied: false };
    const map = maps[metricKey];
    const tryKeys = [
      (p && p.id),
      (p && p.player_id),
      (p && p.playerId),
      (p && p.name),
      normalizeName(p)
    ].filter(k => k !== undefined && k !== null).map(String);
    for (let k of tryKeys) {
      const e = map.get(k);
      if (e && (typeof e.rank !== 'undefined' || typeof e.tied !== 'undefined')) return e;
    }
    return { rank: null, tied: false };
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

  // build rank maps for global players list (higher value => better rank)
  const buildRankMaps = (players = []) => {
    const metrics = [
      { key: 'avg', getter: p => parseFloat(p.Avg ?? p.avg ?? NaN) },
      { key: 'singles', getter: p => Number(p.Singles ?? p.singles ?? NaN) },
      { key: 'doubles', getter: p => Number(p.Doubles ?? p.doubles ?? NaN) },
      { key: 'triples', getter: p => Number(p.Triples ?? p.triples ?? NaN) },
      { key: 'hrs', getter: p => Number(p.HRs ?? p.hrs ?? NaN) },
      { key: 'dimes', getter: p => Number(p.Dimes ?? p.dimes ?? NaN) }
    ];

    const idFor = (p) => String(p.id ?? p.player_id ?? p.name ?? '');
    const maps = {};
    metrics.forEach(m => {
      // sort descending, treat non-numeric as -Infinity so they sink
      const sorted = [...players].sort((a, b) => {
        const av = m.getter(a), bv = m.getter(b);
        const an = Number.isFinite(av) ? av : -Infinity;
        const bn = Number.isFinite(bv) ? bv : -Infinity;
        return bn - an;
      });

      // count identical values to detect ties
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

  // load full player list on mount so ranks are computed relative to all players
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetchWithToken('/routes/players?limit=10000');
        let payload = res;
        if (res && typeof res === 'object' && typeof res.json === 'function') {
          try { payload = await res.json(); } catch { try { payload = JSON.parse(await res.text()); } catch { payload = res; } }
        }
        const arr = Array.isArray(payload) ? payload : (payload && Array.isArray(payload.players) ? payload.players : []);
        if (!mounted) return;
        setAllPlayers(arr);
        rankMapsRef.current = buildRankMaps(arr);

        // fetch teams once and build id->name map
        try {
          const tRes = await fetchWithToken('/routes/teams?limit=1000');
          let tPayload = tRes;
          if (tRes && typeof tRes === 'object' && typeof tRes.json === 'function') {
            try { tPayload = await tRes.json(); } catch { try { tPayload = JSON.parse(await tRes.text()); } catch { tPayload = tRes; } }
          }
          const tArr = Array.isArray(tPayload) ? tPayload : (tPayload && Array.isArray(tPayload.teams) ? tPayload.teams : []);
          const map = new Map();
          tArr.forEach(t => {
            const id = t.id ?? t.team_id ?? t.teamId;
            const name = t.name ?? t.team_name ?? t.teamName ?? t.displayName;
            if (id != null) map.set(String(id), name ?? '');
          });
          teamsMapRef.current = map;
        } catch (e) {
          teamsMapRef.current = new Map();
        }
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  // fetch from server and return normalized array (no extra client-side filtering)
  const fetchPlayers = async (q) => {
    const qtrim = (q || '').trim();
    if (!qtrim) return [];
    setLoading(true);
    try {
      const path = `/routes/players/search?q=${encodeURIComponent(qtrim)}`;
      const res = await fetchWithToken(path);

      // If fetchWithToken returned a Response object, read/parse the body
      let payload = res;
      if (res && typeof res === 'object' && typeof res.json === 'function') {
        try {
          payload = await res.json();
        } catch (errJson) {
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
      const normalized = arr.map(p => {
        const teamId = p.team_id ?? p.teamId ?? p.team ?? p.team_name;
        const mapped = teamsMapRef.current && teamId != null ? teamsMapRef.current.get(String(teamId)) : null;
        return {
          ...p,
          name: normalizeName(p),
          teamName: mapped ?? p.team_name ?? p.team ?? (p.team_id ? String(p.team_id) : '')
        };
      });

      // if we have global rank maps, annotate each returned player with global ranks
      const maps = rankMapsRef.current;
      if (maps) {
        normalized.forEach(p => {
          const eAvg = getRankEntry(maps, 'avg', p);
          p.avgRank = eAvg.rank; p.avgTied = !!eAvg.tied;
          const eSingles = getRankEntry(maps, 'singles', p);
          p.singlesRank = eSingles.rank; p.singlesTied = !!eSingles.tied;
          const eDoubles = getRankEntry(maps, 'doubles', p);
          p.doublesRank = eDoubles.rank; p.doublesTied = !!eDoubles.tied;
          const eTriples = getRankEntry(maps, 'triples', p);
          p.triplesRank = eTriples.rank; p.triplesTied = !!eTriples.tied;
          const eHrs = getRankEntry(maps, 'hrs', p);
          p.hrsRank = eHrs.rank; p.hrsTied = !!eHrs.tied;
          const eDimes = getRankEntry(maps, 'dimes', p);
          p.dimesRank = eDimes.rank; p.dimesTied = !!eDimes.tied;
        });
      }

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

    // if we just picked a suggestion, skip one suggestion fetch caused by programmatic setQuery
    if (skipSuggestRef.current) {
      skipSuggestRef.current = false;
      return;
    }

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
    const list = await fetchPlayers(query);

    // show exactly what server returned (with normalized name)
    setMatches(Array.isArray(list) ? list : []);
  };

  // helper: try to load full player record by id, fallback to search by name, finally return original
  const loadFullPlayer = async (p) => {
    if (!p) return p;

    // quick check: if object already has core stats, no fetch needed
    const hasCoreStats = (obj) => {
      return obj && (
        typeof obj.AtBats !== 'undefined' ||
        typeof obj.atBats !== 'undefined' ||
        typeof obj.ab !== 'undefined' ||
        typeof obj.Avg !== 'undefined' ||
        typeof obj.avg !== 'undefined' ||
        typeof obj.hits !== 'undefined' ||
        typeof obj.Hits !== 'undefined'
      );
    };

    if (hasCoreStats(p)) {
      // annotate ranks and return immediately
      try {
        const maps = rankMapsRef.current;
        if (maps) {
          const eAvg = getRankEntry(maps, 'avg', p);
          p.avgRank = eAvg.rank; p.avgTied = !!eAvg.tied;
          const eSingles = getRankEntry(maps, 'singles', p);
          p.singlesRank = eSingles.rank; p.singlesTied = !!eSingles.tied;
          const eDoubles = getRankEntry(maps, 'doubles', p);
          p.doublesRank = eDoubles.rank; p.doublesTied = !!eDoubles.tied;
          const eTriples = getRankEntry(maps, 'triples', p);
          p.triplesRank = eTriples.rank; p.triplesTied = !!eTriples.tied;
          const eHrs = getRankEntry(maps, 'hrs', p);
          p.hrsRank = eHrs.rank; p.hrsTied = !!eHrs.tied;
          const eDimes = getRankEntry(maps, 'dimes', p);
          p.dimesRank = eDimes.rank; p.dimesTied = !!eDimes.tied;
        }
      } catch (e) {
        console.warn('loadFullPlayer: annotation failed', e);
      }
      return p;
    }

    // otherwise attempt fetch by id (keeps previous robust behavior)
    try {
      if (p.id || p.player_id) {
        const idToTry = p.id ?? p.player_id;
        const url = `/routes/players/${idToTry}`;
        try {
          const resp = await fetchWithToken(url);
          if (resp && resp.ok) {
            const data = await resp.json();
            p = data;
          } else {
            console.warn(`loadFullPlayer: fetch ${url} returned status ${resp ? resp.status : 'no-response'}`);
          }
        } catch (fetchErr) {
          console.warn(`loadFullPlayer: fetch to ${url} failed`, fetchErr);
        }
      }
    } catch (e) {
      console.warn('loadFullPlayer unexpected error', e);
    }

    // annotate ranks before returning
    try {
      const maps = rankMapsRef.current;
      if (maps) {
        const eAvg = getRankEntry(maps, 'avg', p);
        p.avgRank = eAvg.rank; p.avgTied = !!eAvg.tied;
        const eSingles = getRankEntry(maps, 'singles', p);
        p.singlesRank = eSingles.rank; p.singlesTied = !!eSingles.tied;
        const eDoubles = getRankEntry(maps, 'doubles', p);
        p.doublesRank = eDoubles.rank; p.doublesTied = !!eDoubles.tied;
        const eTriples = getRankEntry(maps, 'triples', p);
        p.triplesRank = eTriples.rank; p.triplesTied = !!eTriples.tied;
        const eHrs = getRankEntry(maps, 'hrs', p);
        p.hrsRank = eHrs.rank; p.hrsTied = !!eHrs.tied;
        const eDimes = getRankEntry(maps, 'dimes', p);
        p.dimesRank = eDimes.rank; p.dimesTied = !!eDimes.tied;
      }
    } catch (e) {
      console.warn('loadFullPlayer rank annotation failed', e);
    }
    return p;
  };

  // when a suggestion is clicked, load the entire record (from backend if possible)
  const pick = async (p) => {
    // prevent the suggestion effect from firing due to the programmatic setQuery
    skipSuggestRef.current = true;
    setQuery(p.name || p.fullName || '');
    setMatches([]); // close suggestions immediately

    // load full record and set as selected
    const full = await loadFullPlayer(p);
    // ensure name exists
    const withName = { ...full, name: (full && (full.name || full.fullName)) ? (full.name || full.fullName) : (p.name || '') };

    // prefer explicit teamName, then try teams map by id
    if (!withName.teamName) {
      const teamId = withName.team_id ?? withName.teamId ?? withName.team ?? withName.team_name;
      const mapped = teamsMapRef.current && teamId != null ? teamsMapRef.current.get(String(teamId)) : null;
      withName.teamName = mapped ?? withName.teamName ?? withName.team ?? withName.team_name ?? '';
    }
    
    // annotate with global ranks (if available)
    const maps2 = rankMapsRef.current;
    if (maps2) {
      const eAvg = getRankEntry(maps2, 'avg', withName);
      withName.avgRank = eAvg.rank; withName.avgTied = !!eAvg.tied;
      const eSingles = getRankEntry(maps2, 'singles', withName);
      withName.singlesRank = eSingles.rank; withName.singlesTied = !!eSingles.tied;
      const eDoubles = getRankEntry(maps2, 'doubles', withName);
      withName.doublesRank = eDoubles.rank; withName.doublesTied = !!eDoubles.tied;
      const eTriples = getRankEntry(maps2, 'triples', withName);
      withName.triplesRank = eTriples.rank; withName.triplesTied = !!eTriples.tied;
      const eHrs = getRankEntry(maps2, 'hrs', withName);
      withName.hrsRank = eHrs.rank; withName.hrsTied = !!eHrs.tied;
      const eDimes = getRankEntry(maps2, 'dimes', withName);
      withName.dimesRank = eDimes.rank; withName.dimesTied = !!eDimes.tied;
    }
    setSelected(withName);
  };

  const clear = () => {
    setSelected(null);
    setQuery('');
    setMatches([]);
  };

  const fmtAvg = (v) => {
      if (typeof v === 'number') return v.toFixed(3).replace(/^0\./, '.');
      const n = Number(v);
      return Number.isFinite(n) ? n.toFixed(3).replace(/^0\./, '.') : 'N/A';
    };

  const fmt = (v) => (v === null || v === undefined ? '—' : v);

const formatRank = (rank, tied) => {
    if (rank === null || rank === undefined) return '—';
    const n = Number(rank);
    if (!Number.isFinite(n)) return '—';
    const absInt = Math.abs(Math.floor(n));
    const rem100 = absInt % 100;
    let suffix = 'th';
    // 11,12,13 are special -> always 'th'
    if (rem100 < 11 || rem100 > 13) {
        const rem10 = absInt % 10;
        if (rem10 === 1) suffix = 'st';
        else if (rem10 === 2) suffix = 'nd';
        else if (rem10 === 3) suffix = 'rd';
    }
    const suffixed = `${n}${suffix}`;
    return tied ? `T-${suffixed}` : suffixed;
};

  // container with thin rounded border
  const container = {
    marginBottom: 18,
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 10,
    padding: 12,
    boxSizing: 'border-box',
    background: 'transparent'
  };

return (
    <>
      {/* hide this component when printing */}
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
      <div className="no-print" style={container}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <label style={{ color: '#cbd5e1', fontWeight: 700 }}>Player Lookup</label>
            <button
                onClick={clear}
                disabled={!selected && !query}
                aria-disabled={!selected && !query}
                style={{
                    background: 'transparent',
                    color: '#ffd7b0',
                    border: 'none',
                    cursor: (!selected && !query) ? 'default' : 'pointer',
                    opacity: (!selected && !query) ? 0.5 : 1,
                    padding: 0
                }}
            >
                Clear
            </button>
        </div>

        {/* Instructions: shown above the search input */}
        <ol style={{ marginTop: 12, marginBottom: 8, paddingLeft: 18, color: '#cbd5e1', fontSize: 13 }}>
            <li>Start typing to see suggested player list</li>
            <li>Click on a player to see their stats</li>
            <li>Use the "Clear" button to reset the search</li>
        </ol>

        <div>
            <input
                aria-label="Search players"
                placeholder="Type player name..."
                value={query}
                onChange={(e) => {
                    // user typed -> drop any selected player and allow suggestions
                    skipSuggestRef.current = false;
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
        </div>

        {/* suggestion list - shown while typing (matches present) */}
        {matches.length > 0 && !selected && (
            <div style={{ background: '#07101a', borderRadius: 8, marginTop: 8, padding: 8 }}>
                {matches.map((p) => (
                    <div
                        key={p.id || p.name}
                        style={{ padding: '8px 10px', borderRadius: 6, cursor: 'pointer', color: '#e6f7ff' }}
                        onClick={() => pick(p)}
                    >
                        <div style={{ fontWeight: 800, textAlign: 'left' }}>{p.name}</div>
                    </div>
                ))}
            </div>
        )}

        {/* selected full player record - only shown after a suggestion is picked */}
        {selected && (
            <div style={{ marginTop: 16, padding: 12, borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.62)', background: '#07101a', textAlign: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'left', marginBottom: 2 }}>
                    <div>
                        <div style={{ fontSize: 18, paddingLeft: 10, fontWeight: 800, color: '#fff', textAlign: 'left' }}>{selected.name}</div>
                        <div style={{ fontSize: 13, paddingLeft: 10, color: '#cbd5e1', textAlign: 'left' }}>{selected.teamName || selected.team || selected.team_name || ''}</div>
                    </div>
                    <div style={{ color: '#ffd7b0', fontWeight: 700, marginTop: -5 }}>Player Stats:</div>
                </div>

                {/* Player stats table - styled similarly to Leaders tables */}
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'separate',
                    borderSpacing: '0 2px',
                    minWidth: 320,
                    fontSize: '0.95rem'
                  }}
                >
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'center', padding: '4px 8px', color: '#ffd7b0', fontWeight: 700 }}>ABs</th>
                      <th style={{ textAlign: 'center', padding: '4px 8px', color: '#ffd7b0', fontWeight: 700 }}>Hits</th>
                      <th style={{ textAlign: 'center', padding: '4px 8px', color: '#ffd7b0', fontWeight: 700 }}>Avg</th>
                      <th style={{ textAlign: 'center', padding: '4px 8px', color: '#ffd7b0', fontWeight: 700 }}>Singles</th>
                      <th style={{ textAlign: 'center', padding: '4px 8px', color: '#ffd7b0', fontWeight: 700 }}>Doubles</th>
                      <th style={{ textAlign: 'center', padding: '4px 8px', color: '#ffd7b0', fontWeight: 700 }}>Triples</th>
                      <th style={{ textAlign: 'center', padding: '4px 8px', color: '#ffd7b0', fontWeight: 700 }}>Dimes</th>
                      <th style={{ textAlign: 'center', padding: '4px 8px', color: '#ffd7b0', fontWeight: 700 }}>HRs</th>
                      <th style={{ textAlign: 'center', padding: '4px 8px', color: '#ffd7b0', fontWeight: 700 }}>GP</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      { [
                          fmt(selected.AtBats ?? selected.atBats ?? selected.ab),
                          fmt(selected.hits ?? selected.Hits),
                          (selected.Avg != null ? fmtAvg(selected.Avg) : 'N/A'),
                          fmt(selected.Singles ?? selected.singles),
                          fmt(selected.Doubles ?? selected.doubles),
                          fmt(selected.Triples ?? selected.triples),
                          fmt(selected.Dimes ?? selected.dimes),
                          fmt(selected.HRs ?? selected.hrs),
                          fmt(selected.GP ?? selected.gp)
                        ].map((val, i) => (
                          <td key={i} style={{ padding: 0, textAlign: 'center' }}>
                            <div
                              style={{
                                display: 'inline-block',
                                minWidth: 5,
                                padding: '4px 8px',
                                borderRadius: 8,
                                background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.01)',
                                color: '#e6f7ff',
                                fontWeight: 600
                              }}
                            >
                              {val}
                            </div>
                          </td>
                        )) }
                    </tr>
                  </tbody>
                </table>

                {/* Team name + current global ranks */}
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ color: '#cbd5e1', fontWeight: 700 }}>League Ranks:</div>

                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: '#cbd5e1' }}>Avg.</div>
                            <div style={{ color: '#ffd7b0', fontWeight: 700 }}>{formatRank(selected.avgRank, selected.avgTied)}</div>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: '#cbd5e1' }}>Singles</div>
                            <div style={{ color: '#ffd7b0', fontWeight: 700 }}>{formatRank(selected.singlesRank, selected.singlesTied)}</div>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: '#cbd5e1' }}>Doubles</div>
                            <div style={{ color: '#ffd7b0', fontWeight: 700 }}>{formatRank(selected.doublesRank, selected.doublesTied)}</div>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: '#cbd5e1' }}>Triples</div>
                            <div style={{ color: '#ffd7b0', fontWeight: 700 }}>{formatRank(selected.triplesRank, selected.triplesTied)}</div>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: '#cbd5e1' }}>HRs</div>
                            <div style={{ color: '#ffd7b0', fontWeight: 700 }}>{formatRank(selected.hrsRank, selected.hrsTied)}</div>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: '#cbd5e1' }}>Dimes</div>
                            <div style={{ color: '#ffd7b0', fontWeight: 700 }}>{formatRank(selected.dimesRank, selected.dimesTied)}</div>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    </>
  );
};

export default PlayerSearch;