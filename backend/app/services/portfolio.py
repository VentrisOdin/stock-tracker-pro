
from sqlmodel import Field, SQLModel, create_engine, Session, select
from typing import Optional, List, Dict, Any
from pathlib import Path

DB_PATH = Path(__file__).resolve().parents[1] / "db" / "portfolio.db"
engine = create_engine(f"sqlite:///{DB_PATH}", echo=False)

class Holding(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    symbol: str
    quantity: float
    avg_cost: float
    currency: str = "GBP"

class Transaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    symbol: str
    qty: float
    price: float
    side: str  # BUY or SELL
    currency: str = "GBP"

def init_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    SQLModel.metadata.create_all(engine)

def list_holdings() -> List[Holding]:
    with Session(engine) as s:
        return s.exec(select(Holding)).all()

def upsert_holding(symbol: str, quantity: float, avg_cost: float, currency: str = "GBP"):
    with Session(engine) as s:
        h = s.exec(select(Holding).where(Holding.symbol == symbol)).first()
        if h is None:
            h = Holding(symbol=symbol, quantity=quantity, avg_cost=avg_cost, currency=currency)
            s.add(h)
        else:
            h.quantity = quantity
            h.avg_cost = avg_cost
            h.currency = currency
        s.commit()
        s.refresh(h)
        return h

def remove_holding(symbol: str):
    with Session(engine) as s:
        h = s.exec(select(Holding).where(Holding.symbol == symbol)).first()
        if h:
            s.delete(h)
            s.commit()
        return {"ok": True}

def portfolio_metrics() -> Dict[str, Any]:
    # Simple placeholder metrics (extend later with quotes from market service)
    holds = list_holdings()
    total_cost = sum(h.quantity * h.avg_cost for h in holds)
    return {
        "total_positions": len(holds),
        "total_cost": total_cost,
        "best_earners": [],  # fill in frontend after fetching quotes
        "by_symbol": [h.dict() for h in holds],
    }

def list_transactions():
    with Session(engine) as s:
        return s.exec(select(Transaction)).all()

def add_transaction(symbol: str, qty: float, price: float, side: str, currency: str = "GBP"):
    with Session(engine) as s:
        t = Transaction(symbol=symbol, qty=qty, price=price, side=side.upper(), currency=currency)
        s.add(t)
        s.commit()
        s.refresh(t)
        return t
