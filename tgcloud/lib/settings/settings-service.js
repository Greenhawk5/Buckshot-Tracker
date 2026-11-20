import { db } from 'sdk';
import { eq } from 'sdk/db';
import { appSettings } from '../../schema.js';

export const DEFAULT_SETTINGS = {
  maintenanceMode: false,
  maintenanceMessage: 'Buckshot Tracker is currently under scheduled maintenance. Please check back shortly.',
  globalBroadcastPaused: false,
  announcementBanner: '',
  announcementActive: false,
  displayTimezone: 'UTC',
  defaultBroadcastPacingMs: 100, // delay between sends to respect rate limits
  retentionDaysEvents: 90,
  retentionDaysAudit: 365,
};

/**
 * Fetches current system settings merged with safe defaults.
 */
export async function getSystemSettings() {
  try {
    const rows = await db.select().from(appSettings).all();
    const result = { ...DEFAULT_SETTINGS };
    for (const row of rows) {
      try {
        result[row.key] = JSON.parse(row.valueJson);
      } catch {
        // preserve default if corrupt
      }
    }
    return result;
  } catch (err) {
    console.error('Failed to load app settings:', err);
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Updates a specific system setting key.
 */
export async function updateSystemSetting(key, value, updatedBy) {
  const now = Date.now();
  const valueJson = JSON.stringify(value);

  const existing = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, key))
    .get();

  if (existing) {
    await db
      .update(appSettings)
      .set({
        valueJson,
        updatedBy: String(updatedBy),
        updatedAt: now,
      })
      .where(eq(appSettings.key, key))
      .run();
  } else {
    await db.insert(appSettings).values({
      key,
      valueJson,
      updatedBy: String(updatedBy),
      updatedAt: now,
    }).run();
  }
}
