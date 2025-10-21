import React, { useState, useRef, useEffect } from 'react';
import { fetchWithToken } from '../api';

const ZERO_STATS = { Singles: 0, Doubles: 0, Triples: 0, Dimes: 0, HRs: 0, AtBats: 0 };

const UpdatePlayerRecord = ({ teams }) => {
  const [selectedTeam, setSelectedTeam] = useState('');
  const [players, setPlayers] = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [stats, setStats] = useState({ ...ZERO_STATS });
  const [message, setMessage] = useState({ text: '', type: '' }); // type: 'success' | 'error' | ''
  const msgTimerRef = useRef(null);

  useEffect(() => () => {
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
  }, []);

  const clearMessageAfter = (ms = 3000) => {
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
    msgTimerRef.current = setTimeout(() => setMessage({ text: '', type: '' }), ms);
  };

  // loadPlayers accepts keepSelection: if true, do not clear selectedPlayerId
  const loadPlayers = async (teamId, keepSelection = false) => {
    if (!keepSelection) {
      setPlayers([]);
      setSelectedPlayerId('');
      setStats({ ...ZERO_STATS });
    }
    if (!teamId) return;
    try {
      const res = await fetchWithToken(`/routes/players?team_id=${teamId}`, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        setPlayers(data);
      }
    } catch (err) { console.error('load players', err); }
  };

  const handlePlayerSelect = (id) => {
    setSelectedPlayerId(id);
    // do NOT prefill inputs with player's current values;
    // always default inputs to zeros when a player is selected
    setStats({ ...ZERO_STATS });
    setMessage({ text: '', type: '' });
  };

  const parseIntOrZero = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(Math.max(0, n)) : 0;
  };

  const handleChange = (k, v) => setStats(prev => ({ ...prev, [k]: parseIntOrZero(v) }));

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedPlayerId) {
      setMessage({ text: 'Select a player before updating', type: 'error' });
      clearMessageAfter();
      return;
    }
    setMessage({ text: 'Updating…', type: '' });
    try {
      const payload = { player_id: selectedPlayerId };
      Object.keys(stats).forEach(k => { payload[k] = stats[k]; });

      const res = await fetchWithToken('/routes/admin/update_player', { method: 'POST', body: JSON.stringify(payload) });
      const text = await res.text();
      if (!res.ok) {
        console.error('update_player failed', res.status, text);
        setMessage({ text: `Update failed (${res.status})`, type: 'error' });
        clearMessageAfter();
        return;
      }

      setMessage({ text: 'Player updated successfully', type: 'success' });
      clearMessageAfter(2500);

      // reset numeric inputs to zeros (keep selected player/team)
      setStats({ ...ZERO_STATS });

      // reload players for the team and keep the selected player so displayed values refresh
      if (selectedTeam) await loadPlayers(selectedTeam, true);
    } catch (err) {
      console.error('update player exception', err);
      setMessage({ text: 'Update failed (network)', type: 'error' });
      clearMessageAfter();
    }
  };

  // compute selected player's latest data from players array
  const selectedPlayer = players.find(p => String(p.id) === String(selectedPlayerId));

  // compact input style used for all numeric fields
  const inputStyle = {
    width: 60,
    padding: '6px 8px',
    textAlign: 'center',
    borderRadius: 6,
    border: '1px solid #cbd5e1',
    background: '#fff',
    fontSize: 14
  };

  // create a select style that matches inputs (keeps same visual)
  const selectStyle = {
    ...inputStyle,
    width: 220,
    textAlign: 'left',
    paddingLeft: 10,
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    backgroundImage: 'linear-gradient(45deg, transparent 50%, #000 50%), linear-gradient(135deg, #000 50%, transparent 50%)',
    backgroundPosition: 'calc(100% - 18px) calc(1em + 2px), calc(100% - 13px) calc(1em + 2px)',
    backgroundSize: '6px 6px, 6px 6px',
    backgroundRepeat: 'no-repeat'
  };

  // label text should be white per request
  const labelStyle = {
    fontSize: 12,
    marginBottom: 4,
    display: 'block',
    textAlign: 'center',
    color: '#ffffff'
  };

  const fieldWrapStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4
  };

  // align items center so update button sits inline with inputs
  const rowStyle = {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 12
  };

  // button uses header gradient to match site header
  const btnStyle = {
    height: 36,
    padding: '0 14px',
    borderRadius: 8,
    border: 'none',
    background: 'linear-gradient(90deg, rgb(124 68 32), rgb(212 109 6))',
    color: '#000000ff',
    fontWeight: 700,
    boxShadow: '0 6px 18px rgba(112, 83, 27, 0.18)',
    cursor: 'pointer',
    transition: 'transform 120ms ease',
    marginTop: 18
  };

  const msgStyle = {
    marginTop: 10,
    padding: '8px 12px',
    borderRadius: 8,
    color: message.type === 'success' ? '#064e3b' : (message.type === 'error' ? '#7f1d1d' : '#0f172a'),
    background: message.type === 'success' ? '#bbf7d0' : (message.type === 'error' ? '#fecaca' : 'transparent'),
    border: message.type ? '1px solid rgba(0,0,0,0.06)' : 'none'
  };

  const tableStyle = {
    marginTop: 14,
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 14
  };

  // header text in the table needs to be black
  const thStyle = {
    textAlign: 'left',
    padding: '6px 8px',
    background: '#f3f4f6',
    border: '1px solid #e5e7eb',
    color: '#000000'
  };

  const tdStyle = {
    padding: '6px 8px',
    border: '1px solid #e5e7eb'
  };

  return (
    <section>
      <h2 style={{ color: '#fff' }}>Update Player Record</h2>

      <div style={{ marginBottom: 8 }}>
        <label style={{ ...labelStyle, textAlign: 'left' }}>Team</label>
        <select
          value={selectedTeam}
          onChange={e => { setSelectedTeam(e.target.value); loadPlayers(e.target.value, false); }}
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

      {/* inputs remain visible even if no player selected; disabled until a player is chosen */}
      <form onSubmit={handleUpdate} style={{ marginTop: 6 }}>
        <div style={rowStyle}>
             <div style={fieldWrapStyle}>
            <label style={labelStyle}>AtBats</label>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              value={stats.AtBats}
              onChange={e => handleChange('AtBats', e.target.value)}
              style={inputStyle}
              disabled={!selectedPlayerId}
            />
          </div>
          <div style={fieldWrapStyle}>
            <label style={labelStyle}>Singles</label>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              value={stats.Singles}
              onChange={e => handleChange('Singles', e.target.value)}
              style={inputStyle}
              disabled={!selectedPlayerId}
            />
          </div>

          <div style={fieldWrapStyle}>
            <label style={labelStyle}>Doubles</label>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              value={stats.Doubles}
              onChange={e => handleChange('Doubles', e.target.value)}
              style={inputStyle}
              disabled={!selectedPlayerId}
            />
          </div>

          <div style={fieldWrapStyle}>
            <label style={labelStyle}>Triples</label>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              value={stats.Triples}
              onChange={e => handleChange('Triples', e.target.value)}
              style={inputStyle}
              disabled={!selectedPlayerId}
            />
          </div>

          <div style={fieldWrapStyle}>
            <label style={labelStyle}>HRs</label>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              value={stats.HRs}
              onChange={e => handleChange('HRs', e.target.value)}
              style={inputStyle}
              disabled={!selectedPlayerId}
            />
          </div>

  <div style={fieldWrapStyle}>
            <label style={labelStyle}>Dimes</label>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              value={stats.Dimes}
              onChange={e => handleChange('Dimes', e.target.value)}
              style={inputStyle}
              disabled={!selectedPlayerId}
            />
          </div>       

          <div style={fieldWrapStyle}>
            <button
              type="submit"
              style={btnStyle}
              onMouseDown={e => e.currentTarget.style.transform = 'translateY(1px)'}
              onMouseUp={e => e.currentTarget.style.transform = 'none'}
              disabled={!selectedPlayerId}
            >
              Update
            </button>
          </div>
        </div>
      </form>

      {/* display current values for selected player */}
      {selectedPlayer && (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Singles</th>
              <th style={thStyle}>Doubles</th>
              <th style={thStyle}>Triples</th>
              <th style={thStyle}>Dimes</th>
              <th style={thStyle}>HRs</th>
              <th style={thStyle}>AtBats</th>
              <th style={thStyle}>Hits</th>
              <th style={thStyle}>GP</th>
              <th style={thStyle}>Avg</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdStyle}>{selectedPlayer.name}</td>
                <td style={tdStyle}>{selectedPlayer.AtBats ?? 0}</td>
              <td style={tdStyle}>{selectedPlayer.Singles ?? 0}</td>
              <td style={tdStyle}>{selectedPlayer.Doubles ?? 0}</td>
              <td style={tdStyle}>{selectedPlayer.Triples ?? 0}</td>
              <td style={tdStyle}>{selectedPlayer.HRs ?? 0}</td>
            <td style={tdStyle}>{selectedPlayer.Dimes ?? 0}</td>
              <td style={tdStyle}>{selectedPlayer.hits ?? 0}</td> 
              <td style={tdStyle}>{selectedPlayer.GP ?? 0}</td>
              <td style={tdStyle}>{typeof selectedPlayer.Avg === 'number' ? selectedPlayer.Avg.toFixed(3).replace(/^0\./, '.') : (selectedPlayer.Avg ?? '0')}</td>
            </tr>
          </tbody>
        </table>
      )}

      {/* flash message moved below the displayed table */}
      <div aria-live="polite" style={{ marginTop: 12 }}>
        {message.text && <div style={msgStyle}>{message.text}</div>}
      </div>
    </section>
  );
};

export default UpdatePlayerRecord;