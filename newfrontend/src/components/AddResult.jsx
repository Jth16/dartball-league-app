import React, { useEffect, useState } from 'react';
import { fetchWithToken } from '../api';

const API_BASE = process.env.REACT_APP_API_URL || 'https://dartball-backend-654879525708.us-central1.run.app';

const fieldStyle = { padding: 8, margin: '6px 0', width: '100%', boxSizing: 'border-box' };
const labelStyle = { fontSize: 13, marginBottom: 6, display: 'block', color: '#fff' };
const containerStyle = { background: '#0b1620', padding: 16, borderRadius: 8, color: '#fff', marginTop: 12 };

const AddResult = () => {
  const [teams, setTeams] = useState([]);
  const [date, setDate] = useState(() => {
    const d = new Date(); return d.toISOString().slice(0,10);
  });
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [games, setGames] = useState([
    { game_number: 1, team1_score: '', team2_score: '' },
    { game_number: 2, team1_score: '', team2_score: '' },
    { game_number: 3, team1_score: '', team2_score: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/routes/teams`);
        const data = res.ok ? await res.json() : [];
        if (!mounted) return;
        setTeams(Array.isArray(data) ? data : []);
      } catch (e) {
        console.warn('load teams failed', e);
        setTeams([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const updateGameScore = (idx, side, val) => {
    const next = games.slice();
    next[idx] = { ...next[idx], [side]: val };
    setGames(next);
  };

  const validate = () => {
    if (!date) { setMessage('Please select a date'); return false; }
    if (!team1 || !team2) { setMessage('Please select both teams'); return false; }
    if (team1 === team2) { setMessage('Team 1 and Team 2 cannot be the same'); return false; }
    // at least one game must have numeric scores
    const any = games.some(g => g.team1_score !== '' || g.team2_score !== '');
    if (!any) { setMessage('Enter at least one game score'); return false; }
    return true;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!validate()) return;
    setLoading(true);

    // Build games payload (only include games where at least one score provided)
    const gamesPayload = games
      .map(g => ({
        game_number: g.game_number,
        team1_score: g.team1_score === '' ? 0 : Number(g.team1_score),
        team2_score: g.team2_score === '' ? 0 : Number(g.team2_score)
      }))
      .filter(g => !(g.team1_score === 0 && g.team2_score === 0));

    if (gamesPayload.length === 0) {
      setMessage('No game scores to submit.');
      setLoading(false);
      return;
    }

    const batchBody = {
      date,
      team1_id: Number(team1),
      team2_id: Number(team2),
      games: gamesPayload
    };

    try {
      const url = `/routes/results/batch`;
      const opts = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchBody)
      };
      const resp = (typeof fetchWithToken === 'function')
        ? await fetchWithToken(url, opts)
        : await fetch(`${API_BASE}${url}`, opts);

      if (!resp.ok) {
        const text = await resp.text().catch(() => null);
        throw new Error(`Status ${resp.status} ${text || ''}`);
      }
      const json = await resp.json();
      if (json && json.created && Array.isArray(json.created)) {
        setMessage('Results saved successfully.');
        setGames(games.map(g => ({ ...g, team1_score: '', team2_score: '' })));
      } else {
        setMessage('Saved (unexpected response). Check console.');
        console.info('batch result response', json);
      }
    } catch (err) {
      console.error('submit results failed', err);
      setMessage('Submit failed — check console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <h3 style={{ margin: 0 }}>Add Results (up to 3 games)</h3>
      <form onSubmit={onSubmit}>
        <div style={{ marginTop: 10 }}>
          <label style={labelStyle}>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={fieldStyle} />
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Team 1</label>
            <select value={team1} onChange={e => setTeam1(e.target.value)} style={fieldStyle}>
              <option value="">-- select team --</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Team 2</label>
            <select value={team2} onChange={e => setTeam2(e.target.value)} style={fieldStyle}>
              <option value="">-- select team --</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          {games.map((g, idx) => (
            <div key={g.game_number} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <div style={{ width: 72, fontWeight: 700 }}>Game {g.game_number}</div>
              <input
                placeholder="Team1 score"
                value={g.team1_score}
                onChange={e => updateGameScore(idx, 'team1_score', e.target.value.replace(/[^\d]/g, ''))}
                style={{ padding: 8, width: 120 }}
              />
              <span style={{ margin: '0 6px' }}>:</span>
              <input
                placeholder="Team2 score"
                value={g.team2_score}
                onChange={e => updateGameScore(idx, 'team2_score', e.target.value.replace(/[^\d]/g, ''))}
                style={{ padding: 8, width: 120 }}
              />
            </div>
          ))}
        </div>

        {message && <div style={{ marginTop: 8, color: '#ffd7a8' }}>{message}</div>}

        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={loading} style={{ padding: '8px 12px', background: '#c2410c', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            {loading ? 'Saving...' : 'Save Results'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddResult;