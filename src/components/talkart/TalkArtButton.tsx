import React from 'react'

interface TalkArtButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'choice'
  disabled?: boolean
  size?: 'small' | 'medium' | 'large'
  className?: string
}

export const TalkArtButton: React.FC<TalkArtButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  size = 'medium',
  className = '',
}) => {
  const baseClasses = `
    inline-flex items-center justify-center font-bold text-center
    transition-all duration-300 ease-in-out
    border-2 rounded-lg shadow-lg
    hover:scale-105 active:scale-95
    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
  `

  const variantClasses = {
    primary:
      'bg-orange-500 hover:bg-orange-600 text-white border-orange-600 shadow-orange-500/50',
    secondary:
      'bg-gray-600 hover:bg-gray-700 text-white border-gray-700 shadow-gray-500/50',
    choice:
      'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-purple-600 shadow-purple-500/50',
  }

  const sizeClasses = {
    small: 'px-4 py-2 text-sm',
    medium: 'px-6 py-3 text-base',
    large: 'px-8 py-4 text-lg',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {children}
    </button>
  )
}

interface ChoiceButtonProps {
  children: React.ReactNode
  onClick?: () => void
  selected?: boolean
  disabled?: boolean
}

export const ChoiceButton: React.FC<ChoiceButtonProps> = ({
  children,
  onClick,
  selected = false,
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full p-4 text-left border-2 rounded-lg transition-all duration-300
        hover:scale-105 active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        ${
          selected
            ? 'bg-orange-100 border-orange-500 text-orange-800 shadow-orange-500/30'
            : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-800 shadow-lg'
        }
      `}
    >
      <div className="flex items-center">
        <div
          className={`w-4 h-4 rounded-full border-2 mr-3 ${
            selected ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
          }`}
        />
        <span className="font-medium">{children}</span>
      </div>
    </button>
  )
}

interface StartButtonProps {
  onClick?: () => void
  disabled?: boolean
}

export const StartButton: React.FC<StartButtonProps> = ({
  onClick,
  disabled = false,
}) => {
  return (
    <TalkArtButton
      onClick={onClick}
      disabled={disabled}
      variant="primary"
      size="large"
      className="animate-pulse"
    >
      🎨 体験を始める
    </TalkArtButton>
  )
}
