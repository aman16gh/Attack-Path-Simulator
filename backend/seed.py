from database import SessionLocal, engine, Base
from models import Asset, Edge
import json

# Ensure tables exist
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Clear previous data for clean restart (optional)
db.query(Edge).delete()
db.query(Asset).delete()
db.commit()

# Create assets
assets_data = [
    {"name": "PC1", "type": "workstation", "os": "Windows 10", "ip": "192.168.1.10", "subnet": "192.168.1.0/24",
     "properties": {"user": "john", "vulnerabilities": ["CVE-2021-34527"]}},
    {"name": "Switch", "type": "network_device", "os": "Firmware", "ip": "192.168.1.1", "subnet": "192.168.1.0/24", "properties": {}},
    {"name": "Server1", "type": "server", "os": "Windows Server 2019", "ip": "192.168.1.50", "subnet": "192.168.1.0/24",
     "properties": {"services": ["SMB", "RDP"], "vulnerabilities": ["CVE-2021-36934"]}},
    {"name": "DB", "type": "database", "os": "Linux", "ip": "192.168.1.100", "subnet": "192.168.1.0/24", "properties": {}},
    {"name": "WebServer", "type": "web_server", "os": "Linux", "ip": "192.168.1.200", "subnet": "192.168.1.0/24",
     "properties": {"services": ["HTTP", "HTTPS"], "vulnerabilities": ["SQL Injection"]}}
]

assets = []
for data in assets_data:
    asset = Asset(**data)
    db.add(asset)
    assets.append(asset)

db.commit()
# Refresh to get IDs
for a in assets:
    db.refresh(a)

# Helper to find asset by name
asset_by_name = {a.name: a.id for a in assets}

# Create edges (network connectivity)
edges_data = [
    # PC1 <-> Switch
    {"source_id": asset_by_name["PC1"], "target_id": asset_by_name["Switch"], "edge_type": "connected_to", "cost": 1, "technique_id": ""},
    {"source_id": asset_by_name["Switch"], "target_id": asset_by_name["PC1"], "edge_type": "connected_to", "cost": 1},
    # Switch <-> Server1
    {"source_id": asset_by_name["Switch"], "target_id": asset_by_name["Server1"], "edge_type": "connected_to", "cost": 1},
    {"source_id": asset_by_name["Server1"], "target_id": asset_by_name["Switch"], "edge_type": "connected_to", "cost": 1},
    # Switch <-> DB
    {"source_id": asset_by_name["Switch"], "target_id": asset_by_name["DB"], "edge_type": "connected_to", "cost": 1},
    {"source_id": asset_by_name["DB"], "target_id": asset_by_name["Switch"], "edge_type": "connected_to", "cost": 1},
    # Switch <-> WebServer
    {"source_id": asset_by_name["Switch"], "target_id": asset_by_name["WebServer"], "edge_type": "connected_to", "cost": 1},
    {"source_id": asset_by_name["WebServer"], "target_id": asset_by_name["Switch"], "edge_type": "connected_to", "cost": 1},
    # Lateral movement / exploit paths (add some realistic attack edges)
    # From PC1 user can authenticate to Server1 via SMB (Pass-the-Hash)
    {"source_id": asset_by_name["PC1"], "target_id": asset_by_name["Server1"], "edge_type": "can_exploit",
     "cost": 3, "technique_id": "T1550.002", "preconditions": {"user": "john"}, "postconditions": {"access": "user"}},
    # From Server1 to DB (SQL Server credential dump)
    {"source_id": asset_by_name["Server1"], "target_id": asset_by_name["DB"], "edge_type": "can_exploit",
     "cost": 4, "technique_id": "T1552.001", "preconditions": {"privilege": "admin"}, "postconditions": {"access": "db_admin"}},
    # From DB to WebServer via vulnerability
    {"source_id": asset_by_name["DB"], "target_id": asset_by_name["WebServer"], "edge_type": "can_exploit",
     "cost": 2, "technique_id": "T1190", "preconditions": {}, "postconditions": {"access": "web_admin"}},
]

for e in edges_data:
    edge = Edge(**e)
    db.add(edge)

db.commit()
db.close()
print("Database seeded successfully!")