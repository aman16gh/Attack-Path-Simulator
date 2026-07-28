import React, { useState } from 'react';
import NetworkGraph from './components/NetworkGraph';
import PathDetails from './components/PathDetails';

function App() {
  const [pathResult, setPathResult] = useState(null);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: '#1a1a2e', color: 'white', padding: '10px 20px' }}>
        <h1>Attack Path Simulator</h1>
      </header>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'row', minHeight: 0 }}>
        <div style={{ flex: 3 }}>
          <NetworkGraph onPathResult={setPathResult} />
        </div>
        <div style={{ flex: 1, minWidth: 300, borderLeft: '1px solid #ccc' }}>
          <PathDetails pathResult={pathResult} />
        </div>
      </div>
    </div>
  );
}

export default App;