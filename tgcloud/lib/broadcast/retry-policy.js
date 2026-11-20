/**
 * Classifies Telegram Bot API errors into retryable vs permanent failures.
 *
 * Permanent (failed_permanent):
 * - 403 Forbidden: "bot was blocked by the user", "user is deactivated"
 * - 400 Bad Request: "chat not found", "wrong file identifier/HTTP URL"
 *
 * Retryable (failed_retryable):
 * - 429 Too Many Requests: Rate limit exceeded, respects retry_after parameter
 * - 5xx Server Error: Internal Telegram failure
 * - Network timeouts / transient connection drops
 */
export function classifyTelegramError(err, currentAttempts = 0) {
  const code = err?.code || 500;
  const description = String(err?.description || err?.message || 'Unknown error');
  const lowerDesc = description.toLowerCase();

  // Permanent failure signatures
  if (
    code === 403 ||
    lowerDesc.includes('bot was blocked') ||
    lowerDesc.includes('user is deactivated') ||
    lowerDesc.includes('chat not found') ||
    (code === 400 && lowerDesc.includes('chat not found'))
  ) {
    return {
      isRetryable: false,
      code,
      description: description.slice(0, 255),
      nextAttemptAt: 0,
    };
  }

  // Max attempts exceeded (3 tries)
  if (currentAttempts >= 3) {
    return {
      isRetryable: false,
      code,
      description: `Max retry attempts (3) exceeded: ${description.slice(0, 200)}`,
      nextAttemptAt: 0,
    };
  }

  // Rate-limited 429
  let backoffMs = 2000;
  if (code === 429 && err?.parameters?.retry_after) {
    backoffMs = Number(err.parameters.retry_after) * 1000 + 500;
  } else {
    // Exponential backoff
    backoffMs = (currentAttempts + 1) * 3000;
  }

  return {
    isRetryable: true,
    code,
    description: description.slice(0, 255),
    nextAttemptAt: Date.now() + backoffMs,
  };
}
