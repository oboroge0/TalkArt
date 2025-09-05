// Gallery share page
import { useRouter } from 'next/router'
import { useEffect, useState, useRef } from 'react'
import { TalkArtArtwork } from '@/lib/supabase'
import { Meta } from '@/components/meta'
import QRCode from 'qrcode'
import { ArtworkComposer } from '@/utils/artworkComposer'

export default function GallerySharePage() {
  const router = useRouter()
  const { id } = router.query
  const [artwork, setArtwork] = useState<TalkArtArtwork | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [compositeImageUrl, setCompositeImageUrl] = useState<string>('')
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // QR code pages should be accessible from mobile devices for artwork download

  useEffect(() => {
    if (!id || typeof id !== 'string') return

    const fetchArtwork = async () => {
      try {
        const response = await fetch(`/api/talkart/artwork/${id}`)

        if (!response.ok) {
          throw new Error('Artwork not found')
        }

        const data = await response.json()
        setArtwork(data)

        // Generate QR code for sharing
        const shareUrl = `${window.location.origin}/gallery/${id}`
        const qrUrl = await QRCode.toDataURL(shareUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        })
        setQrCodeUrl(qrUrl)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load artwork')
      } finally {
        setLoading(false)
      }
    }

    fetchArtwork()
  }, [id])

  // Create composite image with poetry and logo - copied from gallery logic
  useEffect(() => {
    if (!artwork) return

    const createCompositeImage = async () => {
      try {
        // First check for existing composite image (same as gallery)
        // Support both direct compositeImageUrl and nested metadata structure
        const compositeUrl =
          (artwork as any)?.compositeImageUrl ||
          (artwork as any)?.composite_image_url ||
          (artwork as any)?.metadata?.compositeImageUrl

        if (compositeUrl && compositeUrl.startsWith('data:image/')) {
          console.log('QR Debug - Using existing composite image from database')
          setCompositeImageUrl(compositeUrl)
          return
        }

        // If no existing composite, create new one with poetry and logo (same as gallery)
        console.log('QR Debug - Creating new composite with poetry and logo')
        console.log('QR Debug - Poetry data:', artwork.poetry?.poem)

        const composite = await ArtworkComposer.composeArtwork({
          imageUrl: artwork.image_url,
          poetry: artwork.poetry?.poem,
          logoUrl: '/images/logo.png',
          sessionId: artwork.session_id,
        })

        console.log('QR Debug - New composite created')
        setCompositeImageUrl(composite.compositeImageUrl)
      } catch (error) {
        console.error('Failed to create composite image:', error)
        // Fallback to original image
        setCompositeImageUrl(artwork.image_url)
      }
    }

    createCompositeImage()
  }, [artwork])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 to-purple-800 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error || !artwork) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 to-purple-800 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">
            アートワークが見つかりません
          </h1>
          <p className="mb-8">
            {error ||
              'お探しのアートワークは存在しないか、削除された可能性があります。'}
          </p>
          <p className="text-white/70 text-sm">
            お探しのアートワークは見つかりませんでした
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Meta />
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-purple-700">
        {/* Background effect */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-yellow-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-pink-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white">
              夏祭りの思い出アート
            </h1>
            <p className="text-white/70 mt-2">QRコードから作品をダウンロード</p>
          </div>

          {/* Main content */}
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Artwork */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {compositeImageUrl ? (
                <img
                  src={compositeImageUrl}
                  alt={artwork.prompt}
                  className="w-full h-auto"
                />
              ) : (
                <div className="w-full aspect-square bg-gray-200 flex items-center justify-center">
                  <div className="text-gray-500">画像を準備中...</div>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="space-y-6">
              {/* QR Code */}
              {qrCodeUrl && (
                <div className="bg-white rounded-2xl p-6 shadow-xl text-center">
                  <h2 className="text-xl font-bold text-purple-900 mb-4">
                    このアートをシェア
                  </h2>
                  <img src={qrCodeUrl} alt="QR Code" className="mx-auto mb-4" />
                  <p className="text-sm text-gray-600">
                    QRコードを読み取って共有
                  </p>
                </div>
              )}

              {/* Details */}
              <div className="bg-white rounded-2xl p-6 shadow-xl space-y-4">
                <div>
                  <h3 className="text-sm text-gray-500 mb-1">作成日時</h3>
                  <p className="text-base text-gray-800">
                    {new Date(artwork.created_at).toLocaleString('ja-JP')}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm text-gray-500 mb-1">閲覧数</h3>
                  <p className="text-base text-gray-800">
                    {artwork.view_count} 回
                  </p>
                </div>

                {artwork.prompt && (
                  <div>
                    <h3 className="text-sm text-gray-500 mb-1">プロンプト</h3>
                    <p className="text-sm text-gray-700">{artwork.prompt}</p>
                  </div>
                )}
              </div>

              {/* アンケートリンク */}
              <div className="bg-white rounded-2xl p-6 shadow-xl">
                <h3 className="text-lg font-bold text-purple-900 mb-3 text-center">
                  ✨ 作品の感想をお聞かせください
                </h3>
                <p className="text-sm text-gray-600 mb-4 text-center">
                  アンケートにご協力いただけると嬉しいです
                </p>
                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLScytUp3Pa5v6vHTgPrKgTQMT9n4KVx2_SUFaasVv2XXF_eAGg/viewform"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-center font-semibold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  アンケートに回答する →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
