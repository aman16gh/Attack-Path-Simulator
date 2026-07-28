from pydantic import BaseModel
from typing import Optional, Dict, List

class AssetCreate(BaseModel):
    name: str
    type: str
    os: str
    ip: str
    subnet: str
    properties: Optional[Dict] = {}

class EdgeCreate(BaseModel):
    source_id: int
    target_id: int
    edge_type: str
    technique_id: Optional[str] = None
    cost: float = 1.0
    preconditions: Optional[Dict] = {}
    postconditions: Optional[Dict] = {}

class PathResult(BaseModel):
    path: List[str]
    total_cost: float
    steps: List[Dict]
    risk_score: float