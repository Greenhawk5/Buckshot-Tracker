import { describe, it, expect } from 'vitest';
import {
  formatSessionRow,
  getAuthenticatedUserId,
  advanceIntelOnConsumption,
} from '../tgcloud/lib/session-helper.js';

describe('Backend Logic & API Contract Tests — Phase 4 Specification', () => {
  it('enforces authentication and throws UNAUTHORIZED when ctx.initData.user is absent', () => {
    expect(() => getAuthenticatedUserId(null)).toThrow(/unauthorized/i);
    expect(() => getAuthenticatedUserId({})).toThrow(/unauthorized/i);
    expect(() => getAuthenticatedUserId({ initData: {} })).toThrow(/unauthorized/i);
    expect(() => getAuthenticatedUserId({ initData: { user: null } })).toThrow(/unauthorized/i);
  });

  it('correctly extracts telegramUserId when user is present', () => {
    const userId = getAuthenticatedUserId({
      initData: { user: { id: 987654321, first_name: 'Hunter' } },
    });
    expect(userId).toBe('987654321');
  });

  it('formats SQLite database session row into TrackerSession model with parsed events and shellIntel', () => {
    const rawRow = {
      id: 'sess_1',
      telegramUserId: '987654321',
      initialLive: 3,
      initialBlank: 2,
      liveRemaining: 2,
      blankRemaining: 2,
      status: 'active',
      eventsJson: JSON.stringify([
        { id: 'op_1', type: 'shot', shell: 'live', createdAt: 1000 },
      ]),
      intelJson: JSON.stringify([
        { id: 'intel_1', source: 'burner_phone', positionFromCurrent: 2, shellType: 'blank', createdAt: 1000 },
      ]),
      version: 2,
      createdAt: 1000,
      updatedAt: 1050,
    };

    const formatted = formatSessionRow(rawRow);
    expect(formatted).not.toBeNull();
    expect(formatted?.id).toBe('sess_1');
    expect(formatted?.liveRemaining).toBe(2);
    expect(formatted?.events).toHaveLength(1);
    expect(formatted?.events[0].id).toBe('op_1');
    expect(formatted?.shellIntel).toHaveLength(1);
    expect(formatted?.shellIntel[0].positionFromCurrent).toBe(2);
    expect(formatted?.shellIntel[0].shellType).toBe('blank');
    expect(formatted?.version).toBe(2);
  });

  it('gracefully handles empty, null, or corrupted intelJson in session row (backward compatibility)', () => {
    const rawRow = {
      id: 'sess_2',
      telegramUserId: '987654321',
      initialLive: 1,
      initialBlank: 1,
      liveRemaining: 1,
      blankRemaining: 1,
      status: 'active',
      eventsJson: 'corrupted-json{',
      intelJson: null,
      version: 1,
      createdAt: 1000,
      updatedAt: 1000,
    };

    const formatted = formatSessionRow(rawRow);
    expect(formatted?.events).toEqual([]);
    expect(formatted?.shellIntel).toEqual([]);
  });

  it('advances server-side shell intelligence on consumption properly', () => {
    const mockIntel = [
      { id: 'i1', source: 'burner_phone', positionFromCurrent: 1, shellType: 'blank', createdAt: 100 },
      { id: 'i2', source: 'burner_phone', positionFromCurrent: 3, shellType: 'live', createdAt: 100 },
    ];

    const advanced = advanceIntelOnConsumption(mockIntel);
    expect(advanced).toHaveLength(1);
    expect(advanced[0].id).toBe('i2');
    expect(advanced[0].positionFromCurrent).toBe(2);
  });
});
