import { TrackerSession, ShellType, CreateSessionParams } from './tracker.types';
import { createNewSession, recordShot, undoLastAction } from './tracker.logic';

export type TrackerAction =
  | { type: 'CREATE_SESSION'; payload: CreateSessionParams }
  | { type: 'RECORD_SHOT'; payload: { shell: ShellType; operationId?: string } }
  | { type: 'UNDO_ACTION' }
  | { type: 'SET_SESSION'; payload: TrackerSession | null }
  | { type: 'RESET_SESSION' };

export interface TrackerState {
  session: TrackerSession | null;
  error: string | null;
}

export const initialTrackerState: TrackerState = {
  session: null,
  error: null,
};

export function trackerReducer(state: TrackerState, action: TrackerAction): TrackerState {
  switch (action.type) {
    case 'CREATE_SESSION': {
      try {
        const session = createNewSession(action.payload);
        return { session, error: null };
      } catch (err) {
        return { ...state, error: err instanceof Error ? err.message : 'Failed to create session' };
      }
    }

    case 'RECORD_SHOT': {
      if (!state.session) return state;
      try {
        const updated = recordShot(state.session, action.payload.shell, action.payload.operationId);
        return { session: updated, error: null };
      } catch (err) {
        return { ...state, error: err instanceof Error ? err.message : 'Failed to record shot' };
      }
    }

    case 'UNDO_ACTION': {
      if (!state.session) return state;
      try {
        const updated = undoLastAction(state.session);
        return { session: updated, error: null };
      } catch (err) {
        return { ...state, error: err instanceof Error ? err.message : 'Cannot undo' };
      }
    }

    case 'SET_SESSION': {
      return { session: action.payload, error: null };
    }

    case 'RESET_SESSION': {
      return { session: null, error: null };
    }

    default:
      return state;
  }
}
