import { describe, it, expect } from 'vitest';
import {
  createNewSession,
  recordShot,
  undoLastAction,
  calculateProbability,
} from './tracker.logic';
import { validateInitialCounts, validateSessionInvariants } from './tracker.validation';
import { trackerReducer, initialTrackerState } from './tracker.reducer';

describe('Tracker Counting Engine — Phase 3 Specification Tests', () => {
  // 1. Create a session with valid counts
  it('1. creates a session with valid counts', () => {
    const session = createNewSession({ initialLive: 4, initialBlank: 3, telegramUserId: 'user_123' });
    expect(session.id).toBeDefined();
    expect(session.telegramUserId).toBe('user_123');
    expect(session.initialLive).toBe(4);
    expect(session.initialBlank).toBe(3);
    expect(session.liveRemaining).toBe(4);
    expect(session.blankRemaining).toBe(3);
    expect(session.status).toBe('active');
    expect(session.events).toHaveLength(0);
    expect(session.version).toBe(1);
    expect(validateSessionInvariants(session).valid).toBe(true);
  });

  // 2. Reject negative counts
  it('2. rejects negative counts', () => {
    expect(() => createNewSession({ initialLive: -1, initialBlank: 3 })).toThrow(/non-negative/i);
    expect(() => createNewSession({ initialLive: 2, initialBlank: -2 })).toThrow(/non-negative/i);
    expect(validateInitialCounts(-1, 2).valid).toBe(false);
  });

  // 3. Reject non-integer counts
  it('3. rejects non-integer counts', () => {
    expect(() => createNewSession({ initialLive: 2.5, initialBlank: 2 })).toThrow(/integer/i);
    expect(() => createNewSession({ initialLive: 3, initialBlank: 1.1 })).toThrow(/integer/i);
    expect(validateInitialCounts(3.14, 2).valid).toBe(false);
  });

  // 4. Reject an invalid total (e.g. 0 total)
  it('4. rejects an invalid total (zero ammunition)', () => {
    expect(() => createNewSession({ initialLive: 0, initialBlank: 0 })).toThrow(/greater than zero/i);
    expect(validateInitialCounts(0, 0).valid).toBe(false);
  });

  // 5. Record a live shot
  it('5. records a live shot and decrements only live count', () => {
    const session = createNewSession({ initialLive: 3, initialBlank: 3 });
    const afterLive = recordShot(session, 'live');

    expect(afterLive.liveRemaining).toBe(2);
    expect(afterLive.blankRemaining).toBe(3);
    expect(afterLive.events).toHaveLength(1);
    expect(afterLive.events[0].type).toBe('shot');
    expect((afterLive.events[0] as { shell: string }).shell).toBe('live');
    expect(afterLive.version).toBe(session.version + 1);
    expect(validateSessionInvariants(afterLive).valid).toBe(true);
  });

  // 6. Record a blank shot
  it('6. records a blank shot and decrements only blank count', () => {
    const session = createNewSession({ initialLive: 2, initialBlank: 4 });
    const afterBlank = recordShot(session, 'blank');

    expect(afterBlank.liveRemaining).toBe(2);
    expect(afterBlank.blankRemaining).toBe(3);
    expect(afterBlank.events).toHaveLength(1);
    expect((afterBlank.events[0] as { shell: string }).shell).toBe('blank');
    expect(validateSessionInvariants(afterBlank).valid).toBe(true);
  });

  // 7. Reject a live shot when no live shells remain
  it('7. rejects a live shot when live count is zero', () => {
    const session = createNewSession({ initialLive: 0, initialBlank: 3 });
    expect(() => recordShot(session, 'live')).toThrow(/no live shells remaining/i);
  });

  // 8. Reject a blank shot when no blank shells remain
  it('8. rejects a blank shot when blank count is zero', () => {
    const session = createNewSession({ initialLive: 3, initialBlank: 0 });
    expect(() => recordShot(session, 'blank')).toThrow(/no blank shells remaining/i);
  });

  // 9. Ensure counts never become negative
  it('9. ensures counts never become negative through repeated actions', () => {
    let session = createNewSession({ initialLive: 1, initialBlank: 1 });
    session = recordShot(session, 'live');
    expect(session.liveRemaining).toBe(0);
    expect(() => recordShot(session, 'live')).toThrow();
    expect(session.liveRemaining).toBe(0);
  });

  // 10. Calculate remaining totals correctly
  it('10. calculates total remaining shells correctly', () => {
    let session = createNewSession({ initialLive: 4, initialBlank: 4 });
    const prob1 = calculateProbability(session);
    expect(prob1?.totalRemaining).toBe(8);

    session = recordShot(session, 'live');
    session = recordShot(session, 'blank');
    const prob2 = calculateProbability(session);
    expect(prob2?.totalRemaining).toBe(6);
  });

  // 11. Calculate live/blank percentages correctly
  it('11. calculates live and blank probability percentages correctly', () => {
    // 3 live, 1 blank -> 75% live, 25% blank
    const session = createNewSession({ initialLive: 3, initialBlank: 1 });
    const prob = calculateProbability(session);
    expect(prob).not.toBeNull();
    expect(prob?.livePercentage).toBe(75);
    expect(prob?.blankPercentage).toBe(25);
    expect(prob?.totalRemaining).toBe(4);
  });

  // 12. Undo a live shot
  it('12. undoes a live shot and restores live count', () => {
    const s0 = createNewSession({ initialLive: 2, initialBlank: 2 });
    const s1 = recordShot(s0, 'live');
    expect(s1.liveRemaining).toBe(1);

    const s2 = undoLastAction(s1);
    expect(s2.liveRemaining).toBe(2);
    expect(s2.blankRemaining).toBe(2);
    expect(s2.events).toHaveLength(0);
    expect(s2.version).toBe(s1.version + 1);
    expect(validateSessionInvariants(s2).valid).toBe(true);
  });

  // 13. Undo a blank shot
  it('13. undoes a blank shot and restores blank count', () => {
    const s0 = createNewSession({ initialLive: 2, initialBlank: 2 });
    const s1 = recordShot(s0, 'blank');
    expect(s1.blankRemaining).toBe(1);

    const s2 = undoLastAction(s1);
    expect(s2.liveRemaining).toBe(2);
    expect(s2.blankRemaining).toBe(2);
    expect(s2.events).toHaveLength(0);
    expect(validateSessionInvariants(s2).valid).toBe(true);
  });

  // 14. Reject undo when no reversible event exists
  it('14. rejects undo when no reversible events exist', () => {
    const session = createNewSession({ initialLive: 2, initialBlank: 2 });
    expect(() => undoLastAction(session)).toThrow(/no reversible action/i);
  });

  // 15. Mark a session completed when all shells are consumed
  it('15. marks session as completed when all shells reach zero', () => {
    let session = createNewSession({ initialLive: 1, initialBlank: 1 });
    expect(session.status).toBe('active');

    session = recordShot(session, 'live');
    expect(session.status).toBe('active');

    session = recordShot(session, 'blank');
    expect(session.liveRemaining).toBe(0);
    expect(session.blankRemaining).toBe(0);
    expect(session.status).toBe('completed');

    // Attempting a shot in completed session throws
    expect(() => recordShot(session, 'live')).toThrow(/completed/i);

    // Undoing restores active status
    const undone = undoLastAction(session);
    expect(undone.status).toBe('active');
    expect(undone.blankRemaining).toBe(1);
  });

  // 16. Start a new session without corrupting previous session
  it('16. starts a new session independently without mutating previous session data', () => {
    const s1 = createNewSession({ initialLive: 2, initialBlank: 2, operationId: 'session_1' });
    const s1Shot = recordShot(s1, 'live');

    const s2 = createNewSession({ initialLive: 4, initialBlank: 4, operationId: 'session_2' });

    expect(s1Shot.id).toBe('session_1');
    expect(s1Shot.liveRemaining).toBe(1);
    expect(s1Shot.events).toHaveLength(1);

    expect(s2.id).toBe('session_2');
    expect(s2.liveRemaining).toBe(4);
    expect(s2.events).toHaveLength(0);
  });

  // Reducer tests
  it('correctly handles state transitions in trackerReducer', () => {
    let state = trackerReducer(initialTrackerState, {
      type: 'CREATE_SESSION',
      payload: { initialLive: 3, initialBlank: 2 },
    });
    expect(state.session?.liveRemaining).toBe(3);
    expect(state.error).toBeNull();

    state = trackerReducer(state, {
      type: 'RECORD_SHOT',
      payload: { shell: 'live' },
    });
    expect(state.session?.liveRemaining).toBe(2);

    state = trackerReducer(state, {
      type: 'UNDO_ACTION',
    });
    expect(state.session?.liveRemaining).toBe(3);

    state = trackerReducer(state, {
      type: 'RESET_SESSION',
    });
    expect(state.session).toBeNull();
  });
});
