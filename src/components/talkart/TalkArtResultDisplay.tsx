import React from 'react'
import { useTalkArtStore } from '@/stores/talkart/talkArtStore'
import { useSessionStore } from '@/stores/talkart/sessionStore'
import { FadeTransition, HoverEffect } from './TalkArtAnimations'
import { useTalkArtAudio } from '@/hooks/useTalkArtAudio'

export const TalkArtResultDisplay: React.FC = () => {
  const { isActive } = useTalkArtStore()
  const { flowState, currentSession } = useSessionStore()
  const { playClickSound } = useTalkArtAudio()

  if (
    !isActive ||
    flowState.currentPhase !== 'RESULT' ||
    !currentSession?.generatedArtwork
  ) {
    return null
  }

  const artwork = currentSession.generatedArtwork
  const shareUrl = `${window.location.origin}/artwork/${artwork.id}`

  const handleDownload = async () => {
    await playClickSound()
    const link = document.createElement('a')
    link.href = artwork.imageUrl
    link.download = `summer-memory-${artwork.id}.png`
    link.click()
  }

  const handleShare = async () => {
    await playClickSound()
    if (navigator.share) {
      await navigator.share({
        title: '夏祭りの思い出アート',
        text: 'AIが描いた私だけの夏祭りの思い出',
        url: shareUrl,
      })
    } else {
      // フォールバック: URLをクリップボードにコピー
      await navigator.clipboard.writeText(shareUrl)
      alert('共有リンクをコピーしました！')
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto mb-4">
      <FadeTransition show={true}>
        <div className="bg-white bg-opacity-95 rounded-xl p-6 shadow-xl">
          {/* タイトル */}
          <h3 className="text-2xl font-bold text-center mb-4 text-gray-800">
            あなたの夏祭りの思い出
          </h3>

          {/* アート画像 */}
          <div className="mb-6">
            <img
              src={artwork.imageUrl}
              alt="Generated summer festival artwork"
              className="w-full h-auto rounded-lg shadow-md"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src =
                  'https://via.placeholder.com/600x600/6B46C1/FFFFFF?text=アート'
              }}
            />
          </div>

          {/* アクションボタン */}
          <div className="grid grid-cols-2 gap-4">
            <HoverEffect scale={1.05}>
              <button
                onClick={handleDownload}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                ダウンロード
              </button>
            </HoverEffect>

            <HoverEffect scale={1.05}>
              <button
                onClick={handleShare}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.632 4.316C18.114 15.562 18 16.018 18 16.5c0 .482.114.938.316 1.342m0-2.684a3 3 0 110 2.684M8.684 10.658C8.886 11.062 9 11.518 9 12c0 .482-.114.938-.316 1.342M8.684 10.658a3 3 0 110 2.684m9.632-10.316C18.114 3.438 18 3.982 18 4.5c0 .482.114.938.316 1.342m0-2.684a3 3 0 110 2.684"
                  />
                </svg>
                共有
              </button>
            </HoverEffect>
          </div>

          {/* プロンプト表示 */}
          {artwork.prompt && (
            <div className="mt-4 p-3 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600">{artwork.prompt}</p>
            </div>
          )}
        </div>
      </FadeTransition>
    </div>
  )
}
