from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import engine, Base, SessionLocal
from models import Asset, Edge
from schemas import AssetCreate, EdgeCreate, PathResult
from graph_engine import find_shortest_path, get_critical_nodes

# Create tables if they don't exist (safe to call every time)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Attack Path Simulator")

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------- Asset CRUD ----------
@app.post("/assets")
def create_asset(asset: AssetCreate, db: Session = Depends(get_db)):
    # Check if name already exists
    if db.query(Asset).filter(Asset.name == asset.name).first():
        raise HTTPException(status_code=400, detail="Asset name already exists")
    db_asset = Asset(**asset.dict())
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    return {"id": db_asset.id, "name": db_asset.name}

@app.get("/assets")
def list_assets(db: Session = Depends(get_db)):
    assets = db.query(Asset).all()
    return assets

# ---------- Edge CRUD ----------
@app.post("/edges")
def create_edge(edge: EdgeCreate, db: Session = Depends(get_db)):
    # Ensure both assets exist
    src = db.query(Asset).filter(Asset.id == edge.source_id).first()
    tgt = db.query(Asset).filter(Asset.id == edge.target_id).first()
    if not src or not tgt:
        raise HTTPException(status_code=404, detail="Source or target asset not found")
    db_edge = Edge(**edge.dict())
    db.add(db_edge)
    db.commit()
    db.refresh(db_edge)
    return {"id": db_edge.id, "from": src.name, "to": tgt.name}

@app.get("/edges")
def list_edges(db: Session = Depends(get_db)):
    edges = db.query(Edge).all()
    return edges

# ---------- Attack Paths ----------
@app.get("/paths", response_model=PathResult)
def attack_path(source: str, target: str, db: Session = Depends(get_db)):
    try:
        result = find_shortest_path(db, source, target)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# ---------- Critical Nodes ----------
@app.get("/critical-nodes")
def critical_nodes(db: Session = Depends(get_db), limit: int = 5):
    return get_critical_nodes(db, top_n=limit)

# ---------- Root test ----------
@app.get("/")
def root():
    return {"message": "API is running"}