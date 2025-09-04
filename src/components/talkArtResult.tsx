import React, { useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { GeneratedArtwork } from '@/features/talkart/artGenerator'
import { TalkArtParticles } from './talkArtParticles'
import { useRouter } from 'next/router'

interface TalkArtResultProps {
  artwork: GeneratedArtwork
  savedInfo: { id: string; shareCode: string } | null
  onReset: () => void
  onViewGallery: () => void
}

export const TalkArtResult: React.FC<TalkArtResultProps> = ({
  artwork,
  savedInfo,
  onReset,
  onViewGallery,
}) => {
  const router = useRouter()
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [isDownloading, setIsDownloading] = useState(false)
  const [shareUrl, setShareUrl] = useState<string>('')
  const [showParticles, setShowParticles] = useState(true)
  const [isFlyingToGallery, setIsFlyingToGallery] = useState(false)
  const [flyingStartPos, setFlyingStartPos] = useState({
    left: 0,
    top: 0,
    width: 0,
  })
  const artworkRef = useRef<HTMLDivElement>(null)

  // Smart gallery window management
  const galleryWindowRef = useRef<Window | null>(null)

  useEffect(() => {
    // Debug: Log artwork data structure
    console.log('🎨 TalkArtResult artwork data:', {
      hasCompositeImageUrl: !!artwork.compositeImageUrl,
      compositeImageUrlType: typeof artwork.compositeImageUrl,
      compositeImageUrlLength: artwork.compositeImageUrl?.length || 0,
      isDataUrl: artwork.compositeImageUrl?.startsWith('data:image/') || false,
      hasPoetry: !!artwork.poetry,
      poetryContent: artwork.poetry
        ? artwork.poetry.poem?.substring(0, 50) + '...'
        : 'none',
      hasMetadata: !!artwork.metadata,
      hasCompositeFlag: artwork.metadata?.hasComposite,
    })

    // Generate share URL
    const baseUrl = window.location.origin
    const shareCode = savedInfo?.shareCode || artwork.metadata.sessionId
    const url = `${baseUrl}/gallery/${shareCode}`
    setShareUrl(url)

    // Generate QR code
    QRCode.toDataURL(url, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })
      .then(setQrCodeUrl)
      .catch(console.error)

    // Hide particles after animation
    const timer = setTimeout(() => setShowParticles(false), 4000)

    // Add CSS keyframes for flying animation
    const style = document.createElement('style')
    style.textContent = `
      @keyframes flyToGallery {
        0% {
          transform: translateX(0px) translateY(0px) scale(1) rotate(0deg);
          opacity: 1;
        }
        100% {
          transform: translateX(1500px) translateY(-1000px) scale(0.1) rotate(720deg);
          opacity: 0;
        }
      }
      
      body {
        overflow-x: visible !important;
        overflow-y: visible !important;
      }
      
      html {
        overflow-x: visible !important;
        overflow-y: visible !important;
      }
    `
    document.head.appendChild(style)

    return () => {
      clearTimeout(timer)
      if (style.parentNode) {
        style.parentNode.removeChild(style)
      }
    }
  }, [artwork, savedInfo])

  // Download artwork (prioritize composite version)
  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      // Use composite only if it's actually a data URL (real composite)
      const hasRealComposite =
        artwork.compositeImageUrl &&
        artwork.compositeImageUrl.startsWith('data:image/')
      const imageUrl = hasRealComposite
        ? artwork.compositeImageUrl
        : artwork.imageUrl
      const fileName = hasRealComposite
        ? `summer-memory-composite-${artwork.metadata.sessionId}.png`
        : `summer-memory-${artwork.metadata.sessionId}.png`

      // Handle data URLs (for composite images)
      if (imageUrl && imageUrl.startsWith('data:')) {
        const a = document.createElement('a')
        a.href = imageUrl
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } else if (imageUrl) {
        // Handle regular URLs
        const response = await fetch(imageUrl)
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)

        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  // Share artwork
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '夏祭りの思い出アート',
          text: 'AIが描いた私の夏祭りの思い出です！',
          url: shareUrl,
        })
      } catch (error) {
        // User cancelled or error
        console.log('Share cancelled or failed:', error)
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(shareUrl)
      alert('URLをコピーしました！')
    }
  }

  // Start flying animation with the preview image itself
  const openGalleryWithAnimation = () => {
    if (artworkRef.current) {
      const rect = artworkRef.current.getBoundingClientRect()
      setFlyingStartPos({
        left: rect.left,
        top: rect.top,
        width: rect.width,
      })
      setIsFlyingToGallery(true)

      // Complete animation after 4 seconds
      setTimeout(() => {
        // Open gallery window
        openGalleryWindow()
        // Auto-return to start screen after opening gallery
        setTimeout(() => {
          onReset()
        }, 300)
      }, 4000)
    }
  }

  // Gallery window management (called after animation completes)
  const openGalleryWindow = () => {
    const galleryUrl = `${window.location.origin}/gallery`

    // Check if existing gallery window is still open and valid
    if (galleryWindowRef.current && !galleryWindowRef.current.closed) {
      try {
        // Focus and reload existing gallery window
        galleryWindowRef.current.focus()
        galleryWindowRef.current.location.reload()
        console.log('✅ Refreshed existing gallery window')
        return
      } catch (error) {
        // Window might be cross-origin or closed, proceed to open new one
        console.log('⚠️ Existing gallery window not accessible:', error)
      }
    }

    // Open new gallery window
    try {
      const galleryWindow = window.open(
        galleryUrl,
        'talkart_gallery', // Window name for reuse
        'width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=no,menubar=no'
      )

      if (galleryWindow) {
        galleryWindowRef.current = galleryWindow
        galleryWindow.focus()
        console.log('✅ Opened new gallery window')
      } else {
        console.error('❌ Failed to open gallery window (popup blocked?)')
        // Fallback to same-window navigation
        router.push('/gallery')
      }
    } catch (error) {
      console.error('❌ Failed to open gallery window:', error)
      // Fallback to same-window navigation
      router.push('/gallery')
    }
  }

  return (
    <>
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent z-10 overflow-visible">
        <TalkArtParticles active={showParticles} />

        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <h3 className="text-3xl font-bold mb-6 text-center text-white animate-slideInDown">
            完成！
          </h3>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Artwork Display */}
            <div className="text-center">
              <div
                className="inline-block animate-slideInUp"
                style={{ animationDelay: '0.2s' }}
              >
                <div
                  ref={artworkRef}
                  className={`bg-white p-2 rounded-lg shadow-2xl relative ${
                    !isFlyingToGallery ? 'animate-glow' : ''
                  }`}
                  style={
                    isFlyingToGallery
                      ? {
                          animation:
                            'flyToGallery 4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                          zIndex: 50,
                        }
                      : {}
                  }
                >
                  <img
                    src={(() => {
                      const imageToShow =
                        artwork.compositeImageUrl || artwork.imageUrl
                      console.log('🖼️ Displaying image:', {
                        usingComposite: !!artwork.compositeImageUrl,
                        imageSource: imageToShow.substring(0, 50) + '...',
                        isDataUrl: imageToShow.startsWith('data:image/'),
                      })
                      return imageToShow
                    })()}
                    alt="Generated artwork"
                    className="w-full max-w-md rounded"
                  />

                  {/* Show composite indicator only if actually composed */}
                  {artwork.compositeImageUrl &&
                    artwork.compositeImageUrl.startsWith('data:image/') && (
                      <div className="mt-2 text-xs text-white/70 text-center">
                        🎭 詩とロゴ合成版
                      </div>
                    )}
                </div>

                {/* Download button */}
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="mt-4 px-6 py-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-all flex items-center gap-2 mx-auto"
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
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  {isDownloading ? 'ダウンロード中...' : 'ダウンロード'}
                </button>
              </div>
            </div>

            {/* QR Code and Actions */}
            <div
              className="text-center text-white animate-slideInUp"
              style={{ animationDelay: '0.4s' }}
            >
              <div className="mb-6">
                <p className="text-lg mb-4">QRコードで共有</p>
                {qrCodeUrl && (
                  <div className="inline-block bg-white p-4 rounded-lg">
                    <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32" />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleShare}
                  className="w-full px-8 py-3 bg-blue-500 text-white rounded-full font-bold hover:bg-blue-600 transition-transform hover:scale-105"
                >
                  <span className="flex items-center justify-center gap-2">
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
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 010-5.684m-9.032 0a3 3 0 110 5.684m9.032-5.684a9.001 9.001 0 010 5.684M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    共有する
                  </span>
                </button>

                <button
                  onClick={openGalleryWithAnimation}
                  className="w-full px-8 py-3 bg-purple-500 text-white rounded-full font-bold hover:bg-purple-600 transition-transform hover:scale-105"
                >
                  <span className="flex items-center justify-center gap-2">
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
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    ギャラリーを見る
                  </span>
                </button>

                <button
                  onClick={onReset}
                  className="w-full px-8 py-3 bg-yellow-400 text-purple-900 rounded-full font-bold hover:scale-105 transition-transform"
                >
                  もう一度
                </button>
              </div>

              {/* Poetry Display (AI Exhibition Feature) - Show only if not actually embedded */}
              {artwork.poetry &&
                !(
                  artwork.compositeImageUrl &&
                  artwork.compositeImageUrl.startsWith('data:image/')
                ) && (
                  <div className="mt-6 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <svg
                        className="w-5 h-5 text-yellow-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                      <p className="text-sm font-semibold text-yellow-400">
                        AI詩人が紡いだ思い出
                      </p>
                      <span className="text-xs text-white/60 bg-blue-500/30 px-2 py-1 rounded-full">
                        GPT-4
                      </span>
                    </div>
                    <div className="text-white whitespace-pre-line text-center leading-relaxed">
                      {artwork.poetry.poem}
                    </div>
                  </div>
                )}

              {/* Show poetry status only if actually embedded in composite */}
              {artwork.poetry &&
                artwork.compositeImageUrl &&
                artwork.compositeImageUrl.startsWith('data:image/') && (
                  <div className="mt-6 p-3 bg-green-500/20 rounded-lg backdrop-blur-sm">
                    <div className="flex items-center justify-center gap-2">
                      <svg
                        className="w-4 h-4 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <p className="text-sm text-green-300">
                        詩が画像に埋め込まれました
                      </p>
                      <span className="text-xs text-white/60 bg-blue-500/30 px-2 py-1 rounded-full">
                        GPT-4
                      </span>
                    </div>
                  </div>
                )}

              {/* Prompt Info */}
              <div className="mt-6 text-sm opacity-70">
                <p className="line-clamp-2">{artwork.prompt}</p>
                {artwork.metadata.questionMode === 'multilayer' && (
                  <p className="text-xs text-blue-300 mt-1">
                    🎯 多層質問システムで生成
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
