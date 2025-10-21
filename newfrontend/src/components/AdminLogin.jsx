import React, { useEffect, useState } from 'react';
import LoginForm from './LoginForm';
import RecordAdmin from './RecordAdmin';
import TeamAdmin from './TeamAdmin';
import AddPlayer from './AddPlayer';
import DeleteTeam from './DeleteTeam';
import UpdatePlayerRecord from './UpdatePlayerRecord';
import { fetchWithToken } from '../api';

const API_BASE = process.env.REACT_APP_API_URL || 'https://dartball-backend-654879525708.us-central1.run.app';
const DOWNLOAD_TOKEN = process.env.REACT_APP_DOWNLOAD_TOKEN || '';

const AdminLogin = () => {
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchWithToken('/routes/teams', { method: 'GET' });
        if (res.ok) setTeams(await res.json());
      } catch (err) {
        console.error('fetch teams', err);
      }
    })();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <LoginForm apiBase={API_BASE} />
      <hr />
      <RecordAdmin teams={teams} setTeams={setTeams} apiBase={API_BASE} downloadToken={DOWNLOAD_TOKEN} />
      <hr />
      <TeamAdmin apiBase={API_BASE} downloadToken={DOWNLOAD_TOKEN} />
      <hr />
      <AddPlayer teams={teams} />
      <hr />
      <DeleteTeam teams={teams} setTeams={setTeams} />
      <hr />
      <UpdatePlayerRecord teams={teams} />
    </div>
  );
};

export default AdminLogin;