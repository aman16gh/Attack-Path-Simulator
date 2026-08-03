import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'react-flow-renderer';
import axios from 'axios';

// Helper to assign Antigravity theme colors by asset role
const getNodeMeta = (name = '', type = '') => {
  const str = `${name} ${type}`.toLowerCase();
  if (str.includes('workstation') || str.includes('pc') || str.includes('user') || str.includes('client') || str.includes('laptop')) {
    return { role: 'WORKSTATION', icon: '💻', accent: '#38bdf8', bg: 'rgba(56, 189, 248, 0.08)' };
  }
  if (str.includes('server') || str.includes('dc') || str.includes('domain') || str.includes('host') || str.includes('ad')) {
    return { role: 'SERVER', icon: '🖥️', accent: '#818cf8', bg: 'rgba(129, 140, 248, 0.08)' };
  }
  if (str.includes('db') || str.includes('database') || str.includes('sql') || str.includes('mongo') || str.includes('data')) {
    return { role: 'DATABASE', icon: '🗄️', accent: '#fbbf24', bg: 'rgba(251, 191, 36, 0.08)' };
  }
  if (str.includes('firewall') || str.includes('gateway') || str.includes('router') || str.includes('cloud') || str.includes('web')) {
    return { role: 'GATEWAY', icon: '🛡️', accent: '#34d399', bg: 'rgba(52, 211, 153, 0.08)' };
  }
  return { role: 'ASSET', icon: '📦', accent: '#c084fc', bg: 'rgba(192, 132, 252, 0.08)' };
};

const NetworkGraph = ({ onPathResult }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedSource, setSelectedSource] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch initial graph data
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

      // Transform assets into Antigravity node cards
      const flowNodes = assets.map((asset, index) => {
        const meta = getNodeMeta(asset.name, asset.type);
        return {
          id: asset.id.toString(),
          assetName: asset.name,
          assetMeta: meta,
          data: {
            label: (
              <div style={{ pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px' }}>{meta.icon}</span>
                    <span style={{
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono)',
                      color: meta.accent,
                      fontWeight: 600,
                      letterSpacing: '0.5px'
                    }}>
                      {meta.role}
                    </span>
                  </div>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: meta.accent,
                    boxShadow: `0 0 6px ${meta.accent}`
                  }} />
                </div>

                <div style={{
                  fontWeight: 600,
                  fontSize: '13px',
                  color: '#ffffff',
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '-0.2px'
                }}>
                  {asset.name}
                </div>

                {asset.ip && (
                  <div style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    background: 'rgba(0, 0, 0, 0.4)',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    width: 'fit-content'
                  }}>
                    {asset.ip}
                  </div>
                )}
              </div>
            )
          },
          position: {
            x: 180 + (index % 3) * 300,
            y: 80 + Math.floor(index / 3) * 200,
          },
          style: {
            background: 'var(--bg-card)',
            border: `1px solid var(--border-hairline)`,
            borderTop: `3px solid ${meta.accent}`,
            borderRadius: '8px',
            padding: '12px 14px',
            fontSize: 14,
            minWidth: 160,
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.5)',
            color: '#fff',
            backdropFilter: 'blur(16px)',
            transition: 'all 0.25s ease',
          },
        };
      });

      // Transform edges
      const flowEdges = edgesData.map((edge) => ({
        id: `e${edge.source_id}-${edge.target_id}`,
        source: edge.source_id.toString(),
        target: edge.target_id.toString(),
        label: edge.technique_id || edge.edge_type,
        animated: false,
        style: { stroke: 'rgba(255, 255, 255, 0.12)', strokeWidth: 1.5 },
        labelStyle: { fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 10 },
        labelBgStyle: { fill: 'var(--bg-void)', color: '#fff', rx: 4, ry: 4 },
        labelBgPadding: [6, 4],
        arrowHeadType: 'arrowclosed',
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
      setSelectedSource(null);
      setSelectedTarget(null);
    } catch (err) {
      console.error('Failed to load graph:', err);
      alert('Failed to load graph from backend. Is the API running?');
    }
  };

  // Handle node click to select source or target
  const onNodeClick = useCallback(
    (event, node) => {
      if (!selectedSource) {
        setSelectedSource(node.id);
        setNodes((nds) =>
          nds.map((n) => {
            if (n.id === node.id) {
              return {
                ...n,
                style: {
                  ...n.style,
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1.5px solid var(--ag-sky)',
                  boxShadow: '0 0 20px var(--ag-sky-glow)',
                  animation: 'ag-pulse-sky 2s infinite alternate',
                },
              };
            }
            return n;
          })
        );
      } else if (!selectedTarget && node.id !== selectedSource) {
        setSelectedTarget(node.id);
        setNodes((nds) =>
          nds.map((n) => {
            if (n.id === node.id) {
              return {
                ...n,
                style: {
                  ...n.style,
                  background: 'rgba(244, 63, 94, 0.12)',
                  border: '1.5px solid var(--ag-rose)',
                  boxShadow: '0 0 20px var(--ag-rose-glow)',
                  animation: 'ag-pulse-rose 2s infinite alternate',
                },
              };
            }
            return n;
          })
        );
      }
    },
    [selectedSource, selectedTarget, setNodes]
  );

  // Reset selection and highlights
  const resetSelection = () => {
    setSelectedSource(null);
    setSelectedTarget(null);
    setSearchQuery('');
    setNodes((nds) =>
      nds.map((n) => {
        const meta = n.assetMeta || getNodeMeta(n.assetName);
        return {
          ...n,
          style: {
            ...n.style,
            background: 'var(--bg-card)',
            border: `1px solid var(--border-hairline)`,
            borderTop: `3px solid ${meta.accent}`,
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.5)',
            opacity: 1,
            animation: 'none',
          },
        };
      })
    );
    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        animated: false,
        style: { stroke: 'rgba(255, 255, 255, 0.12)', strokeWidth: 1.5 },
      }))
    );
  };

  // Find attack path
  const findPath = async () => {
    if (!selectedSource || !selectedTarget) {
      alert('Click a source node, then a target node.');
      return;
    }

    const sourceNode = nodes.find((n) => n.id === selectedSource);
    const targetNode = nodes.find((n) => n.id === selectedTarget);
    if (!sourceNode || !targetNode) return;

    try {
      const res = await axios.get('/paths', {
        params: {
          source: sourceNode.assetName || sourceNode.data?.label,
          target: targetNode.assetName || targetNode.data?.label,
        },
      });

      const pathResult = res.data;
      onPathResult(pathResult);

      highlightPath(pathResult.path);
    } catch (err) {
      alert('No path found: ' + (err.response?.data?.detail || err.message));
    }
  };

  // Highlight path on the graph
  const highlightPath = (pathNames) => {
    const nameToId = {};
    nodes.forEach((n) => {
      const name = n.assetName || (typeof n.data?.label === 'string' ? n.data.label : '');
      if (name) nameToId[name] = n.id;
    });

    const pathNodeIds = [];
    const pathEdgeIds = [];

    for (let i = 0; i < pathNames.length; i++) {
      const currentId = nameToId[pathNames[i]];
      if (currentId) pathNodeIds.push(currentId);

      if (i < pathNames.length - 1) {
        const nextId = nameToId[pathNames[i + 1]];
        if (currentId && nextId) {
          pathEdgeIds.push(`e${currentId}-${nextId}`, `e${nextId}-${currentId}`);
        }
      }
    }

    setNodes((nds) =>
      nds.map((n) => {
        const meta = n.assetMeta || getNodeMeta(n.assetName);
        if (pathNodeIds.includes(n.id)) {
          const isSource = n.id === selectedSource;
          const isTarget = n.id === selectedTarget;

          return {
            ...n,
            style: {
              ...n.style,
              background: isSource
                ? 'rgba(56, 189, 248, 0.15)'
                : isTarget
                ? 'rgba(244, 63, 94, 0.15)'
                : 'rgba(251, 191, 36, 0.15)',
              border: isSource
                ? '1.5px solid var(--ag-sky)'
                : isTarget
                ? '1.5px solid var(--ag-rose)'
                : '1.5px solid var(--ag-amber)',
              boxShadow: isSource
                ? '0 0 20px var(--ag-sky-glow)'
                : isTarget
                ? '0 0 20px var(--ag-rose-glow)'
                : '0 0 20px rgba(251, 191, 36, 0.25)',
              opacity: 1,
              animation: isSource
                ? 'ag-pulse-sky 2s infinite alternate'
                : isTarget
                ? 'ag-pulse-rose 2s infinite alternate'
                : 'ag-pulse-amber 2s infinite alternate',
            },
          };
        } else {
          return {
            ...n,
            style: {
              ...n.style,
              background: 'rgba(13, 16, 26, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.04)',
              boxShadow: 'none',
              opacity: 0.3,
              animation: 'none',
            },
          };
        }
      })
    );

    setEdges((eds) =>
      eds.map((e) => {
        if (pathEdgeIds.includes(e.id)) {
          return {
            ...e,
            animated: true,
            style: {
              stroke: 'var(--ag-rose)',
              strokeWidth: 3,
              filter: 'drop-shadow(0 0 8px var(--ag-rose-glow))',
            },
          };
        }
        return {
          ...e,
          animated: false,
          style: { stroke: 'rgba(255, 255, 255, 0.04)', strokeWidth: 1 },
        };
      })
    );
  };

  // Filter nodes on search query
  const filteredNodes = useMemo(() => {
    if (!searchQuery) return nodes;
    const query = searchQuery.toLowerCase();
    return nodes.map((n) => {
      const match = (n.assetName || '').toLowerCase().includes(query);
      return {
        ...n,
        style: {
          ...n.style,
          opacity: match ? 1 : 0.2,
        },
      };
    });
  }, [nodes, searchQuery]);

  const getSourceNodeName = () => {
    return nodes.find((n) => n.id === selectedSource)?.assetName || selectedSource;
  };

  const getTargetNodeName = () => {
    return nodes.find((n) => n.id === selectedTarget)?.assetName || selectedTarget;
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Responsive Action Toolbar Header */}
      <div
        style={{
          padding: '10px 14px',
          background: 'rgba(7, 9, 14, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border-hairline)',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          zIndex: 10,
        }}
      >
        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
          {/* Quick Search */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flexGrow: 1, minWidth: '120px', maxWidth: '200px' }}>
            <span style={{ position: 'absolute', left: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>🔍</span>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-hairline)',
                borderRadius: '6px',
                padding: '6px 10px 6px 28px',
                color: '#ffffff',
                fontSize: '12px',
                fontFamily: 'var(--font-sans)',
                outline: 'none',
                width: '100%',
                transition: 'all 0.2s ease',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--ag-sky)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-hairline)')}
            />
          </div>

          <button
            onClick={loadGraph}
            style={{
              padding: '6px 12px',
              background: 'rgba(255, 255, 255, 0.04)',
              color: 'var(--text-subtle)',
              border: '1px solid var(--border-hairline)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              minHeight: '32px',
              whiteSpace: 'nowrap'
            }}
          >
            <span>🔄</span> Reload
          </button>

          <button
            onClick={findPath}
            style={{
              padding: '6px 14px',
              background: 'var(--gradient-brand)',
              color: '#030407',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: 'var(--font-display)',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              minHeight: '32px',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 14px var(--ag-sky-glow)'
            }}
          >
            <span>🎯</span> Find Path
          </button>

          <button
            onClick={resetSelection}
            style={{
              padding: '6px 10px',
              background: 'transparent',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-hairline)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              minHeight: '32px'
            }}
          >
            Reset
          </button>
        </div>

        {/* Selection Readout Pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            background: 'rgba(0, 0, 0, 0.4)',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid var(--border-hairline)',
            whiteSpace: 'nowrap'
          }}
        >
          <span style={{ color: 'var(--ag-sky)' }}>
            SRC: <strong style={{ color: selectedSource ? '#ffffff' : 'var(--text-muted)' }}>{selectedSource ? getSourceNodeName() : 'None'}</strong>
          </span>
          <span style={{ color: 'var(--text-muted)' }}>➔</span>
          <span style={{ color: 'var(--ag-rose)' }}>
            TGT: <strong style={{ color: selectedTarget ? '#ffffff' : 'var(--text-muted)' }}>{selectedTarget ? getTargetNodeName() : 'None'}</strong>
          </span>
        </div>
      </div>

      {/* Canvas Container */}
      <div style={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={filteredNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
        >
          <MiniMap
            nodeColor={(node) => {
              if (node.id === selectedSource) return '#38bdf8';
              if (node.id === selectedTarget) return '#f43f5e';
              return '#818cf8';
            }}
            maskColor="rgba(3, 4, 7, 0.85)"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-hairline)',
            }}
          />
          <Controls />
          <Background variant="dots" color="rgba(56, 189, 248, 0.25)" gap={20} size={1.5} />
        </ReactFlow>
      </div>
    </div>
  );
};

export default NetworkGraph;