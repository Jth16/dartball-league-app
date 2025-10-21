import React, { useState } from 'react';

const TeamAdmin = ({ apiBase, downloadToken, setTeams }) => {
  const [newTeamName, setNewTeamName] = useState('');
  const [message, setMessage] = useState('');

  const handleAddTeam = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await fetch(`${apiBase}/routes/admin/add_team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Download-Token': downloadToken || '' },
        body: JSON.stringify({ name: newTeamName }),
      });
      const text = await res.text();
      if (!res.ok) {
        setMessage(`Error: ${res.status} ${text}`);
        return;
      }
      setMessage('Team added');
      setNewTeamName('');

      // refresh teams in parent if callback provided
      if (typeof setTeams === 'function') {
        try {
          const teamsRes = await fetch(`${apiBase}/routes/teams`);
          if (teamsRes.ok) setTeams(await teamsRes.json());
        } catch (err) {
          console.error('refresh teams after add', err);
        }
      }
    } catch (err) {
      console.error('add team', err);
      setMessage('Request failed');
    }
  };

  return (
    <section>
      <h2>Team Admin</h2>
      <form onSubmit={handleAddTeam}>
        <div>
          <label>New Team Name</label>
          <input value={newTeamName} onChange={e => setNewTeamName(e.target.value)} required />
        </div>
        <button type="submit">Add Team</button>
        {message && <p>{message}</p>}
      </form>
    </section>
  );
};

export default TeamAdmin;