
# Balanced Global Stock Tracker (Local App)

Run locally with **FastAPI** backend + **React/Chakra** frontend.
Features:
- Live dashboard with sexy ticker cards (auto-refresh every 30s)
- Analytics page: 1Y candlesticks + Monte Carlo forecast (10/50/90% bands)
- Portfolio page: input holdings, see live P/L and totals
- Transactions page: record buys/sells
- Add/remove tickers via watchlist (`/api/state`, `/api/watchlist/*`)

## Quick Start (no Docker)

### Backend
```
cd backend
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Docs at http://localhost:8000/docs

### Frontend
```
cd frontend
npm install
npm run dev
```
Open http://localhost:5173

## With Docker
```
docker compose up --build
```

## Notes
- Data persists in `backend/app/data` (watchlist) and `backend/app/db` (SQLite portfolio.db)
- Forecasts use GBM from last 2y daily returns (toy model; not financial advice)
- You can preseed tickers in `backend/app/data/state.json`
