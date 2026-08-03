import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const PathDetails = ({ pathResult }) => {
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('steps'); // 'steps' | 'report'

  if (!pathResult) {
    return (
      <div style={{
        padding: '30px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        textAlign: 'center',
        color: 'var(--text-muted)'
      }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-hairline)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          marginBottom: '12px'
        }}>
          🔍
        </div>
        <h4 style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--text-white)',
          margin: '0 0 6px 0',
          fontSize: '14px',
          fontWeight: 600
        }}>
          No Active Traversal Vector
        </h4>
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '12px',
          lineHeight: '1.5',
          maxWidth: '260px',
          margin: 0,
          color: 'var(--text-muted)'
        }}>
          Select a <strong>Source node</strong> and a <strong>Target node</strong> on the map, then click <strong>"Find Attack Path"</strong>.
        </p>
      </div>
    );
  }

  const generateReport = async () => {
    setLoading(true);
    try {
      // No /api prefix – the React proxy forwards /report to backend
      const res = await axios.post('/report', pathResult);
      setReport(res.data.report);
      setActiveTab('report');
    } catch (err) {
      alert('Failed to generate report: ' + (err.response?.data?.detail || err.message));
    }
    setLoading(false);
  };

  const copyReportToClipboard = () => {
    if (!report) return;
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="touch-scroll"
      style={{
        padding: '16px',
        height: '100%',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}
    >
      {/* Header & Mode Tabs */}
      <div style={{
        borderBottom: '1px solid var(--border-hairline)',
        paddingBottom: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontSize: '15px',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.2px'
            }}>
              Attack Vector Traversal
            </h3>
            <div style={{
              fontSize: '11px',
              fontFamily: 'var(--font-sans)',
              color: 'var(--text-muted)',
              marginTop: '2px'
            }}>
              Calculated attack chain & threat analysis
            </div>
          </div>

          <button
            onClick={generateReport}
            disabled={loading}
            style={{
              padding: '6px 12px',
              background: loading
                ? 'rgba(56, 189, 248, 0.1)'
                : 'var(--gradient-brand)',
              color: loading ? 'var(--ag-sky)' : '#030407',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '11px',
              letterSpacing: '0.2px',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              minHeight: '32px'
            }}
          >
            {loading ? '🤖 Auditing...' : '⚡ Generate AI Audit'}
          </button>
        </div>

        {/* View Switcher Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '3px',
          borderRadius: '6px',
          border: '1px solid var(--border-hairline)'
        }}>
          <button
            onClick={() => setActiveTab('steps')}
            style={{
              flex: 1,
              padding: '6px 10px',
              background: activeTab === 'steps' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              color: activeTab === 'steps' ? '#ffffff' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: 'var(--font-sans)',
              fontWeight: 500,
              cursor: 'pointer',
              minHeight: '32px'
            }}
          >
            Vector Steps ({pathResult.steps?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('report')}
            style={{
              flex: 1,
              padding: '6px 10px',
              background: activeTab === 'report' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              color: activeTab === 'report' ? '#ffffff' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: 'var(--font-sans)',
              fontWeight: 500,
              cursor: 'pointer',
              minHeight: '32px'
            }}
          >
            AI Audit Report {report ? '✓' : ''}
          </button>
        </div>
      </div>

      {/* Adaptive Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-hairline)',
          borderRadius: '8px',
          padding: '10px 12px'
        }}>
          <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            Total Path Cost
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-white)', marginTop: '2px' }}>
            {pathResult.total_cost}
          </div>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-hairline)',
          borderRadius: '8px',
          padding: '10px 12px'
        }}>
          <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            Threat Risk Score
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--ag-rose)', marginTop: '2px' }}>
            {pathResult.risk_score}
          </div>
        </div>
      </div>

      {/* Path Chain */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.4)',
        border: '1px solid var(--border-hairline)',
        borderRadius: '8px',
        padding: '10px 12px',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px'
      }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Traversed Chain:
        </div>
        <div style={{ color: 'var(--text-white)', wordBreak: 'break-word', lineHeight: '1.5' }}>
          {pathResult.path.map((node, i) => (
            <span key={i}>
              <span style={{
                color: i === 0 ? 'var(--ag-sky)' : i === pathResult.path.length - 1 ? 'var(--ag-rose)' : 'var(--text-white)',
                fontWeight: 600
              }}>
                {node}
              </span>
              {i < pathResult.path.length - 1 && <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>➔</span>}
            </span>
          ))}
        </div>
      </div>

      {/* TAB 1: Steps */}
      {activeTab === 'steps' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {pathResult.steps.map((step, idx) => (
            <div
              key={idx}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-hairline)',
                borderRadius: '8px',
                padding: '10px 12px'
              }}
            >
              {/* Step Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px'
              }}>
                <span style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--ag-sky)',
                  background: 'rgba(56, 189, 248, 0.08)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: '1px solid rgba(56, 189, 248, 0.2)'
                }}>
                  STEP 0{idx + 1}
                </span>

                {step.technique && (
                  <span style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--ag-indigo)',
                    background: 'rgba(129, 140, 248, 0.1)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: '1px solid rgba(129, 140, 248, 0.3)'
                  }}>
                    MITRE: {step.technique}
                  </span>
                )}
              </div>

              {/* Hop Names */}
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '13px',
                fontWeight: 600,
                color: '#ffffff',
                marginBottom: '6px'
              }}>
                <span style={{ color: 'var(--ag-sky)' }}>{step.from}</span>
                <span style={{ color: 'var(--text-muted)', margin: '0 6px' }}>➔</span>
                <span style={{ color: 'var(--ag-rose)' }}>{step.to}</span>
              </div>

              {/* Edge Meta */}
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', display: 'flex', gap: '10px' }}>
                <span>Type: <strong style={{ color: 'var(--text-subtle)' }}>{step.edge_type}</strong></span>
                <span>Cost: <strong style={{ color: 'var(--ag-amber)' }}>{step.cost}</strong></span>
              </div>

              {/* Preconditions */}
              {step.preconditions && Object.keys(step.preconditions).length > 0 && (
                <div style={{
                  marginTop: '6px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '4px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-subtle)',
                  borderLeft: '2px solid var(--ag-sky)'
                }}>
                  <strong style={{ color: 'var(--ag-sky)' }}>Preconditions:</strong> {JSON.stringify(step.preconditions)}
                </div>
              )}

              {/* Postconditions */}
              {step.postconditions && Object.keys(step.postconditions).length > 0 && (
                <div style={{
                  marginTop: '4px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '4px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-subtle)',
                  borderLeft: '2px solid var(--ag-emerald)'
                }}>
                  <strong style={{ color: 'var(--ag-emerald)' }}>Postconditions:</strong> {JSON.stringify(step.postconditions)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: AI Audit */}
      {activeTab === 'report' && (
        <div>
          {!report ? (
            <div style={{
              padding: '24px 16px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              background: 'var(--bg-card)',
              borderRadius: '8px',
              border: '1px dashed var(--border-hairline)'
            }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '12px' }}>No audit report generated yet.</p>
              <button
                onClick={generateReport}
                disabled={loading}
                style={{
                  padding: '6px 14px',
                  background: 'var(--gradient-brand)',
                  color: '#030407',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-display)'
                }}
              >
                {loading ? 'Auditing...' : 'Generate AI Audit Now'}
              </button>
            </div>
          ) : (
            <div style={{
              background: '#07090e',
              borderRadius: '8px',
              border: '1px solid var(--border-hairline)',
              overflow: 'hidden'
            }}>
              {/* Header */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderBottom: '1px solid var(--border-hairline)',
                padding: '6px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--text-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>📄</span> AI_Threat_Audit.md
                </div>

                <button
                  onClick={copyReportToClipboard}
                  style={{
                    padding: '3px 8px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: 'var(--text-subtle)',
                    border: '1px solid var(--border-hairline)',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer'
                  }}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>

              {/* Report Markdown Text */}
              <div style={{
                padding: '12px',
                maxHeight: '420px',
                overflowY: 'auto',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--text-white)',
                lineHeight: '1.6'
              }}>
                <ReactMarkdown>{report}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PathDetails;