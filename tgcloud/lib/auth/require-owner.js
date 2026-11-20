import { EndpointError } from 'sdk';

export const OWNER_TELEGRAM_ID = '184202422';

/**
 * Shared, cryptographically-grounded owner authorization guard.
 * Extracts the platform-verified caller identity from ctx.initData.user.
 * Never trusts client-supplied IDs, query strings, headers, or body attributes.
 */
export function requireOwner(ctx) {
  const user = ctx?.initData?.user;
  if (!user || user.id === undefined || user.id === null) {
    throw new EndpointError('Unauthorized: Telegram user context is required.', {
      code: 'UNAUTHORIZED',
    });
  }

  const callerIdStr = String(user.id);
  if (callerIdStr !== OWNER_TELEGRAM_ID) {
    throw new EndpointError('Forbidden: Owner authorization required.', {
      code: 'FORBIDDEN',
    });
  }

  return user;
}

