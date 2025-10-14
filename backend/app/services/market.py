
import yfinance as yf
from typing import List, Dict, Any

def get_quotes(symbols: List[str]) -> Dict[str, Any]:
    out = {}
    for s in symbols:
        t = yf.Ticker(s)
        info = t.info if isinstance(t.info, dict) else {}
        price = None
        try:
            hist = t.history(period="1d", interval="1m", auto_adjust=True)
            if not hist.empty:
                price = float(hist["Close"].dropna().iloc[-1])
        except Exception:
            # fallback
            try:
                price = float(info.get("currentPrice"))
            except Exception:
                price = None
        out[s] = {
            "symbol": s,
            "price": price,
            "currency": info.get("currency", "USD"),
            "shortName": info.get("shortName", None),
        }
    return out

def get_history(symbol: str, period: str, interval: str):
    t = yf.Ticker(symbol)
    hist = t.history(period=period, interval=interval, auto_adjust=True)
    bars = [
        {"t": int(ts.timestamp()*1000), "o": float(r["Open"]), "h": float(r["High"]),
         "l": float(r["Low"]), "c": float(r["Close"]), "v": float(r["Volume"])}
        for ts, r in hist.iterrows()
    ]
    return {"symbol": symbol.upper(), "bars": bars}

def get_sparkline(symbol: str, period: str, interval: str):
    t = yf.Ticker(symbol)
    hist = t.history(period=period, interval=interval, auto_adjust=True)
    closes = [float(r["Close"]) for _, r in hist.iterrows()]
    return {"symbol": symbol.upper(), "closes": closes[-60:]}

def get_info(symbol: str):
    t = yf.Ticker(symbol)
    info = t.info if isinstance(t.info, dict) else {}
    keys = ["shortName", "longName", "sector", "industry", "marketCap", "currency"]
    return {k: info.get(k) for k in keys}
