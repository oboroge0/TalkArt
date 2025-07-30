// Gallery share page
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { TalkArtArtwork } from '@/lib/supabase'
import { Meta } from '@/components/meta'
import QRCode from 'qrcode'

export default function GallerySharePage() {
  const router = useRouter()
  const { id } = router.query
  const [artwork, setArtwork] = useState<TalkArtArtwork | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')

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
          <button
            onClick={() => router.push('/gallery')}
            className="px-6 py-3 bg-yellow-400 text-purple-900 rounded-full font-bold hover:scale-105 transition-transform"
          >
            ギャラリーへ戻る
          </button>
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
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">
              夏祭りの思い出アート
            </h1>
            <button
              onClick={() => router.push('/gallery')}
              className="px-4 py-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors"
            >
              ギャラリーへ戻る
            </button>
          </div>

          {/* Main content */}
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Artwork */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <img
                src={artwork.image_url}
                alt={artwork.prompt}
                className="w-full h-auto"
              />
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
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
