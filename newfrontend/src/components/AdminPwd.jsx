import React, { useState } from "react";

const AdminPwdPage = ({ setIsAdmin }) => {
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = e => {
    e.preventDefault();
    // Replace 'yourpassword' with your actual admin password
    if (pwd === "yourpassword") {
      setIsAdmin(true);
      setError("");
    } else {
      setError("Incorrect password.");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ textAlign: "center" }}>
      <h2>Admin Access</h2>
      <input
        type="password"
        value={pwd}
        onChange={e => setPwd(e.target.value)}
        placeholder="Enter admin password"
        style={{
          padding: "0.5rem 1rem",
          borderRadius: "8px",
          border: "1px solid #888",
          marginRight: "1rem",
        }}
      />
      <button
        type="submit"
        style={{
          padding: "0.5rem 1.5rem",
          borderRadius: "8px",
          background: "#ff9800",
          color: "#fff",
          border: "none",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        Enter
      </button>
      {error && <div style={{ color: "#ff4444", marginTop: "1rem" }}>{error}</div>}
    </form>
  );
};

export default AdminPwdPage;