import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const PathDetails = ({ pathResult }) => {
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);

  if (!pathResult) return <div style={{ padding: 10 }}>Click nodes and "Find Attack Path"</div>;

  const generateReport = async () => {
    setLoading(true);
    try {
      // No /api prefix – the React proxy forwards /report to backend
      const res = await axios.post('/report', pathResult);
      setReport(res.data.report);
    } catch (err) {
      alert('Failed to generate report: ' + (err.response?.data?.detail || err.message));
    }
    setLoading(false);
  };

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

      <button
        onClick={generateReport}
        disabled={loading}
        style={{
          marginTop: 10,
          padding: '8px 16px',
          background: '#0d6efd',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer'
        }}
      >
        {loading ? 'Generating...' : 'Generate AI Report'}
      </button>

      {report && (
        <div style={{
          marginTop: 15,
          padding: 10,
          background: 'white',
          borderRadius: 5,
          border: '1px solid #ccc',
          maxHeight: '60vh',
          overflowY: 'auto'
        }}>
          <h4>AI-Generated Report</h4>
          <ReactMarkdown>{report}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default PathDetails;