import React, { useEffect, useState } from 'react';
import { fetchOwnerAuditLogs } from '../../../services/owner.api';

export const AuditView: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page] = useState(1);
  const [action, setAction] = useState('all');
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="owner-view audit-view">
      <div className="view-toolbar">
        <h3 className="view-title">Administrative Audit Logs ({total})</h3>
        <select className="form-select select-sm" value={action} onChange={(e) => setAction(e.target.value)}>
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

      {loading && <div className="owner-loading">Loading immutable audit logs...</div>}

      {!loading && (
        <div className="audit-list">
          {logs.length === 0 && <div className="empty-sub">No audit logs recorded for this filter.</div>}
          {logs.map((log) => (
            <div key={log.id} className="audit-card">
              <div className="audit-header">
                <span className="audit-action font-mono">{log.action}</span>
                <span className="audit-time">{new Date(log.occurredAt).toLocaleString()}</span>
              </div>
              <div className="audit-details">
                <span>Target: <strong>{log.targetType}</strong> {log.targetId ? `(${log.targetId})` : ''}</span>
                <span>Outcome: <strong className={log.outcome === 'success' ? 'text-success' : 'text-danger'}>{log.outcome}</strong></span>
              </div>
              {log.detailsJson && (
                <pre className="audit-json font-mono">{log.detailsJson}</pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
