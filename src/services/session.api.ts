import { callServerless, ServerlessError } from './serverless.client';
import { TrackerSession, ShellType, AddIntelParams } from '../features/tracker/tracker.types';

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  session?: T;
  success?: boolean;
}

export async function fetchActiveSession(): Promise<TrackerSession | null> {
  try {
    const res = await callServerless<{ ok: boolean; session: TrackerSession | null }>('getActiveSession', {});
    return res.session ?? null;
  } catch (err) {
    if (err instanceof ServerlessError && err.code === 'NO_SERVERLESS') {
      // In standalone or test mode without Telegram environment
      return null;
    }
    throw err;
  }
}

export async function createRemoteSession(
  initialLive: number,
  initialBlank: number,
  operationId: string
): Promise<TrackerSession> {
  const res = await callServerless<{ ok: boolean; session: TrackerSession }>('createSession', {
    initialLive,
    initialBlank,
    operationId,
  });
  return res.session;
}

export async function recordRemoteShot(
  sessionId: string,
  shell: ShellType,
  expectedVersion: number,
  operationId: string
): Promise<TrackerSession> {
  const res = await callServerless<{ ok: boolean; session: TrackerSession }>('recordShot', {
    sessionId,
    shell,
    expectedVersion,
    operationId,
  });
  return res.session;
}

export async function ejectRemoteShell(
  sessionId: string,
  shell: ShellType | 'unknown',
  expectedVersion: number,
  operationId: string
): Promise<TrackerSession> {
  const res = await callServerless<{ ok: boolean; session: TrackerSession }>('ejectShell', {
    sessionId,
    shell,
    expectedVersion,
    operationId,
  });
  return res.session;
}

export async function addRemoteShellIntel(
  sessionId: string,
  params: AddIntelParams,
  expectedVersion: number,
  operationId: string
): Promise<TrackerSession> {
  const res = await callServerless<{ ok: boolean; session: TrackerSession }>('addShellIntel', {
    sessionId,
    positionFromCurrent: params.positionFromCurrent,
    shellType: params.shellType,
    source: params.source || 'burner_phone',
    expectedVersion,
    operationId,
  });
  return res.session;
}

export async function removeRemoteShellIntel(
  sessionId: string,
  intelId: string,
  expectedVersion: number,
  operationId: string
): Promise<TrackerSession> {
  const res = await callServerless<{ ok: boolean; session: TrackerSession }>('removeShellIntel', {
    sessionId,
    intelId,
    expectedVersion,
    operationId,
  });
  return res.session;
}

export async function undoRemoteAction(
  sessionId: string,
  expectedVersion: number,
  operationId: string
): Promise<TrackerSession> {
  const res = await callServerless<{ ok: boolean; session: TrackerSession }>('undoLastAction', {
    sessionId,
    expectedVersion,
    operationId,
  });
  return res.session;
}

export async function abandonRemoteSession(
  sessionId: string,
  expectedVersion: number
): Promise<boolean> {
  const res = await callServerless<{ ok: boolean; success: boolean }>('abandonSession', {
    sessionId,
    expectedVersion,
  });
  return Boolean(res.success);
}

export async function recordRemoteAppOpen(): Promise<{
  ok: boolean;
  isOwner: boolean;
  maintenance?: { active: boolean; message: string };
}> {
  try {
    return await callServerless<{
      ok: boolean;
      isOwner: boolean;
      maintenance?: { active: boolean; message: string };
    }>('recordAppOpen', {});
  } catch {
    return { ok: false, isOwner: false };
  }
}

export async function submitRemoteFeedback(
  category: 'bug' | 'feature' | 'general',
  message: string
): Promise<{ ok: boolean; message: string }> {
  return await callServerless<{ ok: boolean; message: string }>('submitFeedback', {
    category,
    message,
  });
}
