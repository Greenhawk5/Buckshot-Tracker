import React, { useEffect, useState } from 'react';
import {
  fetchOwnerCampaigns,
  fetchOwnerCampaign,
  createOwnerCampaign,
  previewOwnerCampaign,
  startOwnerCampaign,
  pauseOwnerCampaign,
  resumeOwnerCampaign,
  cancelOwnerCampaign,
  processOwnerBroadcastBatch,
  retryOwnerCampaign,
} from '../../../services/owner.api';

export const BroadcastsView: React.FC = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Composer state
  const [showComposer, setShowComposer] = useState(false);
  const [title, setTitle] = useState('');
  const [messageType, setMessageType] = useState('text');
  const [contentText, setContentText] = useState('');
  const [segment, setSegment] = useState('all');
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Selected Campaign Execution modal
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
  const [executing, setExecuting] = useState(false);
  const [execStatus, setExecStatus] = useState<string | null>(null);

  const loadCampaigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchOwnerCampaigns(page, 15);
      setCampaigns(res.campaigns);
      setTotal(res.total);
    } catch (err: any) {
      setError(err?.message || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, [page]);

  const handlePreview = async () => {
    setPreviewLoading(true);
    try {
      const res = await previewOwnerCampaign({
        messageType,
        contentText,
        targetDefinition: { segment },
      });
      setPreviewData(res.preview);
    } catch (err: any) {
      alert(err?.message || 'Failed to preview campaign');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCreateCampaign = async (autoStart = false) => {
    if (!title.trim()) {
      alert('Campaign title is required.');
      return;
    }
    setCreating(true);
    try {
      await createOwnerCampaign({
        title,
        messageType,
        contentText,
        targetDefinition: { segment },
        autoStart,
      });
      setShowComposer(false);
      setTitle('');
      setContentText('');
      setPreviewData(null);
      loadCampaigns();
    } catch (err: any) {
      alert(err?.message || 'Failed to create campaign');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenCampaign = async (camp: any) => {
    try {
      const res = await fetchOwnerCampaign(camp.id);
      setSelectedCampaign(res);
      setExecStatus(null);
    } catch (err: any) {
      alert(err?.message || 'Failed to load campaign details');
    }
  };

  const handleRunBatch = async () => {
    if (!selectedCampaign) return;
    setExecuting(true);
    setExecStatus('Dispatching batch...');
    try {
      const batchRes = await processOwnerBroadcastBatch(selectedCampaign.campaign.id, 5);
      if (batchRes.paused) {
        setExecStatus(batchRes.reason || 'Broadcast paused.');
      } else {
        setExecStatus(
          `Processed ${batchRes.processedCount} (Sent: ${batchRes.sentDelta}, Failed: ${batchRes.failedDelta}, Remaining: ${batchRes.remainingCount})`
        );
      }
      // Refresh campaign
      const updated = await fetchOwnerCampaign(selectedCampaign.campaign.id);
      setSelectedCampaign(updated);
      loadCampaigns();
    } catch (err: any) {
      setExecStatus(`Error: ${err?.message || 'Failed batch run'}`);
    } finally {
      setExecuting(false);
    }
  };

  const handleAction = async (action: 'start' | 'pause' | 'resume' | 'cancel' | 'retry') => {
    if (!selectedCampaign) return;
    const cid = selectedCampaign.campaign.id;
    try {
      if (action === 'start') await startOwnerCampaign(cid);
      if (action === 'pause') await pauseOwnerCampaign(cid);
      if (action === 'resume') await resumeOwnerCampaign(cid);
      if (action === 'cancel') await cancelOwnerCampaign(cid);
      if (action === 'retry') await retryOwnerCampaign(cid);

      const updated = await fetchOwnerCampaign(cid);
      setSelectedCampaign(updated);
      loadCampaigns();
    } catch (err: any) {
      alert(err?.message || `Failed to ${action} campaign`);
    }
  };

  return (
    <div className="owner-view broadcasts-view">
      <div className="view-toolbar">
        <h3 className="view-title">Broadcast Campaigns ({total})</h3>
        <button type="button" className="btn-compose-campaign" onClick={() => setShowComposer(true)}>
          + New Campaign
        </button>
      </div>

      {loading && <div className="owner-loading">Loading campaigns...</div>}
      {error && <div className="owner-error">{error}</div>}

      {/* Campaigns List */}
      {!loading && (
        <div className="campaigns-list">
          {campaigns.length === 0 && (
            <div className="empty-sub">No broadcast campaigns created yet.</div>
          )}
          {campaigns.map((camp) => (
            <div key={camp.id} className="campaign-card" onClick={() => handleOpenCampaign(camp)}>
              <div className="campaign-header">
                <span className="campaign-title">{camp.title}</span>
                <span className={`status-pill status-${camp.status}`}>{camp.status.toUpperCase()}</span>
              </div>
              <div className="campaign-meta">
                <span className="type-tag">{camp.messageType}</span>
                <span>Recipients: {camp.totalRecipients}</span>
                <span className="sent-tag">Sent: {camp.sentCount}</span>
                {camp.failedCount > 0 && <span className="failed-tag">Failed: {camp.failedCount}</span>}
                <span className="date-tag">{new Date(camp.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Composer Modal */}
      {showComposer && (
        <div className="modal-overlay" onClick={() => setShowComposer(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Compose Multimedia Broadcast</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowComposer(false)}>
                ✕
              </button>
            </div>

            <div className="composer-form">
              <label className="form-label">Campaign Title (Internal)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Tactical Intel Update v1.2.0"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <label className="form-label">Message Type</label>
              <div className="category-chips">
                {['text', 'photo', 'video', 'voice', 'video_note', 'document'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`category-chip ${messageType === type ? 'active' : ''}`}
                    onClick={() => setMessageType(type)}
                  >
                    {type.toUpperCase()}
                  </button>
                ))}
              </div>

              <label className="form-label">Target Audience Segment</label>
              <select className="form-select" value={segment} onChange={(e) => setSegment(e.target.value)}>
                <option value="all">All Eligible Users (Excl. Owner)</option>
                <option value="active_7d">Active in Last 7 Days</option>
                <option value="active_30d">Active in Last 30 Days</option>
                <option value="inactive_30d">Inactive Users (30+ days)</option>
                <option value="new_7d">New Players (Registered &lt; 7d)</option>
                <option value="vip">⭐ VIP Playtesters Only</option>
              </select>

              <label className="form-label">Message Content / Caption (HTML Supported)</label>
              <textarea
                className="form-textarea"
                rows={4}
                placeholder="Write message in HTML: <b>Bold</b>, <i>Italic</i>, or plaintext..."
                value={contentText}
                onChange={(e) => setContentText(e.target.value)}
              />

              <div className="composer-preview-box">
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={handlePreview}
                  disabled={previewLoading}
                >
                  {previewLoading ? 'Calculating...' : 'Preview Target Audience Count'}
                </button>
                {previewData && (
                  <div className="preview-results">
                    Target recipients: <strong>{previewData.totalRecipients}</strong> players
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowComposer(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={creating || !title.trim()}
                  onClick={() => handleCreateCampaign(false)}
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={creating || !title.trim()}
                  onClick={() => handleCreateCampaign(true)}
                >
                  {creating ? 'Creating...' : 'Queue & Start'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Details & Execution Modal */}
      {selectedCampaign && (
        <div className="modal-overlay" onClick={() => setSelectedCampaign(null)}>
          <div className="modal-content campaign-exec-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{selectedCampaign.campaign.title}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setSelectedCampaign(null)}>
                ✕
              </button>
            </div>

            <div className="campaign-exec-body">
              <div className="status-banner">
                <span>Status: <strong>{selectedCampaign.campaign.status.toUpperCase()}</strong></span>
                <span>Type: <strong>{selectedCampaign.campaign.messageType}</strong></span>
                <span>Total: <strong>{selectedCampaign.campaign.totalRecipients}</strong></span>
              </div>

              {/* Progress bar */}
              <div className="progress-bar-wrap">
                <div
                  className="progress-fill progress-sent"
                  style={{
                    width: `${Math.round(
                      (selectedCampaign.campaign.sentCount /
                        Math.max(selectedCampaign.campaign.totalRecipients, 1)) *
                        100
                    )}%`,
                  }}
                />
              </div>

              <div className="progress-labels">
                <span>Sent: {selectedCampaign.campaign.sentCount}</span>
                <span>Failed: {selectedCampaign.campaign.failedCount}</span>
                <span>
                  Remaining:{' '}
                  {Math.max(
                    0,
                    selectedCampaign.campaign.totalRecipients -
                      selectedCampaign.campaign.sentCount -
                      selectedCampaign.campaign.failedCount
                  )}
                </span>
              </div>

              {execStatus && <div className="exec-status-box">{execStatus}</div>}

              {/* Action Controls */}
              <div className="exec-controls">
                {selectedCampaign.campaign.status === 'draft' && (
                  <button type="button" className="btn-primary" onClick={() => handleAction('start')}>
                    Start Campaign
                  </button>
                )}

                {(selectedCampaign.campaign.status === 'queued' ||
                  selectedCampaign.campaign.status === 'running') && (
                  <>
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={executing}
                      onClick={handleRunBatch}
                    >
                      {executing ? 'Processing Batch...' : 'Process Next Batch (5)'}
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => handleAction('pause')}>
                      Pause
                    </button>
                    <button type="button" className="btn-danger" onClick={() => handleAction('cancel')}>
                      Cancel
                    </button>
                  </>
                )}

                {selectedCampaign.campaign.status === 'paused' && (
                  <>
                    <button type="button" className="btn-primary" onClick={() => handleAction('resume')}>
                      Resume
                    </button>
                    <button type="button" className="btn-danger" onClick={() => handleAction('cancel')}>
                      Cancel
                    </button>
                  </>
                )}

                {(selectedCampaign.campaign.status === 'completed_with_errors' ||
                  selectedCampaign.campaign.status === 'completed') && (
                  <button type="button" className="btn-secondary" onClick={() => handleAction('retry')}>
                    Retry Eligible Failures
                  </button>
                )}
              </div>

              {/* Recipient Outcomes Summary */}
              <div className="recipient-summary-box">
                <h4>Recipient Status Counts</h4>
                <div className="summary-chips">
                  {Object.entries(selectedCampaign.statusSummary).map(([st, cnt]: [string, any]) => (
                    <span key={st} className={`summary-chip chip-${st}`}>
                      {st}: {cnt}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
