import React from 'react';

interface HoneypotFieldProps {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  tabIndex?: number;
}

/**
 * Honeypot field component for spam detection
 * This field is invisible to humans but may be filled by bots
 * If filled, it indicates potential spam/bot activity
 */
const HoneypotField: React.FC<HoneypotFieldProps> = ({ 
  value, 
  onChange, 
  name = "website",
  tabIndex = -1 
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: '-9999px',
        top: '-9999px',
        visibility: 'hidden',
        opacity: 0,
        height: 0,
        width: 0,
        overflow: 'hidden',
        zIndex: -1
      }}
      aria-hidden="true"
    >
      <label htmlFor={name} style={{ display: 'none' }}>
        Website (leave this field empty)
      </label>
      <input
        id={name}
        name={name}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={tabIndex}
        autoComplete="off"
        style={{
          position: 'absolute',
          left: '-9999px',
          visibility: 'hidden',
          opacity: 0,
          height: 0,
          width: 0,
          border: 'none',
          outline: 'none',
          background: 'transparent'
        }}
      />
    </div>
  );
};

export default HoneypotField;