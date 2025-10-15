from typing import List, Dict, Any, Optional, Tuple
import time
import os
import logging
import re

import yfinance as yf
import pandas as pd
import httpx
from dotenv import load_dotenv

# ------------------------------------------------------------------------------
# Setup
# ------------------------------------------------------------------------------
log = logging.getLogger("market")
load_dotenv()
ALPHA_KEY = os.getenv("ALPHAVANTAGE_API_KEY", "").strip()

# Pretty names (extend as you add tickers)
NAME_MAP: Dict[str, str] = {
    "MSFT": "Microsoft Corporation",
    "NVDA": "NVIDIA Corporation",
    "BP.L": "BP p.l.c.",
    "ULVR.L": "Unilever PLC",
    "III.L": "3i Group plc",
    "INRG.L": "iShares Global Clean Energy UCITS ETF",
    "EMIM.L": "iShares Core MSCI EM IMI UCITS ETF",
}

# Cache (60s)
_CACHE: Dict[Tuple[str, ...], Tuple[float, Dict[str, Any]]] = {}
_TTL = 60.0

# Sparkline cache (per symbol)
_SPARK_CACHE: Dict[str, Tuple[float, Dict[str, Any]]] = {}
_SPARK_TTL = 15 * 60  # 15 minutes

# ---------- Per-symbol quote cache ----------
QUOTE_CACHE: Dict[str, Tuple[float, Dict[str, Any]]] = {}
QUOTE_TTL = 5 * 60  # 5 minutes

# Throttles - increased to avoid rate limits
_RATE_DELAY = 2.0        # seconds between Alpha calls (increased)
_RETRIES = 2             # reduce retries 
_BACKOFF = 3.0           # increase backoff time

def _qcache_get(sym: str) -> Optional[Dict[str, Any]]:
    hit = QUOTE_CACHE.get(sym)
    if not hit:
        return None
    ts, payload = hit
    if time.time() - ts > QUOTE_TTL:
        return None
    return payload

def _qcache_set(sym: str, payload: Dict[str, Any]):
    QUOTE_CACHE[sym] = (time.time(), payload)

# Throttles
_RATE_DELAY = 2.0        # seconds between Alpha calls (was 1.2)
_RETRIES = 2             # reduce retries (was 3)
_BACKOFF = 3.0           # increase backoff time (was 2.0)

# ------------------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------------------
def _guess_currency(symbol: str) -> str:
    return "GBp" if symbol.endswith(".L") else "USD"

def _name_for(symbol: str) -> str:
    return NAME_MAP.get(symbol, symbol)

def _cache_get(key: Tuple[str, ...]) -> Optional[Dict[str, Any]]:
    hit = _CACHE.get(key)
    if not hit:
        return None
    ts, payload = hit
    if time.time() - ts > _TTL:
        return None
    return payload

def _cache_set(key: Tuple[str, ...], payload: Dict[str, Any]):
    _CACHE[key] = (time.time(), payload)

def _spark_cache_get(sym: str) -> Optional[Dict[str, Any]]:
    hit = _SPARK_CACHE.get(sym)
    if not hit:
        return None
    ts, payload = hit
    if time.time() - ts > _SPARK_TTL:
        return None
    return payload

def _spark_cache_set(sym: str, payload: Dict[str, Any]):
    _SPARK_CACHE[sym] = (time.time(), payload)

def _alpha_symbol(symbol: str) -> str:
    s = symbol.upper()
    if s.endswith(".L"):   # Alpha uses .LON for LSE
        return s.replace(".L", ".LON")
    return s

def _alpha_fetch(symbol: str, client: httpx.Client) -> Dict[str, Optional[float]]:
    """
    Fetch live quote from Alpha Vantage GLOBAL_QUOTE with backoff on rate limit.
    Returns dict: price, prevClose, changeAbs, changePct.
    """
    if not ALPHA_KEY:
        return {"price": None, "prevClose": None, "changeAbs": None, "changePct": None}

    sym = _alpha_symbol(symbol)
    url = "https://www.alphavantage.co/query"
    params = {"function": "GLOBAL_QUOTE", "symbol": sym, "apikey": ALPHA_KEY}

    for attempt in range(_RETRIES):
        try:
            r = client.get(url, params=params, timeout=10.0)
            r.raise_for_status()
            js = r.json()

            # Alpha rate-limit returns a "Note"
            if isinstance(js, dict) and "Note" in js:
                wait = _BACKOFF * (attempt + 1)
                log.warning(f"Alpha limit note for {sym}; backing off {wait:.1f}s")
                time.sleep(wait)
                continue

            q = js.get("Global Quote", {}) or {}
            # Alpha fields are strings; parse safely
            def f(key: str) -> Optional[float]:
                try:
                    return float(str(q.get(key, "")).strip())
                except Exception:
                    return None

            price = f("05. price")
            prev  = f("08. previous close")
            chg   = f("09. change")
            pct_raw = q.get("10. change percent")
            pct = None
            if isinstance(pct_raw, str) and pct_raw.endswith("%"):
                try:
                    pct = float(pct_raw.rstrip("%").strip())
                except Exception:
                    pct = None

            # Derive pct if missing
            if pct is None and price is not None and prev:
                pct = (price - prev) / prev * 100.0

            if price is not None:
                return {"price": price, "prevClose": prev, "changeAbs": chg, "changePct": pct}

            # If no price, short delay and retry
            time.sleep(_BACKOFF * (attempt + 1))
        except Exception as e:
            log.debug(f"Alpha fetch error for {sym}: {e}")
            time.sleep(_BACKOFF * (attempt + 1))

    return {"price": None, "prevClose": None, "changeAbs": None, "changePct": None}

# Mock data for development when APIs fail
MOCK_DATA = {
    "MSFT": {"price": 415.50, "prev": 412.30},
    "NVDA": {"price": 875.25, "prev": 869.10},
    "BP.L": {"price": 450.20, "prev": 448.50},
    "ULVR.L": {"price": 4850.00, "prev": 4832.00},
    "III.L": {"price": 2680.00, "prev": 2655.00},
    "INRG.L": {"price": 485.60, "prev": 483.20},
    "EMIM.L": {"price": 2150.00, "prev": 2145.00},
}

def _fetch_daily_safely(symbol: str, period: str = "5d", interval: str = "1d") -> Tuple[Optional[float], Optional[float]]:
    """
    Try multiple strategies to get live price data with proper rate limiting.
    """
    log.info(f"Fetching live data for {symbol}")
    
    # Add a small delay before any Yahoo Finance call
    time.sleep(1.0)
    
    # Strategy 1: yfinance fast_info (lightest call)
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.fast_info
        if hasattr(info, 'last_price') and info.last_price:
            current_price = float(info.last_price)
            prev_close = float(info.previous_close) if hasattr(info, 'previous_close') and info.previous_close else None
            log.info(f"fast_info success for {symbol}: current={current_price}")
            return current_price, prev_close
    except Exception as e:
        if "429" in str(e) or "Too Many Requests" in str(e):
            log.warning(f"Yahoo rate limit hit for {symbol}, waiting longer...")
            time.sleep(5.0)  # Wait 5 seconds on rate limit
        log.debug(f"fast_info failed for {symbol}: {e}")
    
    # Strategy 2: History with longer delays
    try:
        time.sleep(2.0)  # Longer delay
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period="5d", interval="1d", timeout=30)
        
        if not hist.empty and "Close" in hist.columns:
            closes = hist["Close"].dropna()
            if not closes.empty:
                last = float(closes.iloc[-1])
                prev = float(closes.iloc[-2]) if len(closes) >= 2 else None
                log.info(f"history success for {symbol}: last={last}")
                return last, prev
    except Exception as e:
        if "429" in str(e) or "Too Many Requests" in str(e):
            log.error(f"Yahoo Finance rate limit exceeded for {symbol}")
        log.debug(f"history failed for {symbol}: {e}")
    
    log.warning(f"All live data methods failed for {symbol} - likely rate limited")
    return None, None

# Mock data for development when APIs fail
MOCK_DATA = {
    "MSFT": {"price": 415.50, "prev": 412.30},
    "NVDA": {"price": 875.25, "prev": 869.10},
    "BP.L": {"price": 450.20, "prev": 448.50},
    "ULVR.L": {"price": 4850.00, "prev": 4832.00},
    "III.L": {"price": 2680.00, "prev": 2655.00},
    "INRG.L": {"price": 485.60, "prev": 483.20},
    "EMIM.L": {"price": 2150.00, "prev": 2145.00},
}

def get_quotes(symbols: List[str]) -> Dict[str, Any]:
    syms = [s.upper() for s in symbols if s and s.strip()]
    log.info(f"get_quotes called with: {syms}")
    out: Dict[str, Any] = {}
    
    # Check if we're likely rate limited by counting recent failures
    rate_limited = False

    for idx, s in enumerate(syms):
        log.info(f"Processing symbol: {s}")
        
        # 1) Check cache first (more important when rate limited)
        cached = _qcache_get(s)
        if cached and cached.get("price") is not None:
            # Accept even slightly stale data if we're rate limited
            if not cached.get("stale", False) or rate_limited:
                log.info(f"Serving {s} from cache (rate_limited={rate_limited})")
                out[s] = cached
                continue

        # Add delay between symbols to avoid rate limiting
        if idx > 0:
            time.sleep(3.0)  # 3 second delay between symbols

        # 2) Try live data
        last, prev = _fetch_daily_safely(s, period="5d", interval="1d")
        
        if last is not None:
            chg = (last - prev) if prev else None
            pct = (chg / prev * 100.0) if (chg is not None and prev) else None
            payload = {
                "symbol": s,
                "shortName": _name_for(s),
                "currency": _guess_currency(s),
                "price": last,
                "prevClose": prev,
                "changeAbs": chg,
                "changePct": pct,
                "source": "yf",
                "stale": False,
            }
            _qcache_set(s, payload)
            out[s] = payload
            log.info(f"Live data success for {s}")
            continue
        else:
            rate_limited = True  # Assume we're rate limited if data fails

        # 3) Use mock data with clear indication it's fallback
        if s in MOCK_DATA:
            mock = MOCK_DATA[s]
            chg = mock["price"] - mock["prev"]
            pct = (chg / mock["prev"]) * 100.0
            payload = {
                "symbol": s,
                "shortName": _name_for(s),
                "currency": _guess_currency(s),
                "price": mock["price"],
                "prevClose": mock["prev"],
                "changeAbs": chg,
                "changePct": pct,
                "source": "mock_fallback",  # Clear indication
                "stale": True,  # Mark as stale so UI can show this
            }
            _qcache_set(s, payload)
            out[s] = payload
            log.warning(f"Using mock fallback for {s} due to API limits")
            continue

        # 4) Last resort: return stale cache or empty
        if cached:
            stale_payload = dict(cached)
            stale_payload["stale"] = True
            out[s] = stale_payload
        else:
            out[s] = {
                "symbol": s,
                "shortName": _name_for(s),
                "currency": _guess_currency(s),
                "price": None,
                "prevClose": None,
                "changeAbs": None,
                "changePct": None,
                "source": "unavailable",
                "stale": True,
            }

    if rate_limited:
        log.error("Rate limiting detected - using fallback data. Try again in a few minutes.")
    
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
    """
    Sparkline via Alpha Vantage TIME_SERIES_DAILY_ADJUSTED (compact ~100 days).
    Falls back to yfinance if Alpha is unavailable. Cached 15 minutes.
    """
    sym_up = symbol.upper()
    cached = _spark_cache_get(sym_up)
    if cached:
        return cached

    closes: List[float] = []

    # ---- Alpha path ----
    if ALPHA_KEY:
        try:
            with httpx.Client() as client:
                params = {
                    "function": "TIME_SERIES_DAILY_ADJUSTED",
                    "symbol": _alpha_symbol(sym_up),
                    "outputsize": "compact",  # ~100 days
                    "apikey": ALPHA_KEY,
                }
                r = client.get("https://www.alphavantage.co/query", params=params, timeout=10.0)
                r.raise_for_status()
                js = r.json()
                # Handle rate-limit note
                if isinstance(js, dict) and "Note" in js:
                    # soft-fail to yfinance below
                    pass
                else:
                    ts = js.get("Time Series (Daily)", {}) or {}
                    # Alpha returns newest-first in keys; we want oldest->newest
                    dates = sorted(ts.keys())
                    for d in dates:
                        row = ts[d]
                        c = row.get("5. adjusted close") or row.get("4. close")  # prefer adjusted
                        if c is not None:
                            try:
                                closes.append(float(str(c)))
                            except Exception:
                                pass
        except Exception:
            pass

    # ---- Fallback to yfinance if Alpha didn't fill ----
    if not closes:
        try:
            t = yf.Ticker(sym_up)
            hist = t.history(period="6mo", interval="1d", auto_adjust=True)
            closes = [float(r["Close"]) for _, r in hist.iterrows()]
        except Exception:
            closes = []

    payload = {"symbol": sym_up, "closes": closes[-60:]}  # last ~60 points
    _spark_cache_set(sym_up, payload)
    return payload

def get_info(symbol: str):
    return {
        "shortName": _name_for(symbol),
        "longName": _name_for(symbol),
        "currency": _guess_currency(symbol),
        "sector": None,
        "industry": None,
        "marketCap": None,
    }

def _fetch_yahoo_web(symbol: str) -> Tuple[Optional[float], Optional[float]]:
    """
    Scrape Yahoo Finance web page as last resort for live data.
    """
    try:
        url = f"https://finance.yahoo.com/quote/{symbol}"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        with httpx.Client() as client:
            response = client.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            content = response.text
            
            # Look for price data in the HTML
            price_match = re.search(r'"regularMarketPrice":\{"raw":([\d.]+)', content)
            prev_match = re.search(r'"regularMarketPreviousClose":\{"raw":([\d.]+)', content)
            
            if price_match:
                current_price = float(price_match.group(1))
                prev_close = float(prev_match.group(1)) if prev_match else None
                log.info(f"Yahoo web scraping success for {symbol}: price={current_price}")
                return current_price, prev_close
                
    except Exception as e:
        log.debug(f"Yahoo web scraping failed for {symbol}: {e}")
    
    return None, None
