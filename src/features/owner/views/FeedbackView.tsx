import React, { useEffect, useState } from 'react';
import { fetchOwnerFeedback, updateOwnerFeedback } from '../../../services/owner.api';

export const FeedbackView: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Selected for response
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [responseMsg, setResponseMsg] = useState('');
  const [targetStatus, setTargetStatus] = useState('reviewing');
  const [saving, setSaving] = useState(false);

  const loadFeedback = async () => {
    setLoading(true);
    try {
      const res = await fetchOwnerFeedback(page, 20, statusFilter);
      setReports(res.reports);
      setTotal(res.total);
    } catch (err: any) {
      alert(err?.message || 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, [page, statusFilter]);

  const handleOpenReport = (rep: any) => {
    setSelectedReport(rep);
    setResponseMsg(rep.ownerResponse || '');
    setTargetStatus(rep.status);
  };

  const handleUpdate = async () => {
    if (!selectedReport) return;
    setSaving(true);
    try {
      await updateOwnerFeedback(selectedReport.id, targetStatus, responseMsg);
      setSelectedReport(null);
      loadFeedback();
    } catch (err: any) {
      alert(err?.message || 'Failed to update feedback');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="owner-view feedback-view">
      <div className="view-toolbar">
        <h3 className="view-title">User Reports & Feedback ({total})</h3>
        <div className="period-chips">
          {['all', 'new', 'reviewing', 'resolved', 'dismissed'].map((st) => (
            <button
              key={st}
              type="button"
              className={`period-chip ${statusFilter === st ? 'active' : ''}`}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
            >
              {st.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="owner-loading">Loading feedback reports...</div>}

      {!loading && (
        <div className="feedback-list">
          {reports.length === 0 && <div className="empty-sub">No feedback reports found.</div>}
          {reports.map((rep) => (
            <div key={rep.id} className="feedback-card" onClick={() => handleOpenReport(rep)}>
              <div className="feedback-card-header">
                <span className={`category-tag cat-${rep.category}`}>{rep.category.toUpperCase()}</span>
                <span className={`status-pill status-${rep.status}`}>{rep.status.toUpperCase()}</span>
                <span className="feedback-time">{new Date(rep.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="feedback-card-msg">{rep.message}</p>
              <div className="feedback-card-footer">
                <span className="user-id font-mono">From: {rep.telegramUserId}</span>
                {rep.ownerResponse && <span className="replied-tag">Responded</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Feedback Review</h3>
              <button type="button" className="modal-close-btn" onClick={() => setSelectedReport(null)}>
                ✕
              </button>
            </div>

            <div className="feedback-detail-body">
              <div className="detail-meta">
                <span>Category: <strong>{selectedReport.category}</strong></span>
                <span>User ID: <strong className="font-mono">{selectedReport.telegramUserId}</strong></span>
                <span>Date: {new Date(selectedReport.createdAt).toLocaleString()}</span>
              </div>

              <div className="detail-msg-box">
                {selectedReport.message}
              </div>

              <label className="form-label">Update Status</label>
              <select className="form-select" value={targetStatus} onChange={(e) => setTargetStatus(e.target.value)}>
                <option value="new">New</option>
                <option value="reviewing">Under Review</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>

              <label className="form-label">Internal Owner Response / Note</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={responseMsg}
                onChange={(e) => setResponseMsg(e.target.value)}
                placeholder="Resolution note or planned implementation..."
              />

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setSelectedReport(null)}>
                  Close
                </button>
                <button type="button" className="btn-primary" onClick={handleUpdate} disabled={saving}>
                  {saving ? 'Updating...' : 'Save Feedback Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

