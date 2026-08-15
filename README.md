# ELD Trip Planner (Django + React)

Trip details (current / pickup / dropoff location, current 70hr/8day cycle used)
lo ke route map aur FMCSA-style daily log sheets nikalta hai.

- **Backend:** Django (single API endpoint, no DB) — geocodes locations via Nominatim,
  gets route via OSRM, runs a full HOS engine (11hr driving / 14hr window / 30-min break
  after 8hr driving / 10hr reset / 70hr-8day cap with 34hr restart / fueling every 1000mi /
  1hr pickup & dropoff).
- **Frontend:** React + Vite — Leaflet map + SVG-drawn daily log grids.

## Local Run

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py runserver
```
Runs on http://localhost:8000

### Frontend
```bash
cd frontend
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:8000
npm run dev
```
Runs on http://localhost:5173

## Deployment

**Frontend (Vercel):**
1. Push this repo to GitHub.
2. Vercel > New Project > select repo > Root Directory = `frontend`.
3. Add environment variable `VITE_API_URL` = your deployed backend URL.
4. Deploy.

**Backend (Render — free tier, since Django needs a real server, not Vercel serverless):**
1. Render > New Web Service > select repo > Root Directory = `backend`.
2. Build Command: `pip install -r requirements.txt`
3. Start Command: `gunicorn core.wsgi:application --bind 0.0.0.0:$PORT`
4. Deploy, then copy the live URL into the frontend's `VITE_API_URL`.

(Railway/Fly.io bhi easily kaam karenge — same build/start commands.)

## API

`POST /api/plan/`
```json
{ "current": "Chicago, IL", "pickup": "Indianapolis, IN", "dropoff": "Dallas, TX", "cycle_used": 10 }
```
Returns distance, total trip hours, route geometry, markers, and per-day log segments.

Explaination Part 1
https://www.loom.com/share/5022683f5c8b4096b33b852bbffb930d
Explaination Part 2
https://www.loom.com/share/faaf38330d1c4b5dae7863fc7e4a70b6

