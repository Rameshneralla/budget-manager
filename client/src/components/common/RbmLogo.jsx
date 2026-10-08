/**
 * The round RBM logo (same design as the app icon: client/icon-source/rbm-logo.svg).
 * Used in the header, the login page and the install prompt.
 */
import { useId } from 'react';

export default function RbmLogo({ size = 36, className = '' }) {
  // useId() can contain characters (":", "«") that break SVG url(#...) references.
  const gradientId = `rbm-gradient-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <svg
      className={`rbm-logo ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 512 512"
      role="img"
      aria-label="RBM"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3d6ef2" />
          <stop offset="1" stopColor="#173da8" />
        </linearGradient>
      </defs>
      <circle cx="256" cy="256" r="250" fill={`url(#${gradientId})`} />
      <circle
        cx="256"
        cy="256"
        r="212"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.35"
        strokeWidth="10"
      />
      <text
        x="256"
        y="256"
        dy="0.35em"
        textAnchor="middle"
        fill="#fff"
        fontFamily="'Inter Variable', 'Segoe UI', Arial, sans-serif"
        fontWeight="800"
        fontSize="148"
        letterSpacing="2"
      >
        RBM
      </text>
    </svg>
  );
}
