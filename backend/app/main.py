
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .services.state import get_state, add_watch, remove_watch
from .services.market import get_quotes, get_history, get_sparkline, get_info
from .services.portfolio import (
    init_db, list_holdings, upsert_holding, remove_holding, portfolio_metrics, list_transactions, add_transaction
)
from .services.forecast import forecast_paths

app = FastAPI(title="Balanced Global Stock Tracker API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- bootstrap db ---
init_db()

@app.get("/state")
def api_state():
    return get_state()

# Watchlist
@app.post("/watchlist/add")
def api_watch_add(symbol: str):
    return add_watch(symbol)

@app.post("/watchlist/remove")
def api_watch_remove(symbol: str):
    return remove_watch(symbol)

# Market data
@app.get("/quote")
def api_quotes(tickers: str):
    syms = [s.strip() for s in tickers.split(",") if s.strip()]
    if not syms:
        raise HTTPException(400, "No tickers provided")
    return get_quotes(syms)

@app.get("/history")
def api_history(ticker: str, period: str = "1y", interval: str = "1d"):
    return get_history(ticker, period, interval)

@app.get("/sparkline")
def api_sparkline(ticker: str, period: str = "6mo", interval: str = "1d"):
    return get_sparkline(ticker, period, interval)

@app.get("/info")
def api_info(ticker: str):
    return get_info(ticker)

# Portfolio
@app.get("/portfolio/holdings")
def api_holdings():
    return list_holdings()

@app.post("/portfolio/holdings/upsert")
def api_upsert_holding(symbol: str, quantity: float, avg_cost: float, currency: str = "GBP"):
    return upsert_holding(symbol, quantity, avg_cost, currency)

@app.post("/portfolio/holdings/remove")
def api_remove_holding(symbol: str):
    return remove_holding(symbol)

@app.get("/portfolio/metrics")
def api_metrics():
    return portfolio_metrics()

@app.get("/portfolio/transactions")
def api_list_transactions():
    return list_transactions()

@app.post("/portfolio/transactions/add")
def api_add_transaction(symbol: str, qty: float, price: float, side: str = "BUY", currency: str = "GBP"):
    return add_transaction(symbol, qty, price, side, currency)

# Forecasting
@app.get("/forecast")
def api_forecast(ticker: str, paths: int = 200, days: int = 252):
    return forecast_paths(ticker, paths=paths, days=days)
