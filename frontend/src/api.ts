import axios from "axios";
const api = axios.create({ baseURL: "/api" });

// Toggle this to true if you want hardcoded sample data for UI work
const MOCK = false;

const SAMPLE_WATCH = ["MSFT","NVDA","BP.L","ULVR.L","III.L","INRG.L","EMIM.L"];
const SAMPLE_QUOTES: any = Object.fromEntries(SAMPLE_WATCH.map(s => [s, { symbol: s, price: 123.45, currency: s.endsWith(".L") ? "GBp" : "USD" }]));
const SAMPLE_SPARK = Array.from({length: 40}).map((_,i)=> 100 + Math.sin(i/4)*3 + i*0.2);
const SAMPLE_HISTORY = (symbol:string) => ({
  symbol, bars: Array.from({length: 250}).map((_,i) => {
    const t = Date.now() - (250-i)*86400000;
    const o = 100 + i*0.2; const h=o+2; const l=o-2; const c=o+Math.sin(i/5);
    return { t, o, h, l, c, v: 1000000 };
  })
});
const SAMPLE_FORECAST = (symbol:string) => {
  const n = 252; const mid = 150; const p50 = Array.from({length:n},(_,i)=> mid + i*0.3);
  const p10 = p50.map(v=>v-10); const p90 = p50.map(v=>v+10);
  return { symbol, p10, p50, p90 };
};

export const getState = async () => {
  if (MOCK) return { watchlist: SAMPLE_WATCH };
  try { return (await api.get("/state")).data; }
  catch { return { watchlist: SAMPLE_WATCH }; }
};
export const addWatch = (symbol: string) => api.post("/watchlist/add", null, { params: { symbol } }).then(r=>r.data);
export const removeWatch = (symbol: string) => api.post("/watchlist/remove", null, { params: { symbol } }).then(r=>r.data);

export const quotes = async (syms: string[]) => {
  if (MOCK) return Object.fromEntries(syms.map(s => [s, SAMPLE_QUOTES[s] || SAMPLE_QUOTES["MSFT"]]));
  try { return (await api.get("/quote", { params: { tickers: syms.join(",") }})).data; }
  catch { return Object.fromEntries(syms.map(s => [s, SAMPLE_QUOTES[s] || SAMPLE_QUOTES["MSFT"]])); }
};
export const history = async (symbol: string, period="1y", interval="1d") => {
  if (MOCK) return SAMPLE_HISTORY(symbol);
  try { return (await api.get("/history", { params: { ticker: symbol, period, interval }})).data; }
  catch { return SAMPLE_HISTORY(symbol); }
};
export const spark = async (symbol: string, period="6mo", interval="1d") => {
  if (MOCK) return { symbol, closes: SAMPLE_SPARK };
  try { return (await api.get("/sparkline", { params: { ticker: symbol, period, interval }})).data; }
  catch { return { symbol, closes: SAMPLE_SPARK }; }
};
export const info = (symbol: string) => api.get("/info", { params: { ticker: symbol }}).then(r=>r.data);
export const forecast = async (symbol: string, paths=200, days=252) => {
  if (MOCK) return SAMPLE_FORECAST(symbol);
  try { return (await api.get("/forecast", { params: { ticker: symbol, paths, days }})).data; }
  catch { return SAMPLE_FORECAST(symbol); }
};

// portfolio (kept real; you can mock similarly if needed)
export const listHoldings = () => api.get("/portfolio/holdings").then(r=>r.data);
export const upsertHolding = (symbol: string, quantity: number, avg_cost: number, currency="GBP") =>
  api.post("/portfolio/holdings/upsert", null, { params: { symbol, quantity, avg_cost, currency }}).then(r=>r.data);
export const removeHolding = (symbol: string) => api.post("/portfolio/holdings/remove", null, { params: { symbol }}).then(r=>r.data);
export const metrics = () => api.get("/portfolio/metrics").then(r=>r.data);
export const listTx = () => api.get("/portfolio/transactions").then(r=>r.data);
export const addTx = (symbol: string, qty: number, price: number, side="BUY", currency="GBP") =>
  api.post("/portfolio/transactions/add", null, { params: { symbol, qty, price, side, currency }}).then(r=>r.data);
