import { describe, it, expect } from 'vitest';
import {
  createNewSession,
  recordShot,
  ejectShell,
  addShellIntel,
  removeShellIntel,
  undoLastAction,
} from './tracker.logic';
import { validateAddIntel, canEjectShell, validateSessionInvariants } from './tracker.validation';
import { trackerReducer, initialTrackerState } from './tracker.reducer';

describe('Burner Phone Intelligence & Shell Advancement Engine', () => {
  // 1. Record a valid Live revelation
  it('1. records a valid Live revelation at position 2', () => {
    const session = createNewSession({ initialLive: 3, initialBlank: 3 });
    const updated = addShellIntel(session, { positionFromCurrent: 2, shellType: 'live' });

    expect(updated.shellIntel).toHaveLength(1);
    expect(updated.shellIntel[0].positionFromCurrent).toBe(2);
    expect(updated.shellIntel[0].shellType).toBe('live');
    expect(updated.shellIntel[0].source).toBe('burner_phone');
    expect(updated.version).toBe(session.version + 1);
    expect(validateSessionInvariants(updated).valid).toBe(true);
  });

  // 2. Record a valid Blank revelation
  it('2. records a valid Blank revelation at position 3', () => {
    const session = createNewSession({ initialLive: 3, initialBlank: 3 });
    const updated = addShellIntel(session, { positionFromCurrent: 3, shellType: 'blank' });

    expect(updated.shellIntel).toHaveLength(1);
    expect(updated.shellIntel[0].positionFromCurrent).toBe(3);
    expect(updated.shellIntel[0].shellType).toBe('blank');
    expect(validateSessionInvariants(updated).valid).toBe(true);
  });

  // 3. Reject invalid position (position < 2 in singleplayer, < 3 in multiplayer)
  it('3. rejects position 1 in singleplayer and position 2 in multiplayer', () => {
    const session = createNewSession({ initialLive: 3, initialBlank: 3 });

    // Position 1 is reserved for Magnifying Glass
    expect(() => addShellIntel(session, { positionFromCurrent: 1, shellType: 'live' })).toThrow(
      /cannot reveal the currently chambered shell/i
    );
    expect(validateAddIntel(session, { positionFromCurrent: 1, shellType: 'live' }).allowed).toBe(false);

    // In multiplayer mode, position 2 is rejected (earliest is 3)
    expect(() =>
      addShellIntel(session, { positionFromCurrent: 2, shellType: 'live', mode: 'multiplayer' })
    ).toThrow(/earliest position is 3rd shell in multiplayer/i);
  });

  // 4. Reject position beyond remaining chamber
  it('4. rejects position outside remaining chamber', () => {
    const session = createNewSession({ initialLive: 2, initialBlank: 2 }); // total 4
    expect(() => addShellIntel(session, { positionFromCurrent: 5, shellType: 'live' })).toThrow(
      /exceeds total remaining shells/i
    );
    expect(validateAddIntel(session, { positionFromCurrent: 5, shellType: 'live' }).allowed).toBe(false);
  });

  // 5. Reject Burner Phone when fewer than 2 shells remain
  it('5. rejects Burner Phone when fewer than 2 shells remain ("How unfortunate...")', () => {
    const session = createNewSession({ initialLive: 1, initialBlank: 0 }); // total 1
    expect(() => addShellIntel(session, { positionFromCurrent: 2, shellType: 'live' })).toThrow(
      /How unfortunate/i
    );
  });

  // 6. Reject duplicate records
  it('6. rejects duplicate revelation for the same position and shell type', () => {
    let session = createNewSession({ initialLive: 3, initialBlank: 3 });
    session = addShellIntel(session, { positionFromCurrent: 2, shellType: 'blank' });

    expect(() => addShellIntel(session, { positionFromCurrent: 2, shellType: 'blank' })).toThrow(
      /already recorded/i
    );
  });

  // 7. Reject contradictory records at the same position
  it('7. rejects contradictory revelation at an already known position', () => {
    let session = createNewSession({ initialLive: 3, initialBlank: 3 });
    session = addShellIntel(session, { positionFromCurrent: 2, shellType: 'blank' });

    expect(() => addShellIntel(session, { positionFromCurrent: 2, shellType: 'live' })).toThrow(
      /Conflict: Position 2 is already recorded as BLANK/i
    );
  });

  // 8. Reject revelation incompatible with aggregate composition
  it('8. rejects revelation incompatible with aggregate composition', () => {
    // 3 live, 1 blank remaining
    let session = createNewSession({ initialLive: 3, initialBlank: 1 });
    session = addShellIntel(session, { positionFromCurrent: 2, shellType: 'blank' });

    // Attempting to record another blank when only 1 blank exists in chamber
    expect(() => addShellIntel(session, { positionFromCurrent: 4, shellType: 'blank' })).toThrow(
      /all 1 remaining blank shell\(s\) are already known/i
    );
  });

  // 9. Record multiple known positions sorted ascending
  it('9. records multiple known positions and keeps them sorted by position', () => {
    let session = createNewSession({ initialLive: 4, initialBlank: 4 });
    session = addShellIntel(session, { positionFromCurrent: 5, shellType: 'live' });
    session = addShellIntel(session, { positionFromCurrent: 2, shellType: 'blank' });
    session = addShellIntel(session, { positionFromCurrent: 3, shellType: 'live' });

    expect(session.shellIntel).toHaveLength(3);
    expect(session.shellIntel[0].positionFromCurrent).toBe(2);
    expect(session.shellIntel[0].shellType).toBe('blank');
    expect(session.shellIntel[1].positionFromCurrent).toBe(3);
    expect(session.shellIntel[1].shellType).toBe('live');
    expect(session.shellIntel[2].positionFromCurrent).toBe(5);
    expect(session.shellIntel[2].shellType).toBe('live');
  });

  // 10. Remove individual shell intel
  it('10. removes an individual intelligence record by id', () => {
    let session = createNewSession({ initialLive: 3, initialBlank: 3 });
    session = addShellIntel(session, { positionFromCurrent: 2, shellType: 'live' }, 'intel_1');
    session = addShellIntel(session, { positionFromCurrent: 3, shellType: 'blank' }, 'intel_2');

    expect(session.shellIntel).toHaveLength(2);
    session = removeShellIntel(session, 'intel_1');

    expect(session.shellIntel).toHaveLength(1);
    expect(session.shellIntel[0].id).toBe('intel_2');
    expect(session.shellIntel[0].positionFromCurrent).toBe(3);
  });

  // 11. Advancing positions after a shot
  it('11. advances relative positions after a shot (pos 2 becomes pos 1)', () => {
    let session = createNewSession({ initialLive: 3, initialBlank: 3 });
    session = addShellIntel(session, { positionFromCurrent: 2, shellType: 'blank' });
    session = addShellIntel(session, { positionFromCurrent: 4, shellType: 'live' });

    // Fire 1 shot (assume live was shot)
    session = recordShot(session, 'live');

    expect(session.shellIntel).toHaveLength(2);
    // Position 2 is now Position 1 (CURRENT SHELL!)
    expect(session.shellIntel[0].positionFromCurrent).toBe(1);
    expect(session.shellIntel[0].shellType).toBe('blank');
    // Position 4 is now Position 3
    expect(session.shellIntel[1].positionFromCurrent).toBe(3);
    expect(session.shellIntel[1].shellType).toBe('live');
  });

  // 12. Consuming position 1 intel on shot
  it('12. consumes and removes intelligence when its shell reaches position 1 and is fired', () => {
    let session = createNewSession({ initialLive: 3, initialBlank: 3 });
    session = addShellIntel(session, { positionFromCurrent: 2, shellType: 'blank' });

    // Shot 1: advances pos 2 -> pos 1
    session = recordShot(session, 'live');
    expect(session.shellIntel[0].positionFromCurrent).toBe(1);

    // Shot 2: fires position 1 (which is blank)
    session = recordShot(session, 'blank');
    expect(session.shellIntel).toHaveLength(0); // consumed!
  });

  // 13. Undo restores previous intelligence positions exactly
  it('13. undos a shot and restores previous intelligence positions exactly', () => {
    let session = createNewSession({ initialLive: 3, initialBlank: 3 });
    session = addShellIntel(session, { positionFromCurrent: 2, shellType: 'blank' });
    session = addShellIntel(session, { positionFromCurrent: 4, shellType: 'live' });

    const originalIntel = [...session.shellIntel];

    // Fire shot
    session = recordShot(session, 'live');
    expect(session.shellIntel[0].positionFromCurrent).toBe(1);
    expect(session.shellIntel[1].positionFromCurrent).toBe(3);

    // Undo shot
    session = undoLastAction(session);

    expect(session.shellIntel).toHaveLength(2);
    expect(session.shellIntel[0].positionFromCurrent).toBe(originalIntel[0].positionFromCurrent);
    expect(session.shellIntel[0].shellType).toBe(originalIntel[0].shellType);
    expect(session.shellIntel[1].positionFromCurrent).toBe(originalIntel[1].positionFromCurrent);
    expect(session.shellIntel[1].shellType).toBe(originalIntel[1].shellType);
    expect(session.liveRemaining).toBe(3);
    expect(session.blankRemaining).toBe(3);
  });

  // 14. Ejecting a shell with Beer advances positions
  it('14. ejects a shell with Beer and advances surviving positions', () => {
    let session = createNewSession({ initialLive: 3, initialBlank: 3 });
    session = addShellIntel(session, { positionFromCurrent: 3, shellType: 'blank' });

    expect(canEjectShell(session, 'live').allowed).toBe(true);
    session = ejectShell(session, 'live');

    expect(session.liveRemaining).toBe(2);
    expect(session.blankRemaining).toBe(3);
    expect(session.shellIntel).toHaveLength(1);
    expect(session.shellIntel[0].positionFromCurrent).toBe(2); // shifted 3 -> 2
    expect(session.events[0].type).toBe('eject');
  });

  // 15. Ejecting when position 1 is known auto-infers shell type if unknown was passed
  it('15. auto-infers shell type if position 1 is known and unknown is passed to eject', () => {
    let session = createNewSession({ initialLive: 3, initialBlank: 3 });
    session = addShellIntel(session, { positionFromCurrent: 2, shellType: 'live' });

    // Fire 1 shot to advance to pos 1
    session = recordShot(session, 'blank');
    expect(session.shellIntel[0].positionFromCurrent).toBe(1);

    // Eject with 'unknown' -> should detect position 1 was 'live'
    session = ejectShell(session, 'unknown');
    expect(session.liveRemaining).toBe(2);
    expect(session.blankRemaining).toBe(2);
    expect(session.events[1].type).toBe('eject');
    expect((session.events[1] as { shell: string }).shell).toBe('live');
  });

  // 15b. Rejecting unknown shell ejection when Position 1 is NOT known
  it('15b. rejects ejectShell with unknown shell when position 1 is unknown', () => {
    const session = createNewSession({ initialLive: 3, initialBlank: 3 });
    expect(() => ejectShell(session, 'unknown')).toThrow(
      /Cannot eject unknown shell: Chambered shell type is not known/i
    );
    expect(canEjectShell(session, 'unknown').allowed).toBe(false);
  });

  // 16. Undoing ejection restores pre-ejection counts and intel
  it('16. undos ejection and restores pre-ejection counts and intel', () => {
    let session = createNewSession({ initialLive: 2, initialBlank: 2 });
    session = addShellIntel(session, { positionFromCurrent: 2, shellType: 'blank' });

    session = ejectShell(session, 'blank');
    expect(session.blankRemaining).toBe(1);
    expect(session.shellIntel[0].positionFromCurrent).toBe(1);

    session = undoLastAction(session);
    expect(session.blankRemaining).toBe(2);
    expect(session.shellIntel[0].positionFromCurrent).toBe(2);
  });

  // 17. Depleting entire chamber clears all remaining intel
  it('17. clears all intel when chamber is completely depleted', () => {
    let session = createNewSession({ initialLive: 1, initialBlank: 1 });
    session = addShellIntel(session, { positionFromCurrent: 2, shellType: 'blank' });

    session = recordShot(session, 'live');
    expect(session.shellIntel[0].positionFromCurrent).toBe(1);

    session = recordShot(session, 'blank');
    expect(session.status).toBe('completed');
    expect(session.shellIntel).toHaveLength(0);
    expect(session.liveRemaining).toBe(0);
    expect(session.blankRemaining).toBe(0);
  });

  // 18. Reducer actions integration
  it('18. handles ADD_INTEL, REMOVE_INTEL, and EJECT_SHELL in trackerReducer', () => {
    let state = trackerReducer(initialTrackerState, {
      type: 'CREATE_SESSION',
      payload: { initialLive: 3, initialBlank: 3 },
    });
    expect(state.session).not.toBeNull();

    state = trackerReducer(state, {
      type: 'ADD_INTEL',
      payload: { params: { positionFromCurrent: 2, shellType: 'live' }, intelId: 'test_intel_1' },
    });
    expect(state.session?.shellIntel).toHaveLength(1);

    state = trackerReducer(state, {
      type: 'EJECT_SHELL',
      payload: { shell: 'blank' },
    });
    expect(state.session?.blankRemaining).toBe(2);
    expect(state.session?.shellIntel[0].positionFromCurrent).toBe(1);

    state = trackerReducer(state, {
      type: 'REMOVE_INTEL',
      payload: { intelId: 'test_intel_1' },
    });
    expect(state.session?.shellIntel).toHaveLength(0);
  });

  // 19. Comprehensive Multi-Step Scenario from Specification
  it('19. executes the complete multi-step Burner Phone + Shot + Eject + Undo scenario', () => {
    // 3 Live, 3 Blank load
    let session = createNewSession({ initialLive: 3, initialBlank: 3 });

    // Step A: Record pos 2 as Blank, pos 4 as Live
    session = addShellIntel(session, { positionFromCurrent: 2, shellType: 'blank' });
    session = addShellIntel(session, { positionFromCurrent: 4, shellType: 'live' });

    // Inventory unchanged
    expect(session.liveRemaining).toBe(3);
    expect(session.blankRemaining).toBe(3);

    // Step B: Fire shot 1 (Live)
    session = recordShot(session, 'live');
    expect(session.liveRemaining).toBe(2);
    expect(session.blankRemaining).toBe(3);
    expect(session.shellIntel[0].positionFromCurrent).toBe(1); // was 2, now 1 (CURRENT SHELL!)
    expect(session.shellIntel[0].shellType).toBe('blank');
    expect(session.shellIntel[1].positionFromCurrent).toBe(3); // was 4, now 3
    expect(session.shellIntel[1].shellType).toBe('live');

    // Step C: Knowing position 1 is Blank, fire Blank!
    session = recordShot(session, 'blank');
    expect(session.liveRemaining).toBe(2);
    expect(session.blankRemaining).toBe(2);
    // Position 1 (Blank) consumed; surviving Live shell advances from pos 3 -> pos 2!
    expect(session.shellIntel).toHaveLength(1);
    expect(session.shellIntel[0].positionFromCurrent).toBe(2);
    expect(session.shellIntel[0].shellType).toBe('live');

    // Step D: Use Beer to eject the unknown current shell (ejected shell is observed as Live)
    session = ejectShell(session, 'live');
    expect(session.liveRemaining).toBe(1);
    expect(session.blankRemaining).toBe(2);
    // The surviving Live shell advances from pos 2 -> pos 1!
    expect(session.shellIntel[0].positionFromCurrent).toBe(1);
    expect(session.shellIntel[0].shellType).toBe('live');

    // Step E: Undo ejection
    session = undoLastAction(session);
    expect(session.liveRemaining).toBe(2);
    expect(session.blankRemaining).toBe(2);
    expect(session.shellIntel[0].positionFromCurrent).toBe(2);
    expect(session.shellIntel[0].shellType).toBe('live');

    // Step F: Undo shot 2
    session = undoLastAction(session);
    expect(session.liveRemaining).toBe(2);
    expect(session.blankRemaining).toBe(3);
    expect(session.shellIntel[0].positionFromCurrent).toBe(1);
    expect(session.shellIntel[0].shellType).toBe('blank');
    expect(session.shellIntel[1].positionFromCurrent).toBe(3);
    expect(session.shellIntel[1].shellType).toBe('live');

    // Step G: Undo shot 1
    session = undoLastAction(session);
    expect(session.liveRemaining).toBe(3);
    expect(session.blankRemaining).toBe(3);
    expect(session.shellIntel[0].positionFromCurrent).toBe(2);
    expect(session.shellIntel[0].shellType).toBe('blank');
    expect(session.shellIntel[1].positionFromCurrent).toBe(4);
    expect(session.shellIntel[1].shellType).toBe('live');
  });
});
