import React from "react";

export const Moon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = "", style = {} }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={style}
  >
    <circle cx="16" cy="16" r="14" fill="#f5f9ff" />
    <path d="M16 2a14 14 0 1 0 14 14c0-1.1-.1-2.2-.3-3.2A10 10 0 0 1 16 2z" fill="#90caf9" />
  </svg>
);

export default Moon;
