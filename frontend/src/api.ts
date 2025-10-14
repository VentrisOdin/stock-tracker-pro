
import axios from "axios";
const api = axios.create({ baseURL: "/api" });

export const getState = () => api.get("/state").then(r=>r.data);
export const addWatch = (symbol: string) => api.post("/watchlist/add", null, { params: { symbol } }).then(r=>r.data);
export const removeWatch = (symbol: string) => api.post("/watchlist/remove", null, { params: { symbol } }).then(r=>r.data);

export const quotes = (syms: string[]) => api.get("/quote", { params: { tickers: syms.join(",") }}).then(r=>r.data);
export const history = (symbol: string, period="1y", interval="1d") => api.get("/history", { params: { ticker: symbol, period, interval }}).then(r=>r.data);
export const spark = (symbol: string, period="6mo", interval="1d") => api.get("/sparkline", { params: { ticker: symbol, period, interval }}).then(r=>r.data);
export const info = (symbol: string) => api.get("/info", { params: { ticker: symbol }}).then(r=>r.data);
export const forecast = (symbol: string, paths=200, days=252) => api.get("/forecast", { params: { ticker: symbol, paths, days }}).then(r=>r.data);

// portfolio
export const listHoldings = () => api.get("/portfolio/holdings").then(r=>r.data);
export const upsertHolding = (symbol: string, quantity: number, avg_cost: number, currency="GBP") =>
  api.post("/portfolio/holdings/upsert", null, { params: { symbol, quantity, avg_cost, currency }}).then(r=>r.data);
export const removeHolding = (symbol: string) => api.post("/portfolio/holdings/remove", null, { params: { symbol }}).then(r=>r.data);
export const metrics = () => api.get("/portfolio/metrics").then(r=>r.data);

export const listTx = () => api.get("/portfolio/transactions").then(r=>r.data);
export const addTx = (symbol: string, qty: number, price: number, side="BUY", currency="GBP") =>
  api.post("/portfolio/transactions/add", null, { params: { symbol, qty, price, side, currency }}).then(r=>r.data);
