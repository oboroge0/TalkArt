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

  // Download artwork
  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const response = await fetch(artwork.imageUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = `summer-memory-${artwork.metadata.sessionId}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
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
                    src={artwork.imageUrl}
                    alt="Generated artwork"
                    className="w-full max-w-md rounded"
                  />
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

              {/* Prompt Info */}
              <div className="mt-6 text-sm opacity-70">
                <p className="line-clamp-2">{artwork.prompt}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
