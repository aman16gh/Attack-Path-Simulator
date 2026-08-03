import React, { useState, useEffect } from 'react';
import NetworkGraph from './components/NetworkGraph';
import PathDetails from './components/PathDetails';

function App() {
  const [pathResult, setPathResult] = useState(null);
  const [mobileTab, setMobileTab] = useState('graph'); // 'graph' | 'details'
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 900);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // When a new path result is generated, automatically switch to details view on mobile
  const handlePathResult = (result) => {
    setPathResult(result);
    if (isMobile) {
      setMobileTab('details');
    }
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg-void)',
      color: 'var(--text-white)',
      fontFamily: 'var(--font-sans)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Platform Navigation Header */}
      <header style={{
        height: isMobile ? '50px' : '54px',
        background: 'rgba(7, 9, 14, 0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-hairline)',
        padding: isMobile ? '0 12px' : '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 20,
        flexShrink: 0
      }}>
        {/* Brand & Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            background: 'var(--gradient-brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 14px var(--ag-sky-glow)',
            fontWeight: 800,
            fontSize: '12px',
            color: '#030407',
            fontFamily: 'var(--font-display)'
          }}>
            ⚡
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: isMobile ? '14px' : '16px',
              letterSpacing: '-0.3px',
              color: '#ffffff',
              whiteSpace: 'nowrap'
            }}>
              ATTACK PATH SIMULATOR
            </span>

            {!isMobile && (
              <>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>/</span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: 'var(--ag-sky)',
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  Threat Operations Engine
                </span>
              </>
            )}
          </div>
        </div>

        {/* Telemetry Status Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 8px',
            background: 'rgba(52, 211, 153, 0.08)',
            border: '1px solid rgba(52, 211, 153, 0.2)',
            borderRadius: '20px',
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--ag-emerald)'
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--ag-emerald)',
              boxShadow: '0 0 6px var(--ag-emerald)',
              animation: 'ag-blink 2s infinite'
            }} />
            ACTIVE
          </div>

          <div className="header-telemetry" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 10px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-hairline)',
            borderRadius: '20px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)'
          }}>
            US-EAST-1
          </div>
        </div>
      </header>

      {/* Mobile Mode Switcher Bar */}
      {isMobile && (
        <div style={{
          display: 'flex',
          background: 'rgba(13, 16, 26, 0.95)',
          borderBottom: '1px solid var(--border-hairline)',
          padding: '4px 8px',
          gap: '4px',
          zIndex: 15,
          flexShrink: 0
        }}>
          <button
            onClick={() => setMobileTab('graph')}
            style={{
              flex: 1,
              padding: '8px',
              background: mobileTab === 'graph' ? 'var(--gradient-brand)' : 'transparent',
              color: mobileTab === 'graph' ? '#030407' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            🗺️ TOPOLOGY MAP
          </button>

          <button
            onClick={() => setMobileTab('details')}
            style={{
              flex: 1,
              padding: '8px',
              background: mobileTab === 'details' ? 'var(--gradient-brand)' : 'transparent',
              color: mobileTab === 'details' ? '#030407' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            📊 VECTOR AUDIT {pathResult ? '•' : ''}
          </button>
        </div>
      )}

      {/* Main Workspace Split Pane / Stacked Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'row', minHeight: 0, position: 'relative' }}>
        {/* Topology Graph Panel */}
        <div style={{
          flex: isMobile ? 1 : 3,
          display: (!isMobile || mobileTab === 'graph') ? 'block' : 'none',
          height: '100%',
          width: '100%',
          position: 'relative'
        }}>
          <NetworkGraph onPathResult={handlePathResult} />
        </div>

        {/* Attack Vector Analysis Panel */}
        <div style={{
          flex: 1,
          minWidth: isMobile ? '100%' : '380px',
          maxWidth: isMobile ? '100%' : '520px',
          display: (!isMobile || mobileTab === 'details') ? 'flex' : 'none',
          borderLeft: isMobile ? 'none' : '1px solid var(--border-hairline)',
          background: 'var(--bg-surface)',
          backdropFilter: 'blur(20px)',
          boxShadow: isMobile ? 'none' : '-12px 0 35px rgba(0, 0, 0, 0.5)',
          flexDirection: 'column',
          height: '100%',
          zIndex: 10
        }}>
          <PathDetails pathResult={pathResult} />
        </div>
      </div>
    </div>
  );
}

export default App;