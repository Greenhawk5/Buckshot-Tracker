export const VALID_MESSAGE_TYPES = new Set([
  'text',
  'photo',
  'video',
  'voice',
  'video_note',
  'document',
]);

export const CAMPAIGN_STATUS = {
  DRAFT: 'draft',
  QUEUED: 'queued',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  COMPLETED_WITH_ERRORS: 'completed_with_errors',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

export const RECIPIENT_STATUS = {
  PENDING: 'pending',
  SENDING: 'sending',
  SENT: 'sent',
  FAILED_RETRYABLE: 'failed_retryable',
  FAILED_PERMANENT: 'failed_permanent',
  SKIPPED: 'skipped',
  CANCELLED: 'cancelled',
};

const ALLOWED_TRANSITIONS = {
  draft: ['queued', 'cancelled'],
  queued: ['running', 'paused', 'cancelled'],
  running: ['paused', 'completed', 'completed_with_errors', 'failed', 'cancelled'],
  paused: ['running', 'cancelled'],
  completed: [],
  completed_with_errors: [],
  failed: [],
  cancelled: [],
};

export function canTransitionCampaign(currentStatus, nextStatus) {
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  return allowed.includes(nextStatus);
}
