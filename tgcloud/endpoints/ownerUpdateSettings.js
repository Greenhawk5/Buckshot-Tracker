import { EndpointError } from 'sdk';
import { requireOwner } from '../lib/auth/require-owner.js';
import { updateSystemSetting, getSystemSettings, DEFAULT_SETTINGS } from '../lib/settings/settings-service.js';
import { recordAuditLog } from '../lib/audit/audit-service.js';

export default async function (input, ctx) {
  const owner = requireOwner(ctx);
  const { settings = {} } = input || {};

  if (!settings || typeof settings !== 'object') {
    throw new EndpointError('Settings payload must be an object', { code: 'VALIDATION_ERROR' });
  }

  const validKeys = Object.keys(DEFAULT_SETTINGS);
  const updatedKeys = [];

  for (const [key, val] of Object.entries(settings)) {
    if (validKeys.includes(key)) {
      await updateSystemSetting(key, val, owner.id);
      updatedKeys.push(key);
    }
  }

  await recordAuditLog({
    actorTelegramId: owner.id,
    action: 'update_settings',
    targetType: 'system_settings',
    details: { updatedKeys },
  });

  const currentSettings = await getSystemSettings();

  return {
    ok: true,
    settings: currentSettings,
  };
}
