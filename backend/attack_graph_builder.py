"""
Automatic attack graph expansion.
Given a database with assets, vulnerabilities, and network edges,
this module creates all possible exploit edges based on:
- A vulnerability exists on an asset
- Preconditions for the vulnerability are met (e.g., remote access, required privilege)
- Postconditions grant new access or capabilities
Edge cost is calculated from CVSS score and attack complexity.
MITRE technique is mapped from the vulnerability.
"""

from sqlalchemy.orm import Session
from models import Asset, Edge, Vulnerability
import math

def build_exploit_edges(db: Session):
    """
    Scans all assets, for each vulnerability linked (later via a relationship,
    but for now we'll store vulnerability references in Asset.properties['vulnerabilities']
    as a list of CVE IDs). We'll fetch the Vulnerability objects and generate edges.
    
    This implementation assumes:
    - Asset.properties contains a 'vulnerabilities' list of CVE IDs.
    - Vulnerability table contains CVSS and MITRE info.
    - Network connectivity edges already exist (edge_type='connected_to').
    
    Exploit edges are created from an asset to itself (privilege escalation)
    or from one asset to another (lateral movement / remote exploit).
    """
    # First, clear all previously generated exploit edges (to avoid duplicates)
    db.query(Edge).filter(Edge.edge_type == 'can_exploit').delete()
    
    assets = db.query(Asset).all()
    vulns_db = {v.cve_id: v for v in db.query(Vulnerability).all()}
    
    # Build a quick lookup: asset by id
    asset_dict = {a.id: a for a in assets}
    
    # Also gather network connectivity (undirected connectivity is represented by
    # having two connected_to edges, but we can build an adjacency set)
    connectivity = set()
    network_edges = db.query(Edge).filter(Edge.edge_type == 'connected_to').all()
    for e in network_edges:
        connectivity.add((e.source_id, e.target_id))
        connectivity.add((e.target_id, e.source_id))   # bidirectional
    
    new_edges = []
    
    for asset in assets:
        # Get CVE list from asset properties (if present)
        cve_list = asset.properties.get('vulnerabilities', []) if asset.properties else []
        for cve_id in cve_list:
            vuln = vulns_db.get(cve_id)
            if not vuln:
                continue
            
            # Determine target based on attack vector and preconditions
            target_asset = None
            edge_type = 'can_exploit'
            
            # Simplified logic:
            # - If attack_vector == 'local' and preconditions require user, privilege escalation on same host
            # - If attack_vector == 'network' and preconditions require remote access, exploit to another reachable host
            # For the MVP, we'll create self-loop for local, and for network we'll find reachable hosts
            if vuln.attack_vector == 'local':
                # Privilege escalation on same asset (self-loop)
                target_asset = asset
            elif vuln.attack_vector == 'network':
                # Remote exploit: find all assets reachable from this asset via network connectivity
                reachable = [tgt for src, tgt in connectivity if src == asset.id]
                if not reachable:
                    continue
                # For simplicity, we'll target the first reachable asset (or all)
                # We'll create edges to all reachable assets
                for tgt_id in reachable:
                    target_asset = asset_dict.get(tgt_id)
                    if target_asset:
                        # Skip self (already handled)
                        if target_asset.id == asset.id:
                            continue
                        new_edge = Edge(
                            source_id=asset.id,
                            target_id=target_asset.id,
                            edge_type='can_exploit',
                            technique_id=vuln.mitre_technique_id,
                            cost=calculate_cost(vuln),
                            preconditions=vuln.preconditions or {},
                            postconditions=vuln.postconditions or {}
                        )
                        new_edges.append(new_edge)
                continue  # already handled reachable assets
            else:
                continue
            
            # Create the edge
            new_edge = Edge(
                source_id=asset.id,
                target_id=target_asset.id,
                edge_type='can_exploit',
                technique_id=vuln.mitre_technique_id,
                cost=calculate_cost(vuln),
                preconditions=vuln.preconditions or {},
                postconditions=vuln.postconditions or {}
            )
            new_edges.append(new_edge)
    
    db.add_all(new_edges)
    db.commit()
    print(f"Generated {len(new_edges)} exploit edges.")

def calculate_cost(vuln: Vulnerability) -> float:
    """
    Derives an edge traversal cost from CVSS score and attack complexity.
    Lower cost = easier to exploit (more attractive to attacker).
    We invert the CVSS score (10 - cvss) so that high‑risk vulns have low cost.
    Attack complexity 'low' reduces cost further.
    """
    base = 10.0 - (vuln.cvss_score or 5.0)  # range 0-10
    if vuln.attack_complexity == 'low':
        base *= 0.7
    elif vuln.attack_complexity == 'high':
        base *= 1.2
    return max(base, 1.0)  # floor at 1.0