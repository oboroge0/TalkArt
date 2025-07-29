import React from 'react'

// Tape decoration component
export const TapeDecoration: React.FC<{
  rotation?: number
  color?: 'yellow' | 'white' | 'pink'
  opacity?: number
}> = ({ rotation = 0, color = 'yellow', opacity = 0.8 }) => {
  const colorMap = {
    yellow: '#FDE68A',
    white: '#F3F4F6',
    pink: '#FBCFE8',
  }

  return (
    <svg
      width="80"
      height="30"
      viewBox="0 0 80 30"
      style={{
        transform: `rotate(${rotation}deg)`,
        position: 'absolute',
        top: '-15px',
        left: '50%',
        marginLeft: '-40px',
        pointerEvents: 'none',
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
        zIndex: 5,
      }}
    >
      <rect
        x="0"
        y="0"
        width="80"
        height="30"
        fill={colorMap[color]}
        opacity={opacity}
        rx="2"
      />
      {/* Tape texture */}
      <rect
        x="0"
        y="0"
        width="80"
        height="30"
        fill="url(#tapeTexture)"
        opacity="0.3"
      />
      {/* Torn edges */}
      <path
        d="M0 30 L5 28 L10 30 L15 29 L20 30 L25 28 L30 30 L35 29 L40 30 L45 28 L50 30 L55 29 L60 30 L65 28 L70 30 L75 29 L80 30"
        fill={colorMap[color]}
        opacity={opacity}
      />
      <path
        d="M0 0 L5 2 L10 0 L15 1 L20 0 L25 2 L30 0 L35 1 L40 0 L45 2 L50 0 L55 1 L60 0 L65 2 L70 0 L75 1 L80 0"
        fill={colorMap[color]}
        opacity={opacity}
      />
      <defs>
        <pattern
          id="tapeTexture"
          x="0"
          y="0"
          width="4"
          height="4"
          patternUnits="userSpaceOnUse"
        >
          <rect x="0" y="0" width="2" height="2" fill="#000" opacity="0.05" />
          <rect x="2" y="2" width="2" height="2" fill="#000" opacity="0.05" />
        </pattern>
      </defs>
    </svg>
  )
}

// Pin decoration component
export const PinDecoration: React.FC<{
  color?: 'red' | 'blue' | 'green' | 'yellow'
}> = ({ color = 'red' }) => {
  const colorMap = {
    red: '#EF4444',
    blue: '#3B82F6',
    green: '#10B981',
    yellow: '#F59E0B',
  }

  return (
    <svg
      width="24"
      height="32"
      viewBox="0 0 24 32"
      style={{
        position: 'absolute',
        top: '-16px',
        left: '50%',
        marginLeft: '-12px',
        pointerEvents: 'none',
        filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))',
        zIndex: 10,
      }}
    >
      {/* Pin needle */}
      <line
        x1="12"
        y1="18"
        x2="12"
        y2="32"
        stroke="#9CA3AF"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Pin head */}
      <circle
        cx="12"
        cy="12"
        r="10"
        fill={colorMap[color]}
        stroke="#000"
        strokeWidth="0.5"
        opacity="0.9"
      />
      {/* Highlight */}
      <ellipse
        cx="9"
        cy="8"
        rx="4"
        ry="6"
        fill="#fff"
        opacity="0.3"
        transform="rotate(-30 9 8)"
      />
    </svg>
  )
}

// Handwritten heart component
export const HandwrittenHeart: React.FC<{
  filled?: boolean
  size?: number
}> = ({ filled = false, size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{
        display: 'inline-block',
        cursor: 'pointer',
      }}
    >
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        fill={filled ? '#EF4444' : 'none'}
        stroke="#EF4444"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={filled ? '0' : '1 2'}
        style={{
          filter: filled
            ? 'drop-shadow(0 2px 4px rgba(239,68,68,0.3))'
            : 'none',
          transition: 'all 0.3s ease',
        }}
      />
    </svg>
  )
}

// Paper corner fold effect
export const PaperCornerFold: React.FC<{
  corner?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  size?: number
}> = ({ corner = 'top-right', size = 30 }) => {
  const getTransform = () => {
    switch (corner) {
      case 'top-left':
        return 'rotate(0deg)'
      case 'top-right':
        return 'rotate(90deg)'
      case 'bottom-right':
        return 'rotate(180deg)'
      case 'bottom-left':
        return 'rotate(270deg)'
    }
  }

  const getPosition = () => {
    switch (corner) {
      case 'top-left':
        return { top: 0, left: 0 }
      case 'top-right':
        return { top: 0, right: 0 }
      case 'bottom-right':
        return { bottom: 0, right: 0 }
      case 'bottom-left':
        return { bottom: 0, left: 0 }
    }
  }

  return (
    <div
      style={{
        position: 'absolute',
        ...getPosition(),
        width: size,
        height: size,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{
          transform: getTransform(),
          transformOrigin: `${size / 2}px ${size / 2}px`,
        }}
      >
        <path d={`M 0 0 L ${size} 0 L 0 ${size} Z`} fill="#fff" opacity="0.3" />
        <path
          d={`M 0 0 L ${size} 0 L 0 ${size} Z`}
          fill="#000"
          opacity="0.05"
        />
      </svg>
    </div>
  )
}

// Bulletin board background texture
export const BulletinBoardTexture: React.FC = () => {
  return (
    <svg
      width="100%"
      height="100%"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        opacity: 0.05,
      }}
    >
      <defs>
        <pattern
          id="corkTexture"
          x="0"
          y="0"
          width="100"
          height="100"
          patternUnits="userSpaceOnUse"
        >
          {/* Random dots for cork texture */}
          {Array.from({ length: 50 }).map((_, i) => (
            <circle
              key={i}
              cx={Math.random() * 100}
              cy={Math.random() * 100}
              r={Math.random() * 2 + 1}
              fill="#8B7355"
              opacity={Math.random() * 0.5 + 0.2}
            />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#corkTexture)" />
    </svg>
  )
}
