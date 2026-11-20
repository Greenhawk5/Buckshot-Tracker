import React, { useState } from 'react';
import { submitRemoteFeedback } from '../../../services/session.api';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [category, setCategory] = useState<'bug' | 'feature' | 'general'>('general');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || message.length < 3) {
      setError('Please provide at least 3 characters.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await submitRemoteFeedback(category, message);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setMessage('');
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="feedback-modal-overlay" onClick={onClose}>
      <div className="feedback-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Send Feedback or Report Bug</h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {success ? (
          <div className="feedback-success-state">
            <span className="success-icon">✓</span>
            <p>Thank you! Your feedback has been recorded.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="feedback-form">
            <div className="form-group">
              <label className="form-label">Category</label>
              <div className="category-chips">
                {(['general', 'bug', 'feature'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`category-chip ${category === cat ? 'active' : ''}`}
                    onClick={() => setCategory(cat)}
                  >
                    {cat === 'bug' ? '🐛 Bug Report' : cat === 'feature' ? '💡 Feature Request' : '💬 General Feedback'}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Message</label>
              <textarea
                className="feedback-textarea"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue or suggestion..."
                maxLength={2000}
                required
              />
              <span className="char-count">{message.length}/2000</span>
            </div>

            {error && <div className="form-error">{error}</div>}

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={submitting || !message.trim()}>
                {submitting ? 'Submitting...' : 'Send Feedback'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
