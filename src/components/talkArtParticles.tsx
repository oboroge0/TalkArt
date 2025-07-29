import React, { useEffect, useState } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  size: number
  color: string
  delay: number
}

interface TalkArtParticlesProps {
  active: boolean
}

export const TalkArtParticles: React.FC<TalkArtParticlesProps> = ({
  active,
}) => {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (active) {
      const newParticles: Particle[] = []
      const colors = ['#FFD700', '#FF69B4', '#87CEEB', '#FFB6C1', '#FFA500']

      for (let i = 0; i < 20; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 10 + 5,
          color: colors[Math.floor(Math.random() * colors.length)],
          delay: Math.random() * 2,
        })
      }

      setParticles(newParticles)

      // Clear particles after animation
      const timer = setTimeout(() => {
        setParticles([])
      }, 4000)

      return () => clearTimeout(timer)
    }
  }, [active])

  if (!active || particles.length === 0) return null

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle"
          style={{
            left: `${particle.x}%`,
            bottom: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            borderRadius: '50%',
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
