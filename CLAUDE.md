# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dartball League App — a full-stack web application for managing a dartball league (team standings, player statistics, game results). Live at ltvfdartball.com.

## Tech Stack

- **Frontend:** React 19 (CRA with react-scripts), React Router DOM 7, inline CSS styling
- **Backend:** Flask 2.2 (Python), Flask-SQLAlchemy, PostgreSQL (Google Cloud SQL)
- **Deployment:** Frontend on GitHub Pages, backend on Google Cloud Run (Docker/Gunicorn)

## Commands

### Frontend (root directory)
```bash
npm start          # Dev server on http://localhost:3000
npm run build      # Production build to /build
npm test           # Jest + React Testing Library
npm run deploy     # Deploy to GitHub Pages via gh-pages
```

### Backend (backend/ directory)
```bash
pip install -r requirements.txt    # Install Python deps
python app.py                      # Dev server on http://0.0.0.0:8080
```

For production: `gunicorn --bind 0.0.0.0:8080 --timeout 300 app:app`

## Architecture

### Frontend (src/)

Single-page app using button-driven navigation (not React Router routes). `App.jsx` manages page state and conditionally renders page components:
- **TeamsTable** — Team standings (wins, losses, win%, games behind)
- **PlayersTable** — Player stats by team (Singles, Doubles, Triples, HRs, Avg)
- **Schedule** — Season schedule display
- **AdminLogin** / **AdminPwd** — Admin dashboard behind password gate

`api.js` exports `fetchWithToken()` which attaches the `X-Download-Token` header from env vars to all API requests.

The API base URL is configured via `REACT_APP_API_URL` in `.env.development` and `.env.production`.

### Backend (backend/)

Flask app using blueprint pattern:
- **app.py** — App initialization, CORS config, database connection setup
- **routes.py** — All API endpoints registered as a Flask blueprint at `/routes/`
- **models.py** — SQLAlchemy ORM models (Team, Player, Result)

Key API routes:
- `GET /routes/teams` — All teams with standings
- `GET /routes/players?team_id=<id>` — Players for a team
- `GET /routes/players/search?q=<query>` — Player search
- `POST /routes/results/batch` — Batch create game results
- `POST /routes/admin/*` — Admin operations (add/update teams, players)

Database connection is configured via `SQLALCHEMY_DATABASE_URI` env var (preferred) or individual `CLOUD_SQL_CONNECTION_NAME`, `DB_USER`, `DB_PASS`, `DB_NAME` env vars for Cloud SQL.

### Styling

Dark theme with orange (#ff9800) accents throughout. All styling is inline CSS in JSX — no CSS framework or CSS modules are used.

### Authentication

Token-based: frontend sends `X-Download-Token` header; admin pages use a simple password gate (`AdminPwd` component) that sets an `isAdmin` state flag (resets on navigation away).

## Environment Variables

**Frontend** (in .env.development / .env.production):
- `REACT_APP_API_URL` — Backend API base URL
- `REACT_APP_DOWNLOAD_TOKEN` — Token for API auth header

**Backend** (runtime env):
- `SQLALCHEMY_DATABASE_URI` — Direct database URI
- `CLOUD_SQL_CONNECTION_NAME`, `DB_USER`, `DB_PASS`, `DB_NAME` — Cloud SQL config
- `ALLOWED_ORIGINS` — Comma-separated CORS origins
- `DOWNLOAD_TOKEN` — Expected API auth token
