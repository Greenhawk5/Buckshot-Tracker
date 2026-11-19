import React from 'react';
import './tracker-status.css';
import './tracker-actions.css';
import { TrackerSession, ShellType } from '../features/tracker/tracker.types';
import { ShotButton } from './ShotButton';
import { AmmoIndicator } from './AmmoIndicator';
import { ProbabilityDisplay } from './ProbabilityDisplay';
import { UndoButton } from './UndoButton';
import { calculateProbability } from '../features/tracker/tracker.logic';
import { canUndo } from '../features/tracker/tracker.validation';

interface TrackerScreenProps {
  session: TrackerSession;
  onShot: (shell: ShellType) => void;
  onUndo: () => void;
  onNewLoad: () => void;
}

export const TrackerScreen: React.FC<TrackerScreenProps> = ({
  session,
  onShot,
  onUndo,
  onNewLoad,
}) => {
  const probability = calculateProbability(session);
  const undoAllowed = canUndo(session);

  // Authoritative current shot count (derived from effective session state)
  const initialTotal = session.initialLive + session.initialBlank;
  const currentTotal = session.liveRemaining + session.blankRemaining;
  const shotsFired = Math.max(0, initialTotal - currentTotal);

  // Recent shots preview (last 6 events)
  const recentEvents = [...session.events].slice(-6);

  // Grammatically correct shot activity label
  const activityLabel =
    shotsFired === 0
      ? 'No shots fired'
      : shotsFired === 1
      ? '1 shot fired'
      : `${shotsFired} shots fired`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* Top Session Status Bar */}
      <div className="tracker-status-bar" aria-label="Session status">
        {/* Active Load Indicator */}
        <div className="tracker-status-badge">
          <span className="tracker-status-led" aria-hidden="true" />
          <span>ACTIVE LOAD</span>
        </div>

        {/* Meaningful Shot Activity Indicator */}
        <div className="tracker-activity">
          <span className={shotsFired === 0 ? 'tracker-activity-empty' : 'tracker-activity-label'}>
            {activityLabel}
          </span>

          {recentEvents.length > 0 && (
            <div className="tracker-history-dots" aria-label="Recent shot history">
              {recentEvents.map((ev, idx) => {
                const isLive = 'shell' in ev && ev.shell === 'live';
                return (
                  <span
                    key={ev.id || idx}
                    title={`${isLive ? 'Live' : 'Blank'} shot`}
                    className={`tracker-history-dot ${
                      isLive ? 'tracker-history-dot--live' : 'tracker-history-dot--blank'
                    }`}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chamber Visual Bar */}
      <AmmoIndicator
        liveRemaining={session.liveRemaining}
        blankRemaining={session.blankRemaining}
        initialLive={session.initialLive}
        initialBlank={session.initialBlank}
      />

      {/* Shot Buttons — Main Gameplay Centerpiece */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <ShotButton
          shell="live"
          remaining={session.liveRemaining}
          onShot={onShot}
        />
        <ShotButton
          shell="blank"
          remaining={session.blankRemaining}
          onShot={onShot}
        />
      </div>

      {/* Composition Odds */}
      <ProbabilityDisplay probability={probability} />

      {/* Bottom Actions: Undo and New Load */}
      <div className="tracker-bottom-actions">
        <UndoButton
          onUndo={onUndo}
          disabled={!undoAllowed}
          eventCount={session.events.length}
        />

        <button
          type="button"
          onClick={onNewLoad}
          className="btn-tracker-action btn-reset-load"
          aria-label="Reset or start new load"
        >
          RESET / NEW LOAD
        </button>
      </div>
    </div>
  );
};
