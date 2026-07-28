import React from 'react';

const PathDetails = ({ pathResult }) => {
  if (!pathResult) return <div style={{ padding: 10 }}>Click nodes and "Find Attack Path"</div>;

  return (
    <div style={{ padding: 15, background: '#f4f4f4', borderLeft: '2px solid #ccc', overflowY: 'auto', maxHeight: '100%' }}>
      <h3>Attack Path Details</h3>
      <p><strong>Path:</strong> {pathResult.path.join(' → ')}</p>
      <p><strong>Total Cost:</strong> {pathResult.total_cost}</p>
      <p><strong>Risk Score:</strong> {pathResult.risk_score}</p>
      <h4>Steps:</h4>
      {pathResult.steps.map((step, idx) => (
        <div key={idx} style={{ marginBottom: 10, padding: 8, background: '#fff', borderRadius: 5, border: '1px solid #ddd' }}>
          <p><strong>{step.from}</strong> → <strong>{step.to}</strong></p>
          <p>Edge Type: {step.edge_type}</p>
          {step.technique && <p>MITRE ATT&CK: <code>{step.technique}</code></p>}
          <p>Cost: {step.cost}</p>
          {step.preconditions && Object.keys(step.preconditions).length > 0 && (
            <p>Preconditions: {JSON.stringify(step.preconditions)}</p>
          )}
          {step.postconditions && Object.keys(step.postconditions).length > 0 && (
            <p>Postconditions: {JSON.stringify(step.postconditions)}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default PathDetails;