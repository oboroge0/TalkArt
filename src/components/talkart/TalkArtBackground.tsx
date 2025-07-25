import React from 'react'

interface TalkArtBackgroundProps {
  variant?: 'default' | 'festival' | 'fireworks'
}

export const TalkArtBackground: React.FC<TalkArtBackgroundProps> = ({ variant = 'default' }) => {
  return (
    <>
      {/* 背景グラデーション */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      {/* 提灯アニメーション */}
      <div className="fixed inset-0 z-1 pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-bounce"
            style={{
              left: `${20 + i * 15}%`,
              top: `${10 + (i % 2) * 10}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + i * 0.5}s`
            }}
          >
            <div className="w-16 h-24 bg-gradient-to-b from-red-500 to-orange-600 rounded-full opacity-80 shadow-2xl" />
          </div>
        ))}
      </div>

      {/* 花火パーティクル（結果画面用） */}
      {variant === 'fireworks' && (
        <div className="fixed inset-0 z-2 pointer-events-none">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}
    </>
  )
}