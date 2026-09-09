import React, { useEffect, useState, useRef } from 'react';
import { fetchWithToken } from '../api';
import { printElement } from '../utils/print';

const containerStyle = {
  maxWidth: 1100,
  margin: "1.5rem auto",
  background: "linear-gradient(180deg, rgba(8,18,24,0.95) 0%, rgba(6,30,36,0.95) 100%)",
  color: "#e6f7ff",
  padding: "1.5rem",
  borderRadius: 14,
  boxShadow: "0 10px 30px rgba(2,6,8,0.6)",
  boxSizing: "border-box",
};

const accentBar = {
  height: 6,
  borderRadius: 6,
  background: "linear-gradient(90deg,#7a2b00,#c2410c,#ff8a00)",
  marginTop: 12,
  boxShadow: "0 6px 18px rgba(194,65,12,0.08)"
};

const tableWrap = { overflowX: "auto", borderRadius: 10 };

const tableStyle = {
  width: "100%",
  minWidth: 520,
  borderCollapse: "separate",
  borderSpacing: "0 10px",
  fontSize: "0.95rem"
};

const thStyle = {
  padding: "10px 12px",
  textAlign: "left",
  color: "#ffe8d0",
  fontWeight: 700,
  fontSize: "0.9rem"
};

const rowStyle = {
  background: "linear-gradient(180deg,#07101a 0%, #0b1520 100%)",
  color: "#fff",
  borderRadius: 8
};

const cellStyle = { padding: "10px 12px", verticalAlign: "middle" };

const Tab = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      padding: '8px 16px',
      borderRadius: 10,
      border: active ? '1px solid rgba(255,145,64,0.95)' : '1px solid rgba(255,255,255,0.06)',
      background: active ? 'linear-gradient(90deg, rgba(194,65,12,0.18), rgba(255,138,0,0.08))' : 'rgba(255,255,255,0.02)',
      color: '#fff',
      cursor: 'pointer',
      fontWeight: 700,
      textTransform: 'uppercase',
      fontSize: 13,
      margin: '0 4px'
    }}
  >
    {children}
  </button>
);

const fmtPct = (pct) => {
  const n = Number(pct) || 0;
  return (n / 100).toFixed(3).replace(/^0\./, '.');
};

const fmtAvg = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(3).replace(/^0\./, '.') : 'N/A';
};

const StandingsView = ({ season }) => {
  const [teams, setTeams] = useState([]);
  useEffect(() => {
    let mounted = true;
    fetchWithToken(`/routes/archive/teams?season=${encodeURIComponent(season)}`, { method: 'GET' })
      .then(res => res.ok ? res.json() : [])
      .then(data => { if (mounted) setTeams(Array.isArray(data) ? data : []); })
      .catch(() => { if (mounted) setTeams([]); });
    return () => { mounted = false; };
  }, [season]);

  return (
    <div style={tableWrap}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Team Name</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>W</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>L</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Win Pct.</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Games Played</th>
          </tr>
        </thead>
        <tbody>
          {teams.map(t => (
            <tr key={t.id} style={rowStyle}>
              <td style={{ ...cellStyle, paddingLeft: 18 }}>{t.name}</td>
              <td style={{ ...cellStyle, textAlign: 'center' }}>{t.wins}</td>
              <td style={{ ...cellStyle, textAlign: 'center' }}>{t.losses}</td>
              <td style={{ ...cellStyle, textAlign: 'center' }}>{fmtPct(t.win_pct)}</td>
              <td style={{ ...cellStyle, textAlign: 'center' }}>{t.games_played}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {teams.length === 0 && <p style={{ color: '#9fb0bd', padding: 12 }}>No standings found for this season.</p>}
    </div>
  );
};

const PlayersView = ({ season }) => {
  const [players, setPlayers] = useState([]);
  useEffect(() => {
    let mounted = true;
    fetchWithToken(`/routes/archive/players?season=${encodeURIComponent(season)}`, { method: 'GET' })
      .then(res => res.ok ? res.json() : [])
      .then(data => { if (mounted) setPlayers(Array.isArray(data) ? data : []); })
      .catch(() => { if (mounted) setPlayers([]); });
    return () => { mounted = false; };
  }, [season]);

  const grouped = players.reduce((acc, p) => {
    const key = p.team_name || 'Unknown Team';
    (acc[key] = acc[key] || []).push(p);
    return acc;
  }, {});

  return (
    <div>
      {Object.keys(grouped).length === 0 && <p style={{ color: '#9fb0bd', padding: 12 }}>No players found for this season.</p>}
      {Object.entries(grouped).map(([teamName, teamPlayers]) => (
        <section key={teamName} style={{ marginBottom: 24 }}>
          <h3 style={{ color: '#fff', margin: '0 0 8px 0' }}>{teamName}</h3>
          <div style={tableWrap}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Name</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>ABs</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Hits</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Avg</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Singles</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Doubles</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Triples</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>HRs</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Dimes</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>GP</th>
                </tr>
              </thead>
              <tbody>
                {teamPlayers.map(p => (
                  <tr key={p.id} style={rowStyle}>
                    <td style={{ ...cellStyle, paddingLeft: 18 }}>{p.name}</td>
                    <td style={{ ...cellStyle, textAlign: 'center' }}>{p.AtBats ?? 0}</td>
                    <td style={{ ...cellStyle, textAlign: 'center' }}>{p.hits ?? 0}</td>
                    <td style={{ ...cellStyle, textAlign: 'center' }}>{fmtAvg(p.Avg)}</td>
                    <td style={{ ...cellStyle, textAlign: 'center' }}>{p.Singles ?? 0}</td>
                    <td style={{ ...cellStyle, textAlign: 'center' }}>{p.Doubles ?? 0}</td>
                    <td style={{ ...cellStyle, textAlign: 'center' }}>{p.Triples ?? 0}</td>
                    <td style={{ ...cellStyle, textAlign: 'center' }}>{p.HRs ?? 0}</td>
                    <td style={{ ...cellStyle, textAlign: 'center' }}>{p.Dimes ?? 0}</td>
                    <td style={{ ...cellStyle, textAlign: 'center' }}>{p.GP ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
};

const ResultsView = ({ season }) => {
  const [results, setResults] = useState([]);
  useEffect(() => {
    let mounted = true;
    fetchWithToken(`/routes/archive/results?season=${encodeURIComponent(season)}&limit=10000`, { method: 'GET' })
      .then(res => res.ok ? res.json() : [])
      .then(data => { if (mounted) setResults(Array.isArray(data) ? data : []); })
      .catch(() => { if (mounted) setResults([]); });
    return () => { mounted = false; };
  }, [season]);

  return (
    <div style={tableWrap}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Date</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Game</th>
            <th style={thStyle}>Team 1</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Score</th>
            <th style={thStyle}>Team 2</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Score</th>
          </tr>
        </thead>
        <tbody>
          {results.map(r => (
            <tr key={r.id} style={rowStyle}>
              <td style={{ ...cellStyle, paddingLeft: 18 }}>{r.date}</td>
              <td style={{ ...cellStyle, textAlign: 'center' }}>{r.game_number}</td>
              <td style={cellStyle}>{r.team1_name}</td>
              <td style={{ ...cellStyle, textAlign: 'center' }}>{r.team1_score}</td>
              <td style={cellStyle}>{r.team2_name}</td>
              <td style={{ ...cellStyle, textAlign: 'center' }}>{r.team2_score}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {results.length === 0 && <p style={{ color: '#9fb0bd', padding: 12 }}>No results found for this season.</p>}
    </div>
  );
};

const Archive = () => {
  const [seasons, setSeasons] = useState([]);
  const [season, setSeason] = useState('');
  const [view, setView] = useState('standings');
  const [loadingSeasons, setLoadingSeasons] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    fetchWithToken('/routes/archive/seasons', { method: 'GET' })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (!mounted) return;
        const list = Array.isArray(data) ? data : [];
        setSeasons(list);
        if (list.length > 0) setSeason(list[0].season);
      })
      .catch(() => { if (mounted) setSeasons([]); })
      .finally(() => { if (mounted) setLoadingSeasons(false); });
    return () => { mounted = false; };
  }, []);

  return (
    <div ref={containerRef} data-printable style={containerStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ margin: 0, color: '#fff' }}>Past Seasons</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {seasons.length > 0 && (
            <select
              value={season}
              onChange={e => setSeason(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', fontSize: 14 }}
            >
              {seasons.map(s => (
                <option key={s.season} value={s.season}>{s.season}</option>
              ))}
            </select>
          )}
          <button
            className="no-print"
            onClick={() => printElement(containerRef.current)}
            style={{ padding: '6px 10px', cursor: 'pointer', borderRadius: 6, border: 'none', background: '#c2410c', color: '#fff' }}
          >
            Print
          </button>
        </div>
      </div>

      <div style={accentBar} />
      <div style={{ height: 12 }} />

      {loadingSeasons && <p style={{ color: '#9fb0bd' }}>Loading seasons…</p>}

      {!loadingSeasons && seasons.length === 0 && (
        <p style={{ color: '#9fb0bd' }}>No archived seasons yet — check back after the current season wraps up.</p>
      )}

      {!loadingSeasons && seasons.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <Tab active={view === 'standings'} onClick={() => setView('standings')}>Standings</Tab>
            <Tab active={view === 'players'} onClick={() => setView('players')}>Players</Tab>
            <Tab active={view === 'results'} onClick={() => setView('results')}>Results</Tab>
          </div>

          {view === 'standings' && <StandingsView season={season} />}
          {view === 'players' && <PlayersView season={season} />}
          {view === 'results' && <ResultsView season={season} />}
        </>
      )}
    </div>
  );
};

export default Archive;
