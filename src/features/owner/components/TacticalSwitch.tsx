import React from 'react';

interface TacticalSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
}

export const TacticalSwitch: React.FC<TacticalSwitchProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  id,
}) => {
  const switchId = id || `tactical-switch-${Math.random().toString(36).substring(2, 9)}`;

  const handleClick = () => {
    if (disabled) return;
    window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
    onChange(!checked);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={`tactical-switch-container ${disabled ? 'tactical-switch--disabled' : ''}`}
      onClick={handleClick}
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
      id={switchId}
    >
      <div className={`tactical-switch-track ${checked ? 'tactical-switch-track--active' : ''}`}>
        <div className={`tactical-switch-thumb ${checked ? 'tactical-switch-thumb--active' : ''}`} />
      </div>
      {label && <span className="tactical-switch-label">{label}</span>}
    </div>
  );
};

