from database import SessionLocal, engine, Base
from models import Asset, Edge, Vulnerability
import json

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Clear previous data
db.query(Edge).delete()
db.query(Asset).delete()
db.commit()

# ------------------- Assets --------------------
assets_data = [
    {"name": "PC1", "type": "workstation", "os": "Windows 10", "ip": "192.168.1.10", "subnet": "192.168.1.0/24",
     "properties": {"user": "john", "vulnerabilities": ["CVE-2021-36934"]}},   # local EoP
    {"name": "Switch", "type": "network_device", "os": "Firmware", "ip": "192.168.1.1", "subnet": "192.168.1.0/24", "properties": {}},
    {"name": "Server1", "type": "server", "os": "Windows Server 2019", "ip": "192.168.1.50", "subnet": "192.168.1.0/24",
     "properties": {"services": ["SMB", "RDP"], "vulnerabilities": ["CVE-2021-34527"]}},  # PrintNightmare
    {"name": "DB", "type": "database", "os": "Linux", "ip": "192.168.1.100", "subnet": "192.168.1.0/24",
     "properties": {"vulnerabilities": ["CVE-2022-22965"]}},  # Spring4Shell
    {"name": "WebServer", "type": "web_server", "os": "Linux", "ip": "192.168.1.200", "subnet": "192.168.1.0/24",
     "properties": {"services": ["HTTP", "HTTPS"], "vulnerabilities": ["CVE-2023-23397"]}},  # Outlook EoP (if it were a web mail server)
]

assets = []
for data in assets_data:
    a = Asset(**data)
    db.add(a)
    assets.append(a)

db.commit()
for a in assets:
    db.refresh(a)

name_to_id = {a.name: a.id for a in assets}

# ------------------- Network edges --------------------
network_edges = [
    (name_to_id["PC1"], name_to_id["Switch"]),
    (name_to_id["Switch"], name_to_id["PC1"]),
    (name_to_id["Switch"], name_to_id["Server1"]),
    (name_to_id["Server1"], name_to_id["Switch"]),
    (name_to_id["Switch"], name_to_id["DB"]),
    (name_to_id["DB"], name_to_id["Switch"]),
    (name_to_id["Switch"], name_to_id["WebServer"]),
    (name_to_id["WebServer"], name_to_id["Switch"]),
]

for src, tgt in network_edges:
    db.add(Edge(source_id=src, target_id=tgt, edge_type="connected_to", cost=1))

db.commit()

print("Network seeded with vulnerabilities.")
print("Now run the attack graph builder to generate exploit edges.")

db.close()