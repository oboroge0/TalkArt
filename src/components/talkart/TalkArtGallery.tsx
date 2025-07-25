import React, { useEffect, useState } from 'react'
import { useGalleryStore } from '@/stores/talkart/galleryStore'
import { GeneratedArtwork } from '@/features/talkart/types'

interface TalkArtGalleryProps {
  showTitle?: boolean
  maxItems?: number
  onArtworkClick?: (artwork: GeneratedArtwork) => void
}

export const TalkArtGallery: React.FC<TalkArtGalleryProps> = ({
  showTitle = true,
  maxItems = 20,
  onArtworkClick,
}) => {
  const { items, totalCount, isLoading, refreshGallery } = useGalleryStore()
  const [imagesLoaded, setImagesLoaded] = useState<Set<string>>(new Set())

  // コンポーネントマウント時にギャラリーを更新
  useEffect(() => {
    refreshGallery()
  }, [refreshGallery])

  // 画像の読み込み完了を追跡
  const handleImageLoad = (artworkId: string) => {
    setImagesLoaded((prev) => new Set([...prev, artworkId]))
  }

  // 表示するアイテムを制限
  const displayItems = items.slice(0, maxItems)

  if (isLoading && items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4" />
        <p className="text-white">ギャラリーを読み込んでいます...</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎨</div>
        <h3 className="text-xl font-bold text-white mb-2">
          まだ作品がありません
        </h3>
        <p className="text-gray-300">
          最初の夏祭りアートを作成してみませんか？
        </p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {showTitle && (
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            みんなの夏祭りアート
          </h2>
          <p className="text-gray-300">
            これまでに作成された作品: {totalCount}点
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {displayItems.map((item) => (
          <div
            key={item.id}
            className="group relative bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer"
            onClick={() => onArtworkClick?.(item.artwork)}
          >
            {/* 画像 */}
            <div className="aspect-square bg-gray-200 relative overflow-hidden">
              {!imagesLoaded.has(item.artwork.id) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                </div>
              )}
              <img
                src={item.artwork.imageUrl}
                alt="夏祭りアート"
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  imagesLoaded.has(item.artwork.id)
                    ? 'opacity-100'
                    : 'opacity-0'
                }`}
                onLoad={() => handleImageLoad(item.artwork.id)}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src =
                    'https://via.placeholder.com/300x300/6B46C1/FFFFFF?text=画像エラー'
                  handleImageLoad(item.artwork.id)
                }}
              />
              
              {/* ホバーオーバーレイ */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-white rounded-full p-3">
                    <svg
                      className="w-6 h-6 text-gray-800"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* 作品情報 */}
            <div className="p-3">
              <p className="text-xs text-gray-500 mb-1">
                {new Date(item.artwork.createdAt).toLocaleDateString('ja-JP', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <div className="flex flex-wrap gap-1">
                {item.artwork.metadata.themes.slice(0, 3).map((theme, index) => (
                  <span
                    key={index}
                    className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 更新インジケーター */}
      {isLoading && items.length > 0 && (
        <div className="text-center mt-6">
          <div className="inline-flex items-center text-white">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mr-2" />
            更新中...
          </div>
        </div>
      )}

      {/* もっと見るボタン（将来的な拡張用） */}
      {totalCount > maxItems && (
        <div className="text-center mt-8">
          <button
            onClick={() => refreshGallery()}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300"
          >
            もっと見る ({totalCount - maxItems}点)
          </button>
        </div>
      )}
    </div>
  )
}

// 軽量版のギャラリー（結果画面用）
export const TalkArtGalleryMini: React.FC = () => {
  return (
    <TalkArtGallery
      showTitle={false}
      maxItems={6}
      onArtworkClick={(artwork) => {
        // 作品詳細を表示（将来的な拡張）
        console.log('Artwork clicked:', artwork)
      }}
    />
  )
}