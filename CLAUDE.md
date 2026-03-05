# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dartball League App — a full-stack web application for managing a dartball league (team standings, player statistics, game results). Live at ltvfdartball.com.

## Tech Stack

- **Frontend:** React 19 (CRA with react-scripts), React Router DOM 7, inline CSS styling
- **Backend:** Flask 2.2 (Python), Flask-SQLAlchemy, PostgreSQL (Google Cloud SQL)
- **Deployment:** Frontend on GitHub Pages, backend on Google Cloud Run (Docker/Gunicorn)

## Commands

### Frontend (`newfrontend/` directory — this is the active frontend)
```bash
npm start          # Dev server on http://localhost:3000
npm run build      # Production build to /build
npm test           # Jest + React Testing Library
npm run deploy     # Deploy to GitHub Pages via gh-pages (runs build first)
```

> **Note:** The root `src/` directory is an older version and is NOT served. All frontend work happens in `newfrontend/src/`.

### Backend (`backend/` directory)
```bash
pip install -r requirements.txt    # Install Python deps
python app.py                      # Dev server on http://0.0.0.0:8080
```

For production: `gunicorn --bind 0.0.0.0:8080 --timeout 300 app:app`

## Architecture

### Frontend (`newfrontend/src/`)

Single-page app using React Router DOM (`BrowserRouter`/`Routes`/`Route`). `App.jsx` also manages a `page` state variable to conditionally render content within the main route. Key components:

- **TeamsTable** — Computes standings from raw results (fetches both `/routes/teams` and `/routes/results?limit=10000`); does NOT rely on stored wins/losses in the teams table
- **PlayersTable** — Player stats grouped by team (Singles, Doubles, Triples, HRs, Avg, GP, AtBats)
- **Schedule** — Parses `public/Newest-Darts-Schedule.csv` (hand-edited CSV, not DB-driven)
- **Results** — Groups game results by date then matchup; uses UTC date normalization
- **Leaders / ResultLeaders / StatsPage** — Various stat leaderboard views
- **AdminLogin / AdminPwd** — Admin dashboard behind a simple password gate (`isAdmin` state, resets on navigation)
- **Home** — Landing page with news, payouts, Facebook embed

`api.js` exports `fetchWithToken()` which attaches the `X-Download-Token` header from env vars to all API requests. All components import from here for authenticated requests.

### Backend (`backend/`)

Flask app using blueprint pattern. All routes registered under the `/routes/` prefix:

- **app.py** — App initialization, CORS config, Cloud SQL database connection setup
- **routes.py** — All API endpoints as a Flask blueprint
- **models.py** — SQLAlchemy ORM models: `Team`, `Player`, `Result`

Key API routes:
- `GET /routes/teams` — All teams (standings stored in DB, but TeamsTable recomputes from results)
- `GET /routes/players?team_id=<id>` — Players for a team (omit for all players)
- `GET /routes/players/search?q=<query>&limit=200` — Case-insensitive partial match
- `GET /routes/results?date=<YYYY-MM-DD>&team_id=<id>&limit=500` — Game results, newest first
- `POST /routes/results/batch` — Batch create game results for a matchup
- `POST /routes/admin/update_player` — **Increments** stats (not absolute values); auto-computes `hits`, `Avg`, increments `GP`
- `POST /routes/admin/update_team_record` — **Increments** wins/losses (not absolute values)
- `POST /routes/admin/add_team`, `add_player`, `DELETE /routes/admin/delete_team`
- `GET /routes/admin/db_status` — Database connection health check

### Data Models

```
Team:   id, name, wins, losses, win_pct, games_behind, games_played
Player: id, name, team_id (FK), Singles, Doubles, Triples, Dimes, HRs, Avg, GP, AtBats, hits
Result: id, date, game_number, team1_id (FK), team2_id (FK), team1_score, team2_score
```

### Styling

Dark theme with orange (#ff9800) accents. All styling is inline CSS in JSX — no CSS framework or CSS modules. Common patterns:
- Background: `linear-gradient(180deg, #0d1b2a, #0b1520)`
- Nav: `linear-gradient(90deg, #232526 0%, #000000 100%)`
- Accent bar: `linear-gradient(90deg, #7a2b00, #c2410c, #ff8a00)`

### Authentication

Token-based: frontend sends `X-Download-Token` header (from `REACT_APP_DOWNLOAD_TOKEN` env var). Admin pages use a simple password gate (`AdminPwd` component) that sets an `isAdmin` state flag — resets whenever the user navigates away from the admin page.

## Environment Variables

**Frontend** (`newfrontend/.env.development` / `newfrontend/.env.production`):
- `REACT_APP_API_URL` — Backend API base URL
- `REACT_APP_DOWNLOAD_TOKEN` — Token for `X-Download-Token` auth header
- `REACT_APP_GA_ID` — Google Analytics measurement ID (`newfrontend/.env`)

**Backend** (runtime env):
- `SQLALCHEMY_DATABASE_URI` — Direct database URI (preferred over individual vars)
- `CLOUD_SQL_CONNECTION_NAME`, `DB_USER`, `DB_PASS`, `DB_NAME` — Cloud SQL config (fallback)
- `ALLOWED_ORIGINS` — Comma-separated CORS origins
- `DOWNLOAD_TOKEN` — Expected API auth token (validated against `X-Download-Token` header)
