import React from 'react'

interface TalkArtLayoutProps {
  children: React.ReactNode
  phase: 'START' | 'QUESTIONS' | 'GENERATION' | 'RESULT'
}

export const TalkArtLayout: React.FC<TalkArtLayoutProps> = ({ children, phase }) => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* ヘッダー */}
      <header className="absolute top-0 left-0 right-0 z-20 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white text-center drop-shadow-lg">
            TalkArt
          </h1>
          <p className="text-lg text-white text-center mt-2 drop-shadow-md">
            夏祭りの記憶をアートに
          </p>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-4xl mx-auto p-4">
          {children}
        </div>
      </main>

      {/* フッター */}
      <footer className="absolute bottom-0 left-0 right-0 z-20 p-4">
        <div className="text-center text-white text-sm drop-shadow">
          <p>© 2024 TalkArt - 夏祭りの思い出をアートに</p>
        </div>
      </footer>

      {/* フェーズインジケーター */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex items-center space-x-4">
          {['START', 'QUESTIONS', 'GENERATION', 'RESULT'].map((p, index) => (
            <div
              key={p}
              className={`flex items-center ${index < 3 ? 'mr-4' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  phase === p
                    ? 'bg-orange-500 text-white scale-125 shadow-lg'
                    : 'bg-gray-400 text-gray-200'
                }`}
              >
                {index + 1}
              </div>
              {index < 3 && (
                <div className="w-16 h-0.5 bg-gray-400" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}