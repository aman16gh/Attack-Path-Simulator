import networkx as nx
from sqlalchemy.orm import Session
from models import Asset, Edge
from schemas import PathResult

def build_attack_graph(db: Session) -> nx.DiGraph:
    """
    Reads all assets and edges from the DB and builds a directed graph.
    Nodes: asset.id, with properties (name, type, os, etc.)
    Edges: from source_id to target_id, with MITRE technique and cost.
    """
    G = nx.DiGraph()
    
    # Add all assets as nodes
    assets = db.query(Asset).all()
    for a in assets:
        G.add_node(a.id, name=a.name, type=a.type,
                   os=a.os, ip=a.ip, subnet=a.subnet,
                   properties=a.properties)
    
    # Add all edges
    edges = db.query(Edge).all()
    for e in edges:
        G.add_edge(e.source_id, e.target_id,
                   edge_type=e.edge_type,
                   technique_id=e.technique_id,
                   cost=e.cost,
                   preconditions=e.preconditions,
                   postconditions=e.postconditions)
    return G

def find_shortest_path(db: Session, source_name: str, target_name: str) -> PathResult:
    """
    Finds the lowest-cost path from source asset to target asset using Dijkstra.
    Returns a PathResult with steps, total cost, and risk score.
    """
    G = build_attack_graph(db)
    
    # Build mapping from name -> node ID
    name_to_id = {data['name']: node for node, data in G.nodes(data=True)}
    
    if source_name not in name_to_id or target_name not in name_to_id:
        raise ValueError("Source or target asset not found")
    
    src = name_to_id[source_name]
    tgt = name_to_id[target_name]
    
    try:
        # Compute shortest path using edge 'cost' as weight
        length, path = nx.single_source_dijkstra(G, src, tgt, weight='cost')
    except nx.NetworkXNoPath:
        raise ValueError("No attack path exists between these assets")
    
    # Build the human-readable result
    node_names = [G.nodes[n]['name'] for n in path]
    steps = []
    for i in range(len(path)-1):
        u = path[i]
        v = path[i+1]
        edge = G.edges[u, v]
        steps.append({
            "from": node_names[i],
            "to": node_names[i+1],
            "technique": edge.get("technique_id", ""),
            "edge_type": edge["edge_type"],
            "cost": edge["cost"],
            "preconditions": edge.get("preconditions", {}),
            "postconditions": edge.get("postconditions", {})
        })
    
    return {
        "path": node_names,
        "total_cost": length,
        "steps": steps,
        "risk_score": round(length * 10, 2)   # simplified risk score
    }

def get_critical_nodes(db: Session, top_n: int = 5):
    """
    Uses betweenness centrality to identify the most critical nodes.
    Returns a list of {name, centrality}.
    """
    G = build_attack_graph(db)
    centrality = nx.betweenness_centrality(G, weight='cost')
    sorted_nodes = sorted(centrality.items(), key=lambda x: x[1], reverse=True)[:top_n]
    result = []
    for nid, cent in sorted_nodes:
        result.append({
            "name": G.nodes[nid]['name'],
            "centrality": round(cent, 4),
            "type": G.nodes[nid]['type']
        })
    return result