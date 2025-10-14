
from typing import Dict, Any, List
import json
from pathlib import Path

DATA = Path(__file__).resolve().parents[1] / "data" / "state.json"

DEFAULT = {
    "watchlist": ["MSFT", "NVDA", "BP.L", "ULVR.L", "III.L", "INRG.L", "EMIM.L"]
}

def _ensure():
    DATA.parent.mkdir(parents=True, exist_ok=True)
    if not DATA.exists():
        DATA.write_text(json.dumps(DEFAULT, indent=2))

def get_state() -> Dict[str, Any]:
    _ensure()
    return json.loads(DATA.read_text())

def add_watch(symbol: str):
    s = get_state()
    sym = symbol.upper()
    if sym not in s["watchlist"]:
        s["watchlist"].append(sym)
        DATA.write_text(json.dumps(s, indent=2))
    return s

def remove_watch(symbol: str):
    s = get_state()
    sym = symbol.upper()
    s["watchlist"] = [t for t in s["watchlist"] if t != sym]
    DATA.write_text(json.dumps(s, indent=2))
    return s
