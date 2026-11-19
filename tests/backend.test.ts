import { describe, it, expect, beforeEach } from 'vitest';
import {
  formatSessionRow,
  getAuthenticatedUserId,
  advanceIntelOnConsumption,
} from '../tgcloud/lib/session-helper.js';
import ejectShellEndpoint from '../tgcloud/endpoints/ejectShell.js';
import { memoryStore } from './sdk-mock.ts';

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

describe('Beer Ejection Endpoint Hardening Tests — tgcloud/endpoints/ejectShell.js', () => {
  const userId = '123456';
  const mockCtx = { initData: { user: { id: 123456 } } };

  beforeEach(() => {
    memoryStore.reset();
  });

  // 1. Unknown shell + unknown Position 1 → rejected with VALIDATION_ERROR
  it('1. rejects unknown shell ejection when Position 1 is unknown', async () => {
    memoryStore.tracker_sessions.set('sess_test_1', {
      id: 'sess_test_1',
      telegramUserId: userId,
      initialLive: 3,
      initialBlank: 3,
      liveRemaining: 3,
      blankRemaining: 3,
      status: 'active',
      eventsJson: '[]',
      intelJson: JSON.stringify([
        { id: 'i1', source: 'burner_phone', positionFromCurrent: 2, shellType: 'live', createdAt: 1000 },
      ]),
      version: 1,
      createdAt: 1000,
      updatedAt: 1000,
    });

    await expect(
      ejectShellEndpoint({ sessionId: 'sess_test_1', shell: 'unknown' }, mockCtx)
    ).rejects.toThrow(/cannot eject unknown shell/i);

    // Verify session remains completely unmutated
    const session = memoryStore.tracker_sessions.get('sess_test_1');
    expect(session.liveRemaining).toBe(3);
    expect(session.blankRemaining).toBe(3);
    expect(session.version).toBe(1);
    expect(JSON.parse(session.intelJson)).toHaveLength(1);
    expect(JSON.parse(session.intelJson)[0].positionFromCurrent).toBe(2);
  });

  // 2. Unknown shell + known Position 1 → handled according to the known shell type
  it('2. auto-resolves and safely ejects when Position 1 is known and unknown was passed', async () => {
    memoryStore.tracker_sessions.set('sess_test_2', {
      id: 'sess_test_2',
      telegramUserId: userId,
      initialLive: 3,
      initialBlank: 3,
      liveRemaining: 3,
      blankRemaining: 3,
      status: 'active',
      eventsJson: '[]',
      intelJson: JSON.stringify([
        { id: 'i1', source: 'burner_phone', positionFromCurrent: 1, shellType: 'live', createdAt: 1000 },
        { id: 'i2', source: 'burner_phone', positionFromCurrent: 3, shellType: 'blank', createdAt: 1000 },
      ]),
      version: 1,
      createdAt: 1000,
      updatedAt: 1000,
    });

    const res = await ejectShellEndpoint({ sessionId: 'sess_test_2', shell: 'unknown' }, mockCtx);
    expect(res.ok).toBe(true);
    expect(res.session.liveRemaining).toBe(2); // Live decremented!
    expect(res.session.blankRemaining).toBe(3);
    expect(res.session.shellIntel).toHaveLength(1);
    expect(res.session.shellIntel[0].positionFromCurrent).toBe(2); // 3 shifted to 2
    expect(res.session.events).toHaveLength(1);
    expect(res.session.events[0].shell).toBe('live'); // resolved as Live
    expect(res.session.version).toBe(2);
  });

  // 3. Invalid shell value → rejected with VALIDATION_ERROR
  it('3. rejects invalid shell values with VALIDATION_ERROR', async () => {
    memoryStore.tracker_sessions.set('sess_test_3', {
      id: 'sess_test_3',
      telegramUserId: userId,
      initialLive: 2,
      initialBlank: 2,
      liveRemaining: 2,
      blankRemaining: 2,
      status: 'active',
      eventsJson: '[]',
      intelJson: '[]',
      version: 1,
      createdAt: 1000,
      updatedAt: 1000,
    });

    await expect(
      ejectShellEndpoint({ sessionId: 'sess_test_3', shell: 'mystery' }, mockCtx)
    ).rejects.toThrow(/invalid shell type/i);
  });

  // 4. Failed ejection → no ammunition, intelligence, history, or version corruption
  it('4. guarantees no corruption occurs when ejection fails capacity check', async () => {
    // Only 1 live remaining, and it is known to be at Position 2 (upcoming)
    memoryStore.tracker_sessions.set('sess_test_4', {
      id: 'sess_test_4',
      telegramUserId: userId,
      initialLive: 1,
      initialBlank: 2,
      liveRemaining: 1,
      blankRemaining: 2,
      status: 'active',
      eventsJson: '[]',
      intelJson: JSON.stringify([
        { id: 'i1', source: 'burner_phone', positionFromCurrent: 2, shellType: 'live', createdAt: 1000 },
      ]),
      version: 3,
      createdAt: 1000,
      updatedAt: 1000,
    });

    // Trying to eject Live when the only live shell is at Position 2
    await expect(
      ejectShellEndpoint({ sessionId: 'sess_test_4', shell: 'live' }, mockCtx)
    ).rejects.toThrow(/all remaining live shells are known at upcoming positions/i);

    const session = memoryStore.tracker_sessions.get('sess_test_4');
    expect(session.liveRemaining).toBe(1);
    expect(session.blankRemaining).toBe(2);
    expect(session.version).toBe(3);
    expect(JSON.parse(session.eventsJson)).toHaveLength(0);
    expect(JSON.parse(session.intelJson)[0].positionFromCurrent).toBe(2);
  });

  // 5. Valid Live and Blank ejections → existing behavior preserved
  it('5. preserves standard valid Live and Blank ejection behavior', async () => {
    memoryStore.tracker_sessions.set('sess_test_5', {
      id: 'sess_test_5',
      telegramUserId: userId,
      initialLive: 3,
      initialBlank: 3,
      liveRemaining: 3,
      blankRemaining: 3,
      status: 'active',
      eventsJson: '[]',
      intelJson: JSON.stringify([
        { id: 'i1', source: 'burner_phone', positionFromCurrent: 2, shellType: 'blank', createdAt: 1000 },
      ]),
      version: 1,
      createdAt: 1000,
      updatedAt: 1000,
    });

    const res = await ejectShellEndpoint({ sessionId: 'sess_test_5', shell: 'blank' }, mockCtx);
    expect(res.ok).toBe(true);
    expect(res.session.liveRemaining).toBe(3);
    expect(res.session.blankRemaining).toBe(2);
    expect(res.session.shellIntel[0].positionFromCurrent).toBe(1); // 2 shifted to 1
    expect(res.session.version).toBe(2);
  });

  // 6. Idempotent repeated requests → no duplicate ejection or double decrement
  it('6. safely handles duplicate operationId without double decrements', async () => {
    memoryStore.tracker_sessions.set('sess_test_6', {
      id: 'sess_test_6',
      telegramUserId: userId,
      initialLive: 2,
      initialBlank: 2,
      liveRemaining: 2,
      blankRemaining: 2,
      status: 'active',
      eventsJson: '[]',
      intelJson: '[]',
      version: 1,
      createdAt: 1000,
      updatedAt: 1000,
    });

    const opId = 'op_eject_repeat_1';
    const firstCall = await ejectShellEndpoint(
      { sessionId: 'sess_test_6', shell: 'live', operationId: opId },
      mockCtx
    );
    expect(firstCall.session.liveRemaining).toBe(1);
    expect(firstCall.session.version).toBe(2);

    // Duplicate call with same operationId
    const secondCall = await ejectShellEndpoint(
      { sessionId: 'sess_test_6', shell: 'live', operationId: opId },
      mockCtx
    );
    expect(secondCall.session.liveRemaining).toBe(1); // not decremented twice!
    expect(secondCall.session.version).toBe(2);
  });
});

