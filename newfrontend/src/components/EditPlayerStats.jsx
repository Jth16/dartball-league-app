import React, { useState, useRef, useEffect } from 'react';
import { fetchWithToken } from '../api';

const FIELDS = ['AtBats', 'Singles', 'Doubles', 'Triples', 'HRs', 'Dimes', 'Errors', 'GP'];

const toInputs = (p) => Object.fromEntries(FIELDS.map(f => [f, String(p?.[f] ?? 0)]));

const parseIntOrZero = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(Math.max(0, n)) : 0;
};

const EditPlayerStats = ({ teams }) => {
  const [selectedTeam, setSelectedTeam] = useState('');
  const [players, setPlayers] = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [inputs, setInputs] = useState(toInputs(null));
  const [message, setMessage] = useState({ text: '', type: '' });
  const msgTimerRef = useRef(null);

  useEffect(() => () => {
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
  }, []);

  const flash = (text, type, ms = 3000) => {
    setMessage({ text, type });
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
    msgTimerRef.current = setTimeout(() => setMessage({ text: '', type: '' }), ms);
  };

  const loadPlayers = async (teamId) => {
    setPlayers([]);
    setSelectedPlayerId('');
    setInputs(toInputs(null));
    if (!teamId) return;
    try {
      const res = await fetchWithToken(`/routes/players?team_id=${teamId}`, { method: 'GET' });
      if (res.ok) setPlayers(await res.json());
    } catch (err) { console.error('load players', err); }
  };

  const handlePlayerSelect = (id) => {
    setSelectedPlayerId(id);
    setMessage({ text: '', type: '' });
    const p = players.find(x => String(x.id) === String(id));
    setInputs(toInputs(p));
  };

  const handleChange = (k, v) => setInputs(prev => ({ ...prev, [k]: v }));

  const selectedPlayer = players.find(p => String(p.id) === String(selectedPlayerId));

  // live preview of the values the server will compute
  const num = (k) => parseIntOrZero(inputs[k]);
  const previewHits = num('Singles') + num('Doubles') + num('Triples') + num('HRs');
  const previewAvg = num('AtBats') > 0 ? (previewHits / num('AtBats')).toFixed(3).replace(/^0\./, '.') : '.000';

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedPlayerId) {
      flash('Select a player before saving', 'error');
      return;
    }
    setMessage({ text: 'Saving…', type: '' });
    try {
      const payload = { player_id: selectedPlayerId };
      FIELDS.forEach(f => { payload[f] = num(f); });
      const res = await fetchWithToken('/routes/admin/set_player_stats', { method: 'POST', body: JSON.stringify(payload) });
      if (!res.ok) {
        console.error('set_player_stats failed', res.status, await res.text());
        flash(`Save failed (${res.status})`, 'error');
        return;
      }
      const { player } = await res.json();
      setPlayers(prev => prev.map(p => (String(p.id) === String(player.id) ? player : p)));
      setInputs(toInputs(player));
      flash('Player stats saved', 'success', 2500);
    } catch (err) {
      console.error('save player stats exception', err);
      flash('Save failed (network)', 'error');
    }
  };

  const inputStyle = {
    width: 60,
    padding: '6px 8px',
    textAlign: 'center',
    borderRadius: 6,
    border: '1px solid #cbd5e1',
    background: '#fff',
    fontSize: 14
  };

  const selectStyle = {
    ...inputStyle,
    width: 220,
    textAlign: 'left',
    paddingLeft: 10
  };

  const labelStyle = { fontSize: 12, marginBottom: 4, display: 'block', textAlign: 'center', color: '#ffffff' };
  const fieldWrapStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 };
  const rowStyle = { display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginTop: 12 };

  const btnStyle = {
    height: 36,
    padding: '0 14px',
    borderRadius: 8,
    border: 'none',
    background: 'linear-gradient(90deg, rgb(124 68 32), rgb(212 109 6))',
    color: '#fff',
    fontWeight: 700,
    cursor: selectedPlayerId ? 'pointer' : 'not-allowed',
    opacity: selectedPlayerId ? 1 : 0.6
  };

  const readoutStyle = { ...inputStyle, display: 'inline-block', background: 'transparent', color: '#fff', border: '1px dashed #9fb0c0' };

  const msgStyle = {
    marginTop: 10,
    padding: '8px 12px',
    borderRadius: 8,
    color: message.type === 'success' ? '#064e3b' : (message.type === 'error' ? '#7f1d1d' : '#cbd5e1'),
    background: message.type === 'success' ? '#bbf7d0' : (message.type === 'error' ? '#fecaca' : 'transparent')
  };

  return (
    <section>
      <h2 style={{ color: '#fff' }}>Edit Player Stats</h2>
      <p>Load a player, edit any stat, and save. Values are saved exactly as entered (not added to the existing totals); Hits and Avg are recalculated.</p>

      <div style={{ marginBottom: 8 }}>
        <label style={{ ...labelStyle, textAlign: 'left' }}>Team</label>
        <select
          value={selectedTeam}
          onChange={e => { setSelectedTeam(e.target.value); loadPlayers(e.target.value); }}
          style={selectStyle}
        >
          <option value="">Select team</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: 8 }}>
        <label style={{ ...labelStyle, textAlign: 'left' }}>Player</label>
        <select
          value={selectedPlayerId}
          onChange={e => handlePlayerSelect(e.target.value)}
          style={selectStyle}
        >
          <option value="">Select player</option>
          {players.map(p => <option key={p.id} value={p.id}>{p.name} (id:{p.id})</option>)}
        </select>
      </div>

      <form onSubmit={handleSave}>
        <div style={rowStyle}>
          {FIELDS.map(f => (
            <div key={f} style={fieldWrapStyle}>
              <label style={labelStyle}>{f}</label>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={inputs[f]}
                onChange={e => handleChange(f, e.target.value)}
                style={inputStyle}
                disabled={!selectedPlayerId}
              />
            </div>
          ))}
          <div style={fieldWrapStyle}>
            <label style={labelStyle}>Hits (auto)</label>
            <span style={readoutStyle}>{selectedPlayer ? previewHits : '-'}</span>
          </div>
          <div style={fieldWrapStyle}>
            <label style={labelStyle}>Avg (auto)</label>
            <span style={readoutStyle}>{selectedPlayer ? previewAvg : '-'}</span>
          </div>
          <button type="submit" style={btnStyle} disabled={!selectedPlayerId}>Save</button>
        </div>
      </form>

      <div aria-live="polite" style={{ marginTop: 12 }}>
        {message.text && <div style={msgStyle}>{message.text}</div>}
      </div>
    </section>
  );
};

export default EditPlayerStats;
