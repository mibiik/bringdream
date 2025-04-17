import React from "react";

export const Cloud: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = "", style = {} }) => (
  <svg
    viewBox="0 0 64 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={style}
  >
    <ellipse cx="24" cy="20" rx="16" ry="12" fill="#90caf9" />
    <ellipse cx="40" cy="16" rx="16" ry="12" fill="#42a5f5" />
    <ellipse cx="32" cy="24" rx="20" ry="10" fill="#e3f2fd" />
  </svg>
);

export default Cloud;
