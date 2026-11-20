import { trackUserAndActivity, getAuthenticatedUser } from '../lib/session-helper.js';
import { OWNER_TELEGRAM_ID } from '../lib/users/user-service.js';
import { getSystemSettings } from '../lib/settings/settings-service.js';

export default async function (input, ctx) {
  const user = getAuthenticatedUser(ctx);

  await trackUserAndActivity(ctx, {
    eventType: 'app_opened',
    eventCategory: 'app',
    metadata: { platform: ctx?.initData?.platform || 'unknown' },
  });

  const isOwner = String(user.id) === OWNER_TELEGRAM_ID;
  const settings = await getSystemSettings();

  return {
    ok: true,
    isOwner,
    maintenance: {
      active: Boolean(settings.maintenanceMode),
      message: settings.maintenanceMessage,
    },
  };
}

