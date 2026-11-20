import { trackUserAndActivity, getAuthenticatedUser } from '../lib/session-helper.js';
import { OWNER_TELEGRAM_ID } from '../lib/users/user-service.js';

export default async function (input, ctx) {
  const user = getAuthenticatedUser(ctx);

  await trackUserAndActivity(ctx, {
    eventType: 'app_opened',
    eventCategory: 'app',
    metadata: { platform: ctx?.initData?.platform || 'unknown' },
  });

  const isOwner = String(user.id) === OWNER_TELEGRAM_ID;

  return {
    ok: true,
    isOwner,
  };
}
