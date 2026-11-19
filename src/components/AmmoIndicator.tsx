import React from 'react';

interface AmmoIndicatorProps {
  liveRemaining: number;
  blankRemaining: number;
  initialLive: number;
  initialBlank: number;
}

export const AmmoIndicator: React.FC<AmmoIndicatorProps> = ({
  liveRemaining,
  blankRemaining,
  initialLive,
  initialBlank,
}) => {
  const totalRemaining = liveRemaining + blankRemaining;
  const initialTotal = initialLive + initialBlank;
  const spentCount = Math.max(0, initialTotal - totalRemaining);

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.82rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-text-dim)',
            }}
          >
            CHAMBER INVENTORY
          </span>
          <span
            style={{
              fontSize: '0.68rem',
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            (Unordered)
          </span>
        </div>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem',
            color: 'var(--color-text-muted)',
          }}
        >
          {totalRemaining} / {initialTotal} TOTAL
        </span>
      </div>

      {/* Visual pill bar representing composition */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          height: '24px',
          alignItems: 'center',
          overflowX: 'auto',
          paddingBottom: '2px',
        }}
      >
        {Array.from({ length: liveRemaining }).map((_, i) => (
          <div
            key={`live-${i}`}
            title="Live shell"
            style={{
              flex: 1,
              minWidth: '14px',
              maxWidth: '36px',
              height: '100%',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(180deg, var(--color-live) 0%, #b81f29 100%)',
              border: '1px solid var(--color-live-border)',
              boxShadow: '0 0 8px var(--color-live-glow)',
              transition: 'all 0.2s ease',
            }}
          />
        ))}

        {Array.from({ length: blankRemaining }).map((_, i) => (
          <div
            key={`blank-${i}`}
            title="Blank shell"
            style={{
              flex: 1,
              minWidth: '14px',
              maxWidth: '36px',
              height: '100%',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(180deg, var(--color-blank) 0%, #1d6ea3 100%)',
              border: '1px solid var(--color-blank-border)',
              boxShadow: '0 0 8px var(--color-blank-glow)',
              transition: 'all 0.2s ease',
            }}
          />
        ))}

        {Array.from({ length: spentCount }).map((_, i) => (
          <div
            key={`spent-${i}`}
            title="Discharged shell"
            style={{
              flex: 1,
              minWidth: '14px',
              maxWidth: '36px',
              height: '100%',
              borderRadius: 'var(--radius-sm)',
              border: '1px dashed var(--color-border-highlight)',
              background: 'transparent',
              opacity: 0.25,
            }}
          />
        ))}

        {totalRemaining === 0 && (
          <div
            style={{
              width: '100%',
              textAlign: 'center',
              color: 'var(--color-text-muted)',
              fontSize: '0.82rem',
              fontFamily: 'var(--font-mono)',
            }}
          >
            CHAMBER EMPTY
          </div>
        )}
      </div>
    </div>
  );
};
