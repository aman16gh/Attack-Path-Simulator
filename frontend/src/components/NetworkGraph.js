import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'react-flow-renderer';
import axios from 'axios';

const NetworkGraph = ({ onPathResult }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedSource, setSelectedSource] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);

  // Load graph from backend
  useEffect(() => {
    loadGraph();
  }, []);

  const loadGraph = async () => {
    try {
      const [assetsRes, edgesRes] = await Promise.all([
        axios.get('/assets'),
        axios.get('/edges'),
      ]);

      const assets = assetsRes.data;
      const edgesData = edgesRes.data;

      // Transform assets into React Flow nodes
      const flowNodes = assets.map((asset, index) => ({
        id: asset.id.toString(),
        data: { label: asset.name },
        position: {
          x: 250 + (index % 3) * 300,
          y: 100 + Math.floor(index / 3) * 200,
        },
        style: {
          background: '#f0f0f0',
          border: '2px solid #888',
          borderRadius: 8,
          padding: 10,
          fontSize: 14,
        },
      }));

      // Transform edges into React Flow edges
      const flowEdges = edgesData.map((edge) => ({
        id: `e${edge.source_id}-${edge.target_id}`,
        source: edge.source_id.toString(),
        target: edge.target_id.toString(),
        label: edge.technique_id || edge.edge_type,
        animated: false,
        style: { stroke: '#555' },
        arrowHeadType: 'arrowclosed',
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (err) {
      console.error('Failed to load graph:', err);
    }
  };

  // Handle node click to select source or target
  const onNodeClick = useCallback((event, node) => {
    if (!selectedSource) {
      setSelectedSource(node.id);
    } else if (!selectedTarget && node.id !== selectedSource) {
      setSelectedTarget(node.id);
    }
  }, [selectedSource, selectedTarget]);

  // Reset selections and clear highlights
  const resetSelection = () => {
    setSelectedSource(null);
    setSelectedTarget(null);
    // Reset all node/edge styles to default
    setNodes(nds =>
      nds.map(n => ({
        ...n,
        style: { ...n.style, background: '#f0f0f0' },
      }))
    );
    setEdges(eds =>
      eds.map(e => ({
        ...e,
        animated: false,
        style: { ...e.style, stroke: '#555' },
      }))
    );
  };

  // Find attack path from selected source to target
  const findPath = async () => {
    if (!selectedSource || !selectedTarget) {
      alert('Click a source node, then a target node.');
      return;
    }

    const sourceNode = nodes.find(n => n.id === selectedSource);
    const targetNode = nodes.find(n => n.id === selectedTarget);
    if (!sourceNode || !targetNode) return;

    try {
      const res = await axios.get('/paths', {
        params: {
          source: sourceNode.data.label,
          target: targetNode.data.label,
        },
      });

      const pathResult = res.data;
      onPathResult(pathResult);

      // Highlight the path on the graph
      highlightPath(pathResult.path);
    } catch (err) {
      alert('No path found: ' + (err.response?.data?.detail || err.message));
    }
  };

  const highlightPath = (pathNames) => {
    // Reset all highlights first
    setNodes(nds =>
      nds.map(n => ({
        ...n,
        style: { ...n.style, background: '#f0f0f0' },
      }))
    );
    setEdges(eds =>
      eds.map(e => ({
        ...e,
        animated: false,
        style: { ...e.style, stroke: '#555' },
      }))
    );

    // Map names to node IDs
    const nameToId = {};
    nodes.forEach(n => { nameToId[n.data.label] = n.id; });

    const pathNodeIds = [];
    const pathEdgeIds = [];

    for (let i = 0; i < pathNames.length; i++) {
      const currentId = nameToId[pathNames[i]];
      pathNodeIds.push(currentId);
      if (i < pathNames.length - 1) {
        const nextId = nameToId[pathNames[i + 1]];
        // Highlight both possible edge directions (simplified)
        pathEdgeIds.push(`e${currentId}-${nextId}`);
        pathEdgeIds.push(`e${nextId}-${currentId}`);
      }
    }

    // Apply highlight styles
    setNodes(nds =>
      nds.map(n => {
        if (pathNodeIds.includes(n.id)) {
          return {
            ...n,
            style: {
              ...n.style,
              background: n.id === selectedSource ? '#aaf' :
                          n.id === selectedTarget ? '#faa' : '#ff9',
            },
          };
        }
        return n;
      })
    );

    setEdges(eds =>
      eds.map(e => {
        if (pathEdgeIds.includes(e.id)) {
          return {
            ...e,
            animated: true,
            style: { ...e.style, stroke: '#f00', strokeWidth: 3 },
          };
        }
        return e;
      })
    );
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Control bar */}
      <div style={{ padding: 10, background: '#f8f8f8', borderBottom: '1px solid #ccc' }}>
        <button onClick={loadGraph}>Reload Graph</button>
        <button onClick={findPath} style={{ marginLeft: 10 }}>Find Attack Path</button>
        <button onClick={resetSelection} style={{ marginLeft: 10 }}>Reset</button>
        <span style={{ marginLeft: 10 }}>
          {selectedSource ? `Source: ${nodes.find(n => n.id === selectedSource)?.data?.label} → ` : ''}
          {selectedTarget ? `Target: ${nodes.find(n => n.id === selectedTarget)?.data?.label}` : ''}
        </span>
      </div>

      {/* Graph area */}
      <div style={{ flex: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
};

export default NetworkGraph;