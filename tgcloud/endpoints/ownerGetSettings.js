import { requireOwner } from '../lib/auth/require-owner.js';
import { getSystemSettings } from '../lib/settings/settings-service.js';

export default async function (input, ctx) {
  requireOwner(ctx);
  const settings = await getSystemSettings();
  return {
    ok: true,
    settings,
  };
}
