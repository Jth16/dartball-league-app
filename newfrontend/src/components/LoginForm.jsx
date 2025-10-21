import React, { useState } from 'react';

const LoginForm = ({ apiBase }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${apiBase || 'https://dartball-backend-654879525708.us-central1.run.app'}/routes/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) window.location.href = '/admin-dashboard';
      else setError('Invalid username or password');
    } catch (err) {
      setError('Request failed');
    }
  };

  return (
    <section>
      <h2>Admin Login</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label>Username</label>
          <input value={username} onChange={e => setUsername(e.target.value)} />
        </div>
        <div>
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <button type="submit">Login</button>
        {error && <p>{error}</p>}
      </form>
    </section>
  );
};

export default LoginForm;