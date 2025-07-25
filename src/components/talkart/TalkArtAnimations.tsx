import React from 'react'

// フェードイン・アウトコンポーネント
interface FadeTransitionProps {
  children: React.ReactNode
  show: boolean
  duration?: number
  className?: string
}

export const FadeTransition: React.FC<FadeTransitionProps> = ({
  children,
  show,
  duration = 300,
  className = '',
}) => {
  return (
    <div
      className={`transition-all ease-in-out ${className}`}
      style={{
        transitionDuration: `${duration}ms`,
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(10px)',
      }}
    >
      {children}
    </div>
  )
}

// スケールアニメーションコンポーネント
interface ScaleTransitionProps {
  children: React.ReactNode
  show: boolean
  duration?: number
  className?: string
}

export const ScaleTransition: React.FC<ScaleTransitionProps> = ({
  children,
  show,
  duration = 300,
  className = '',
}) => {
  return (
    <div
      className={`transition-all ease-in-out ${className}`}
      style={{
        transitionDuration: `${duration}ms`,
        opacity: show ? 1 : 0,
        transform: show ? 'scale(1)' : 'scale(0.95)',
      }}
    >
      {children}
    </div>
  )
}

// ローディングスピナー
interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  color?: string
  text?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = 'border-orange-500',
  text,
}) => {
  const sizes = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className={`animate-spin rounded-full border-b-2 ${color} ${sizes[size]}`}
      />
      {text && <p className="mt-2 text-sm text-gray-600">{text}</p>}
    </div>
  )
}

// プログレスバー
interface ProgressBarProps {
  progress: number
  showLabel?: boolean
  height?: number
  className?: string
  color?: string
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showLabel = true,
  height = 4,
  className = '',
  color = 'bg-orange-500',
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress))

  return (
    <div className={`w-full ${className}`}>
      <div
        className="w-full bg-gray-300 rounded-full overflow-hidden"
        style={{ height: `${height * 4}px` }}
      >
        <div
          className={`${color} transition-all duration-500 ease-out rounded-full`}
          style={{
            width: `${clampedProgress}%`,
            height: '100%',
          }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-sm text-gray-600 text-center">
          {Math.round(clampedProgress)}%
        </div>
      )}
    </div>
  )
}

// パルス効果
interface PulseEffectProps {
  children: React.ReactNode
  active?: boolean
  intensity?: 'light' | 'medium' | 'strong'
}

export const PulseEffect: React.FC<PulseEffectProps> = ({
  children,
  active = true,
  intensity = 'medium',
}) => {
  const intensityClasses = {
    light: 'animate-pulse',
    medium: 'animate-pulse opacity-75',
    strong: 'animate-pulse opacity-50',
  }

  return (
    <div className={active ? intensityClasses[intensity] : ''}>{children}</div>
  )
}

// ホバー効果
interface HoverEffectProps {
  children: React.ReactNode
  scale?: number
  duration?: number
  className?: string
}

export const HoverEffect: React.FC<HoverEffectProps> = ({
  children,
  scale = 1.05,
  duration = 300,
  className = '',
}) => {
  return (
    <div
      className={`transition-transform ease-in-out cursor-pointer hover:scale-${Math.round(scale * 100)} ${className}`}
      style={{
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  )
}

// スライドイン効果
interface SlideInProps {
  children: React.ReactNode
  show: boolean
  direction?: 'left' | 'right' | 'up' | 'down'
  duration?: number
  className?: string
}

export const SlideIn: React.FC<SlideInProps> = ({
  children,
  show,
  direction = 'up',
  duration = 300,
  className = '',
}) => {
  const getTransform = () => {
    if (show) return 'translate(0, 0)'

    switch (direction) {
      case 'left':
        return 'translate(-100%, 0)'
      case 'right':
        return 'translate(100%, 0)'
      case 'up':
        return 'translate(0, -100%)'
      case 'down':
        return 'translate(0, 100%)'
      default:
        return 'translate(0, 100%)'
    }
  }

  return (
    <div
      className={`transition-all ease-in-out ${className}`}
      style={{
        transitionDuration: `${duration}ms`,
        opacity: show ? 1 : 0,
        transform: getTransform(),
      }}
    >
      {children}
    </div>
  )
}

// カウントアップアニメーション
interface CountUpProps {
  end: number
  duration?: number
  start?: number
  suffix?: string
  prefix?: string
  className?: string
}

export const CountUp: React.FC<CountUpProps> = ({
  end,
  duration = 1000,
  start = 0,
  suffix = '',
  prefix = '',
  className = '',
}) => {
  const [count, setCount] = React.useState(start)

  React.useEffect(() => {
    const startTime = Date.now()
    const startValue = start
    const endValue = end

    const updateCount = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      const currentValue = startValue + (endValue - startValue) * progress
      setCount(Math.round(currentValue))

      if (progress < 1) {
        requestAnimationFrame(updateCount)
      }
    }

    updateCount()
  }, [end, start, duration])

  return (
    <span className={className}>
      {prefix}
      {count}
      {suffix}
    </span>
  )
}

// フローティングアニメーション
interface FloatingProps {
  children: React.ReactNode
  amplitude?: number
  speed?: number
  className?: string
}

export const Floating: React.FC<FloatingProps> = ({
  children,
  amplitude = 10,
  speed = 3,
  className = '',
}) => {
  return (
    <div
      className={`animate-bounce ${className}`}
      style={{
        animationDuration: `${speed}s`,
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 'infinite',
        animationDirection: 'alternate',
        transform: `translateY(${amplitude}px)`,
      }}
    >
      {children}
    </div>
  )
}

// シマー効果（読み込み中のプレースホルダー）
interface ShimmerProps {
  width?: string
  height?: string
  className?: string
}

export const Shimmer: React.FC<ShimmerProps> = ({
  width = '100%',
  height = '20px',
  className = '',
}) => {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 rounded ${className}`}
      style={{ width, height }}
    />
  )
}
