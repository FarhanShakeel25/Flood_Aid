# FloodAid Frontend — Local dev

## Requirements
- Node.js >= 16
- Backend running locally at http://localhost:5000 (or update .env)

## Quick start
1. cd frontend
2. npm install
3. Copy `.env.example` -> `.env` and set `REACT_APP_API_BASE`
4. npm run dev   # or npm start for CRA

## Test endpoint
- Backend health: GET /api/health  -> JSON {status:"ok", message:"backend reachable"}
