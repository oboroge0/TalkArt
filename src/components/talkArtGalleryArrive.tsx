import React, { useEffect, useState } from 'react'
import { LandingRipple } from './talkArtFlyingAnimation'

interface TalkArtGalleryArriveProps {
  onComplete: () => void
}

export const TalkArtGalleryArrive: React.FC<TalkArtGalleryArriveProps> = ({
  onComplete,
}) => {
  const [showRipple, setShowRipple] = useState(false)
  const [ripplePosition, setRipplePosition] = useState({ x: 0, y: 0 })
  const [showGlow, setShowGlow] = useState(false)

  useEffect(() => {
    // Calculate landing position (center of gallery board)
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2

    setRipplePosition({ x: centerX, y: centerY })
    setShowRipple(true)
    setShowGlow(true)

    // Play landing sound effect
    import('@/features/talkart/soundEffects').then(
      ({ talkArtSoundEffects }) => {
        talkArtSoundEffects.playCorkPop()
      }
    )

    // Complete animation sequence
    const timer = setTimeout(() => {
      setShowRipple(false)
      setShowGlow(false)
      onComplete()
    }, 2000)

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <>
      {showRipple && <LandingRipple position={ripplePosition} />}

      {showGlow && (
        <div
          className="fixed pointer-events-none z-[95]"
          style={{
            left: ripplePosition.x,
            top: ripplePosition.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            className="w-64 h-64 bg-yellow-400 rounded-full blur-3xl animate-ping"
            style={{ animationDuration: '1.5s' }}
          />
        </div>
      )}

      {/* Gallery reorganization effect */}
      <div className="fixed inset-0 pointer-events-none z-[85]">
        <div
          className="absolute inset-0 bg-gradient-radial from-yellow-400/20 to-transparent animate-pulse"
          style={{
            backgroundImage: `radial-gradient(circle at ${ripplePosition.x}px ${ripplePosition.y}px, rgba(251, 191, 36, 0.2), transparent 50%)`,
            animationDuration: '2s',
          }}
        />
      </div>
    </>
  )
}
