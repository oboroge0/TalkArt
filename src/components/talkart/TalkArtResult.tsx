import React, { useState, useEffect } from 'react'
import { GeneratedArtwork, ShareData } from '@/features/talkart/types'
import { useTalkArtAudio } from '@/hooks/useTalkArtAudio'
import { TalkArtGalleryMini } from './TalkArtGallery'
import { CountUp, FadeTransition } from './TalkArtAnimations'

interface TalkArtResultProps {
  artwork: GeneratedArtwork
  onRestart: () => void
  onShare?: (shareData: ShareData) => void
}

export const TalkArtResult: React.FC<TalkArtResultProps> = ({
  artwork,
  onRestart,
  onShare,
}) => {
  const [showContent, setShowContent] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)
  const [shareUrl, setShareUrl] = useState<string>('')
  const { playCompletionSound } = useTalkArtAudio()

  // コンポーネントマウント時のアニメーション
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true)
      playCompletionSound()
    }, 500)

    return () => clearTimeout(timer)
  }, [playCompletionSound])

  // QRコード生成
  useEffect(() => {
    const generateQRCode = async () => {
      setIsGeneratingQR(true)
      try {
        // 作品共有URLを生成
        const baseUrl = window.location.origin
        const artworkUrl = `${baseUrl}/artwork/${artwork.id}`
        setShareUrl(artworkUrl)

        // QRコードを生成（QRコードライブラリまたはAPIを使用）
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(artworkUrl)}`
        setQrCodeUrl(qrApiUrl)
      } catch (error) {
        console.error('Failed to generate QR code:', error)
      } finally {
        setIsGeneratingQR(false)
      }
    }

    if (showContent) {
      generateQRCode()
    }
  }, [showContent, artwork.id])

  // 共有処理
  const handleShare = () => {
    const shareData: ShareData = {
      artworkId: artwork.id,
      shareUrl,
      qrCodeDataUrl: qrCodeUrl,
    }

    // Web Share API が利用可能な場合
    if (navigator.share) {
      navigator
        .share({
          title: 'TalkArt - 夏祭りの思い出',
          text: '私の夏祭りの思い出がアートになりました！',
          url: shareUrl,
        })
        .catch(console.error)
    } else {
      // フォールバック: クリップボードにコピー
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => {
          alert('共有URLをクリップボードにコピーしました！')
        })
        .catch(() => {
          // 最後の手段: プロンプトで表示
          prompt('共有URL:', shareUrl)
        })
    }

    onShare?.(shareData)
  }

  // 作品をダウンロード
  const handleDownload = async () => {
    try {
      const response = await fetch(artwork.imageUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `talkart-${artwork.id}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download artwork:', error)
      alert('ダウンロードに失敗しました')
    }
  }

  return (
    <div className="text-center max-w-4xl mx-auto">
      <FadeTransition show={showContent} duration={800}>
        {/* 完成メッセージ */}
        <div className="mb-8">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-4xl font-bold text-white mb-4">完成しました！</h2>
          <p className="text-xl text-gray-200">
            あなたの夏祭りの思い出がアートになりました
          </p>
        </div>

        {/* メインアートワーク */}
        <div className="mb-8">
          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-2xl">
              <img
                src={artwork.imageUrl}
                alt="Generated summer festival artwork"
                className="w-full h-auto rounded-xl"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src =
                    'https://via.placeholder.com/500x500/6B46C1/FFFFFF?text=作品'
                }}
              />

              {/* 作品メタデータ */}
              <div className="mt-4 text-sm text-gray-600 space-y-2">
                <div className="flex justify-between">
                  <span>生成時間:</span>
                  <span>
                    <CountUp
                      end={artwork.metadata.generationTime}
                      duration={1500}
                      suffix="ms"
                    />
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>作成日時:</span>
                  <span>
                    {new Date(artwork.createdAt).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {artwork.metadata.themes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {artwork.metadata.themes.map((theme, index) => (
                      <span
                        key={index}
                        className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={handleShare}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 flex items-center justify-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
              />
            </svg>
            共有する
          </button>

          <button
            onClick={handleDownload}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 flex items-center justify-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            保存する
          </button>

          <button
            onClick={onRestart}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 flex items-center justify-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            もう一度作る
          </button>
        </div>

        {/* QRコード */}
        {(qrCodeUrl || isGeneratingQR) && (
          <div className="mb-8 p-6 bg-white/10 backdrop-blur-sm rounded-xl">
            <h3 className="text-lg font-bold text-white mb-4">
              スマートフォンで作品を見る
            </h3>
            {isGeneratingQR ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <img
                  src={qrCodeUrl}
                  alt="QR Code for sharing"
                  className="w-32 h-32 bg-white p-2 rounded-lg"
                />
                <p className="text-sm text-gray-300 mt-2">
                  QRコードをスキャンして作品を共有
                </p>
              </div>
            )}
          </div>
        )}

        {/* ギャラリー */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-white mb-6">
            他の作品も見てみましょう
          </h3>
          <TalkArtGalleryMini />
        </div>
      </FadeTransition>
    </div>
  )
}
