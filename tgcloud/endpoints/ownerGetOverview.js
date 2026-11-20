import { requireOwner } from '../lib/auth/require-owner.js';
import { resolveTimeWindow, getAnalyticsMetrics } from '../lib/analytics/metrics-service.js';

export default async function (input, ctx) {
  requireOwner(ctx);

  const { preset = '7d', customStart, customEnd } = input || {};
  const timeWindow = resolveTimeWindow(preset, customStart, customEnd);
  const metrics = await getAnalyticsMetrics(timeWindow);

  return {
    ok: true,
    data: metrics,
  };
}

