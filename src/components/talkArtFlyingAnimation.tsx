import React, { useEffect, useState, useRef } from 'react'
import { GeneratedArtwork } from '@/features/talkart/artGenerator'

interface TalkArtFlyingAnimationProps {
  artwork: GeneratedArtwork
  startPosition: { x: number; y: number }
  onComplete: () => void
}

export const TalkArtFlyingAnimation: React.FC<TalkArtFlyingAnimationProps> = ({
  artwork,
  startPosition,
  onComplete,
}) => {
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number; opacity: number }>
  >([])
  const animationRef = useRef<HTMLDivElement>(null)
  const flyingImageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!flyingImageRef.current) return

    // Calculate end position (gallery icon in top-right or center of screen)
    const endX = window.innerWidth * 0.85
    const endY = window.innerHeight * 0.15

    // Create bezier curve path
    const duration = 2000 // 2 seconds
    const startTime = Date.now()

    // Particle trail effect
    const particleInterval = setInterval(() => {
      if (flyingImageRef.current) {
        const rect = flyingImageRef.current.getBoundingClientRect()
        const newParticle = {
          id: Date.now() + Math.random(),
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          opacity: 1,
        }
        setParticles((prev) => [...prev, newParticle])
      }
    }, 50)

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      if (progress < 1) {
        // Cubic bezier easing
        const easeInOutCubic =
          progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2

        // Calculate current position with parabolic arc
        const currentX =
          startPosition.x + (endX - startPosition.x) * easeInOutCubic
        const currentY =
          startPosition.y +
          (endY - startPosition.y) * easeInOutCubic -
          Math.sin(progress * Math.PI) * 200 // Arc height

        // Update flying image position
        if (flyingImageRef.current) {
          flyingImageRef.current.style.transform = `translate(${currentX}px, ${currentY}px) scale(${1 - progress * 0.7})`
          flyingImageRef.current.style.opacity = String(1 - progress * 0.3)
        }

        requestAnimationFrame(animate)
      } else {
        // Animation complete
        clearInterval(particleInterval)
        setTimeout(() => {
          onComplete()
        }, 300)
      }
    }

    animate()

    // Cleanup
    return () => {
      clearInterval(particleInterval)
    }
  }, [startPosition, onComplete])

  // Update particle positions
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({ ...p, opacity: p.opacity - 0.05, y: p.y + 2 }))
          .filter((p) => p.opacity > 0)
      )
    }, 50)

    return () => clearInterval(interval)
  }, [])

  return (
    <div
      ref={animationRef}
      className="fixed inset-0 pointer-events-none z-[100]"
      style={{ isolation: 'isolate' }}
    >
      {/* Particle trail */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 bg-yellow-400 rounded-full"
          style={{
            left: particle.x - 4,
            top: particle.y - 4,
            opacity: particle.opacity,
            filter: 'blur(2px)',
            transform: `scale(${particle.opacity})`,
          }}
        />
      ))}

      {/* Flying image */}
      <div
        ref={flyingImageRef}
        className="absolute"
        style={{
          transform: `translate(${startPosition.x}px, ${startPosition.y}px)`,
          transition: 'none',
          willChange: 'transform',
        }}
      >
        <div className="relative">
          {/* Glow effect */}
          <div
            className="absolute inset-0 bg-yellow-400 rounded-lg blur-xl animate-pulse"
            style={{ transform: 'scale(1.2)' }}
          />

          {/* Image container */}
          <div className="bg-white p-1 rounded-lg shadow-2xl overflow-hidden">
            <img
              src={artwork.imageUrl}
              alt="Flying artwork"
              className="w-32 h-32 object-cover rounded"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Landing ripple effect component
export const LandingRipple: React.FC<{
  position: { x: number; y: number }
}> = ({ position }) => {
  const [ripples, setRipples] = useState<
    Array<{ id: number; scale: number; opacity: number }>
  >([])

  useEffect(() => {
    // Create multiple ripples
    const rippleCount = 3
    const newRipples = Array.from({ length: rippleCount }, (_, i) => ({
      id: i,
      scale: 0,
      opacity: 0.6 - i * 0.2,
    }))
    setRipples(newRipples)

    // Animate ripples
    const startTime = Date.now()
    const duration = 1500

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      setRipples((prev) =>
        prev.map((ripple, i) => ({
          ...ripple,
          scale: progress * (3 + i * 0.5),
          opacity: (0.6 - i * 0.2) * (1 - progress),
        }))
      )

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    animate()
  }, [position])

  return (
    <div
      className="fixed pointer-events-none z-[90]"
      style={{ left: position.x, top: position.y }}
    >
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="absolute w-20 h-20 border-2 border-yellow-400 rounded-full"
          style={{
            transform: `translate(-50%, -50%) scale(${ripple.scale})`,
            opacity: ripple.opacity,
          }}
        />
      ))}
    </div>
  )
}
