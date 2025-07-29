import React, { useState, useEffect } from 'react'
import { ArtStorage, StoredArtwork } from '@/features/talkart/artStorage'

interface TalkArtGalleryProps {
  onClose: () => void
  onSelectArtwork?: (artwork: StoredArtwork) => void
}

export const TalkArtGallery: React.FC<TalkArtGalleryProps> = ({
  onClose,
  onSelectArtwork,
}) => {
  const [artworks, setArtworks] = useState<StoredArtwork[]>([])
  const [selectedArtwork, setSelectedArtwork] = useState<StoredArtwork | null>(
    null
  )
  const [filter, setFilter] = useState<'all' | 'today' | 'featured'>('all')
  const [stats, setStats] = useState({ total: 0, today: 0, featured: 0 })

  const artStorage = new ArtStorage()

  useEffect(() => {
    loadGallery()
  }, [filter])

  const loadGallery = () => {
    const allArtworks = artStorage.getGallery()
    const galleryStats = artStorage.getGalleryStats()
    setStats(galleryStats)

    let filtered = allArtworks
    if (filter === 'today') {
      const today = new Date().toDateString()
      filtered = allArtworks.filter(
        (artwork) =>
          new Date(artwork.metadata.createdAt).toDateString() === today
      )
    } else if (filter === 'featured') {
      filtered = artStorage.getFeaturedArtworks()
    }

    setArtworks(filtered)
  }

  const handleLike = (artwork: StoredArtwork) => {
    const newLikes = (artwork.likes || 0) + 1
    artStorage.updateArtwork(artwork.id, { likes: newLikes })
    loadGallery()
  }

  const handleToggleFeatured = (artwork: StoredArtwork) => {
    artStorage.updateArtwork(artwork.id, { featured: !artwork.featured })
    loadGallery()
  }

  const handleDelete = (artwork: StoredArtwork) => {
    if (confirm('このアートワークを削除しますか？')) {
      artStorage.deleteArtwork(artwork.id)
      setSelectedArtwork(null)
      loadGallery()
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto animate-fadeIn">
      {/* Header */}
      <div className="sticky top-0 bg-purple-900/90 backdrop-blur-sm p-4 border-b border-yellow-400/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h2 className="text-2xl font-bold text-yellow-400">
            夏祭りの思い出ギャラリー
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-yellow-400 transition-colors"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Filters and Stats */}
        <div className="max-w-7xl mx-auto mt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                filter === 'all'
                  ? 'bg-yellow-400 text-purple-900'
                  : 'bg-purple-700 text-white hover:bg-purple-600'
              }`}
            >
              すべて ({stats.total})
            </button>
            <button
              onClick={() => setFilter('today')}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                filter === 'today'
                  ? 'bg-yellow-400 text-purple-900'
                  : 'bg-purple-700 text-white hover:bg-purple-600'
              }`}
            >
              今日 ({stats.today})
            </button>
            <button
              onClick={() => setFilter('featured')}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                filter === 'featured'
                  ? 'bg-yellow-400 text-purple-900'
                  : 'bg-purple-700 text-white hover:bg-purple-600'
              }`}
            >
              お気に入り ({stats.featured})
            </button>
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="max-w-7xl mx-auto p-4">
        {artworks.length === 0 ? (
          <div className="text-center py-20 text-white/70">
            <p className="text-lg">まだアートワークがありません</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {artworks.map((artwork) => (
              <div
                key={artwork.id}
                className="relative group cursor-pointer transform transition-all hover:scale-105"
                onClick={() => setSelectedArtwork(artwork)}
              >
                <div className="aspect-square bg-purple-800 rounded-lg overflow-hidden">
                  <img
                    src={artwork.imageUrl}
                    alt={artwork.prompt}
                    className="w-full h-full object-cover"
                  />

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                    <p className="text-white text-sm truncate">
                      {artwork.prompt}
                    </p>
                    <p className="text-yellow-400 text-xs">
                      {formatDate(artwork.metadata.createdAt.toString())}
                    </p>
                  </div>

                  {/* Featured badge */}
                  {artwork.featured && (
                    <div className="absolute top-2 right-2 bg-yellow-400 text-purple-900 rounded-full p-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Artwork Detail Modal */}
      {selectedArtwork && (
        <div
          className="fixed inset-0 bg-black/90 z-60 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedArtwork(null)}
        >
          <div
            className="bg-purple-900 rounded-2xl max-w-4xl max-h-[90vh] overflow-y-auto animate-slideInUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img
                src={selectedArtwork.imageUrl}
                alt={selectedArtwork.prompt}
                className="w-full h-auto rounded-t-2xl"
              />
              <button
                onClick={() => setSelectedArtwork(null)}
                className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <h3 className="text-xl font-bold text-yellow-400 mb-3">
                アートワーク詳細
              </h3>

              <div className="space-y-3 text-white">
                <div>
                  <p className="text-sm text-white/70 mb-1">プロンプト</p>
                  <p className="text-base">{selectedArtwork.prompt}</p>
                </div>

                <div>
                  <p className="text-sm text-white/70 mb-1">作成日時</p>
                  <p className="text-base">
                    {new Date(
                      selectedArtwork.metadata.createdAt
                    ).toLocaleString('ja-JP')}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <p className="text-sm text-white/70">いいね:</p>
                  <p className="text-base">{selectedArtwork.likes || 0}</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleLike(selectedArtwork)}
                  className="flex-1 bg-pink-500 text-white py-2 px-4 rounded-full hover:bg-pink-600 transition-colors flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                      clipRule="evenodd"
                    />
                  </svg>
                  いいね！
                </button>

                <button
                  onClick={() => handleToggleFeatured(selectedArtwork)}
                  className={`flex-1 py-2 px-4 rounded-full transition-colors flex items-center justify-center gap-2 ${
                    selectedArtwork.featured
                      ? 'bg-yellow-400 text-purple-900 hover:bg-yellow-500'
                      : 'bg-purple-700 text-white hover:bg-purple-600'
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {selectedArtwork.featured ? 'お気に入り解除' : 'お気に入り'}
                </button>

                <button
                  onClick={() => handleDelete(selectedArtwork)}
                  className="bg-red-500 text-white py-2 px-4 rounded-full hover:bg-red-600 transition-colors"
                >
                  削除
                </button>
              </div>

              {onSelectArtwork && (
                <button
                  onClick={() => {
                    onSelectArtwork(selectedArtwork)
                    setSelectedArtwork(null)
                  }}
                  className="w-full mt-3 bg-green-500 text-white py-2 px-4 rounded-full hover:bg-green-600 transition-colors"
                >
                  このアートワークを選択
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
