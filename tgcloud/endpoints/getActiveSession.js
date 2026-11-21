import { db } from 'sdk';
import { eq, and, desc } from 'sdk/db';
import { trackerSessions } from '../schema.js';
import { getAuthenticatedUserId, formatSessionRow, trackUserAndActivity } from '../lib/session-helper.js';
import { getSystemSettings } from '../lib/settings/settings-service.js';

export default async function (input, ctx) {
  const userId = getAuthenticatedUserId(ctx);

  // Update user last seen
  await trackUserAndActivity(ctx);

  const settings = await getSystemSettings();

  const row = await db
    .select()
    .from(trackerSessions)
    .where(and(eq(trackerSessions.telegramUserId, userId), eq(trackerSessions.status, 'active')))
    .orderBy(desc(trackerSessions.updatedAt))
    .get();

  return {
    ok: true,
    session: formatSessionRow(row),
    maintenance: {
      active: Boolean(settings.maintenanceMode),
      message: settings.maintenanceMessage,
    },
  };
}
