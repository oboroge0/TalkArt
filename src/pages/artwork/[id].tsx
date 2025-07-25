import React, { useEffect, useState } from 'react'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import { GeneratedArtwork } from '@/features/talkart/types'
import { TalkArtLayout } from '@/components/talkart/TalkArtLayout'
import { TalkArtBackground } from '@/components/talkart/TalkArtBackground'

interface ArtworkPageProps {
  artworkId: string
}

const ArtworkPage: React.FC<ArtworkPageProps> = ({ artworkId }) => {
  const router = useRouter()
  const [artwork, setArtwork] = useState<GeneratedArtwork | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchArtwork = async () => {
      try {
        setLoading(true)

        // ギャラリーAPIから作品を取得
        const response = await fetch('/api/talkart/gallery')
        const result = await response.json()

        if (result.success) {
          const foundArtwork = result.data.artworks.find(
            (art: GeneratedArtwork) => art.id === artworkId
          )

          if (foundArtwork) {
            setArtwork(foundArtwork)
          } else {
            setError('作品が見つかりませんでした')
          }
        } else {
          setError('作品の取得に失敗しました')
        }
      } catch (err) {
        console.error('Failed to fetch artwork:', err)
        setError('作品の取得中にエラーが発生しました')
      } finally {
        setLoading(false)
      }
    }

    if (artworkId) {
      fetchArtwork()
    }
  }, [artworkId])

  const handleBackToGallery = () => {
    router.push('/talkart')
  }

  if (loading) {
    return (
      <TalkArtLayout phase="RESULT">
        <TalkArtBackground />
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4" />
          <p className="text-white">作品を読み込んでいます...</p>
        </div>
      </TalkArtLayout>
    )
  }

  if (error || !artwork) {
    return (
      <TalkArtLayout phase="RESULT">
        <TalkArtBackground />
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-white mb-4">
            {error || '作品が見つかりません'}
          </h2>
          <button
            onClick={handleBackToGallery}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-300"
          >
            ギャラリーに戻る
          </button>
        </div>
      </TalkArtLayout>
    )
  }

  return (
    <TalkArtLayout phase="RESULT">
      <TalkArtBackground variant="fireworks" />
      <div className="text-center max-w-4xl mx-auto">
        {/* 作品タイトル */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">夏祭りの思い出</h1>
          <p className="text-xl text-gray-200">
            {new Date(artwork.createdAt).toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            に作成
          </p>
        </div>

        {/* メイン作品 */}
        <div className="mb-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-2xl">
              <img
                src={artwork.imageUrl}
                alt="Summer festival artwork"
                className="w-full h-auto rounded-xl"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src =
                    'https://via.placeholder.com/600x600/6B46C1/FFFFFF?text=作品'
                }}
              />

              {/* 作品詳細 */}
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">生成時間:</span>
                    <span className="ml-2">
                      {artwork.metadata.generationTime}ms
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">スタイル:</span>
                    <span className="ml-2">{artwork.metadata.artStyle}</span>
                  </div>
                </div>

                {/* テーマタグ */}
                {artwork.metadata.themes.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      テーマ:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {artwork.metadata.themes.map((theme, index) => (
                        <span
                          key={index}
                          className="inline-block bg-orange-100 text-orange-800 text-sm px-3 py-1 rounded-full"
                        >
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* プロンプト */}
                {artwork.prompt && (
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      生成プロンプト:
                    </p>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {artwork.prompt}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* アクション */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleBackToGallery}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-300"
          >
            ギャラリーに戻る
          </button>
          <button
            onClick={() => (window.location.href = '/talkart')}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-300"
          >
            新しい作品を作る
          </button>
        </div>
      </div>
    </TalkArtLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async ({
  params,
}) => {
  const artworkId = params?.id as string

  return {
    props: {
      artworkId,
    },
  }
}

export default ArtworkPage
