import { EndpointError } from 'sdk';

export function getAuthenticatedUserId(ctx) {
  const user = ctx?.initData?.user;
  if (!user || user.id === undefined || user.id === null) {
    throw new EndpointError('Unauthorized: Telegram user context is required.', {
      code: 'UNAUTHORIZED',
    });
  }
  return String(user.id);
}

export function advanceIntelOnConsumption(intelList) {
  if (!Array.isArray(intelList) || intelList.length === 0) return [];
  return intelList
    .filter((intel) => intel.positionFromCurrent > 1)
    .map((intel) => ({
      ...intel,
      positionFromCurrent: intel.positionFromCurrent - 1,
    }))
    .sort((a, b) => a.positionFromCurrent - b.positionFromCurrent);
}

export function formatSessionRow(row) {
  if (!row) return null;
  let events = [];
  try {
    events = JSON.parse(row.eventsJson || '[]');
  } catch {
    events = [];
  }

  let shellIntel = [];
  try {
    shellIntel = JSON.parse(row.intelJson || '[]');
  } catch {
    shellIntel = [];
  }

  return {
    id: row.id,
    telegramUserId: row.telegramUserId,
    initialLive: row.initialLive,
    initialBlank: row.initialBlank,
    liveRemaining: row.liveRemaining,
    blankRemaining: row.blankRemaining,
    status: row.status,
    events,
    shellIntel,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
