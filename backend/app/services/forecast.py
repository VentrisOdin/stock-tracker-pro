
import numpy as np
import yfinance as yf

def forecast_paths(ticker: str, paths: int = 200, days: int = 252):
    # Geometric Brownian Motion using last ~2 years of daily returns to estimate mu, sigma
    t = yf.Ticker(ticker)
    hist = t.history(period="2y", interval="1d", auto_adjust=True)
    if hist.empty or len(hist) < 30:
        raise ValueError("Not enough history for forecast")
    prices = hist['Close'].astype(float).values
    returns = np.diff(np.log(prices))
    mu = float(np.mean(returns)) * 252.0
    sigma = float(np.std(returns)) * np.sqrt(252.0)
    s0 = float(prices[-1])

    dt = 1.0/252.0
    paths_arr = np.zeros((days+1, paths))
    paths_arr[0,:] = s0
    for tstep in range(1, days+1):
        z = np.random.standard_normal(paths)
        paths_arr[tstep,:] = paths_arr[tstep-1,:] * np.exp((mu - 0.5*sigma**2)*dt + sigma*np.sqrt(dt)*z)

    # Percentile bands
    p10 = np.percentile(paths_arr, 10, axis=1).tolist()
    p50 = np.percentile(paths_arr, 50, axis=1).tolist()
    p90 = np.percentile(paths_arr, 90, axis=1).tolist()
    return {"symbol": ticker.upper(), "mu": mu, "sigma": sigma, "s0": s0, "days": days, "p10": p10, "p50": p50, "p90": p90}
