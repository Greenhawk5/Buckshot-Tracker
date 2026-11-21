import React, { useEffect, useState } from 'react';
import { fetchOwnerAuditLogs } from '../../../services/owner.api';

export const AuditView: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('all');
  const [loading, setLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);
  const [copySuccessId, setCopySuccessId] = useState<number | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await fetchOwnerAuditLogs(page, 20, action);
      setLogs(res.logs);
      setTotal(res.total);
    } catch (err: any) {
      alert(err?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page, action]);

  const toggleExpand = (id: number) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  const handleCopyJson = (id: number, json: string) => {
    navigator.clipboard.writeText(json);
    setCopySuccessId(id);
    setTimeout(() => setCopySuccessId(null), 2000);
  };

  return (
    <div className="owner-view audit-view">
      <div className="view-toolbar">
        <div>
          <h3 className="view-title">Administrative Audit Trail ({total})</h3>
          <p className="view-desc">Immutable append-only record of owner actions.</p>
        </div>
        <select
          className="form-select select-sm audit-action-filter"
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">All Actions</option>
          <option value="create_campaign">Create Campaign</option>
          <option value="start_campaign">Start Campaign</option>
          <option value="update_settings">Update Settings</option>
          <option value="update_user_metadata">Update User Metadata</option>
          <option value="restrict_user">Restrict User</option>
          <option value="unrestrict_user">Unrestrict User</option>
          <option value="export_report">Export Report</option>
        </select>
      </div>

      {loading && (
        <div className="owner-loading" role="status">
          <span className="loading-pulse-dot" /> Loading immutable audit logs...
        </div>
      )}

      {!loading && (
        <div className="audit-list">
          {logs.length === 0 && <div className="empty-sub">No audit logs recorded for this filter.</div>}
          {logs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            return (
              <div key={log.id} className="audit-card">
                <div className="audit-header">
                  <span className="audit-action font-mono">{log.action}</span>
                  <span className="audit-time font-mono">{new Date(log.occurredAt).toLocaleString()}</span>
                </div>
                <div className="audit-details">
                  <span>
                    Target: <strong>{log.targetType}</strong>{' '}
                    {log.targetId ? <code className="font-mono">({log.targetId})</code> : ''}
                  </span>
                  <span>
                    Outcome:{' '}
                    <strong className={log.outcome === 'success' ? 'text-success' : 'text-danger'}>
                      {log.outcome.toUpperCase()}
                    </strong>
                  </span>
                </div>

                {log.detailsJson && (
                  <div className="audit-expand-wrap">
                    <button
                      type="button"
                      className="audit-toggle-btn font-mono"
                      onClick={() => toggleExpand(log.id)}
                    >
                      {isExpanded ? '▼ Hide Metadata' : '▶ Inspect Details JSON'}
                    </button>
                    {isExpanded && (
                      <div className="audit-json-container">
                        <div className="audit-json-header">
                          <span className="font-mono text-2xs">PAYLOAD</span>
                          <button
                            type="button"
                            className="audit-copy-btn font-mono"
                            onClick={() => handleCopyJson(log.id, log.detailsJson)}
                          >
                            {copySuccessId === log.id ? 'Copied!' : 'Copy JSON'}
                          </button>
                        </div>
                        <pre className="audit-json font-mono">{log.detailsJson}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
