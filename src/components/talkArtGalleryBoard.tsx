import React, { useState, useEffect, useRef, useCallback } from 'react'
import { supabaseArtStorage } from '@/features/talkart/supabaseArtStorage'
import { TalkArtArtwork } from '@/lib/supabase'
import {
  GalleryLayoutEngine,
  LayoutPosition,
  createPaperFlutterAnimation,
} from '@/features/talkart/galleryLayoutEngine'
import {
  TapeDecoration,
  PinDecoration,
  HandwrittenHeart,
  PaperCornerFold,
  BulletinBoardTexture,
} from './talkArtDecorations'
import { talkArtAudioManager } from '@/features/talkart/audioManager'
import { talkArtSoundEffects } from '@/features/talkart/soundEffects'
import {
  supabaseRealtimeGalleryService,
  SupabaseRealtimeEvent,
} from '@/features/talkart/supabaseRealtimeService'
import { TalkArtFlyingAnimation } from './talkArtFlyingAnimation'

interface TalkArtGalleryBoardProps {
  onClose: () => void
  onSelectArtwork?: (artwork: TalkArtArtwork) => void
  shouldRefresh?: boolean
  onRefreshComplete?: () => void
}

export const TalkArtGalleryBoard: React.FC<TalkArtGalleryBoardProps> = ({
  onClose,
  onSelectArtwork,
  shouldRefresh = false,
  onRefreshComplete,
}) => {
  const [artworks, setArtworks] = useState<TalkArtArtwork[]>([])
  const [layouts, setLayouts] = useState<Map<string, LayoutPosition>>(new Map())
  const [selectedArtwork, setSelectedArtwork] = useState<TalkArtArtwork | null>(
    null
  )
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'today'>('all')
  const [stats, setStats] = useState({ total: 0, today: 0 })
  const [isReorganizing, setIsReorganizing] = useState(false)
  const [realtimeEnabled, setRealtimeEnabled] = useState(true)
  const [incomingArtwork, setIncomingArtwork] = useState<TalkArtArtwork | null>(
    null
  )
  const [flyingStartPosition, setFlyingStartPosition] = useState({ x: 0, y: 0 })

  const boardRef = useRef<HTMLDivElement>(null)
  const layoutEngineRef = useRef<GalleryLayoutEngine | null>(null)

  const loadGallery = useCallback(async () => {
    const allArtworks = await supabaseArtStorage.getRecentArtworks(50)
    const galleryStats = await supabaseArtStorage.getGalleryStats()
    setStats({
      total: galleryStats.total,
      today: galleryStats.today,
    })

    let filtered = allArtworks
    if (filter === 'today') {
      const today = new Date().toDateString()
      filtered = allArtworks.filter(
        (artwork) => new Date(artwork.created_at).toDateString() === today
      )
    }

    setArtworks(filtered)
    calculateLayouts(filtered)
  }, [filter])

  const calculateLayouts = (artworkList: TalkArtArtwork[]) => {
    if (!layoutEngineRef.current) return

    layoutEngineRef.current.reset()
    const newLayouts = new Map<string, LayoutPosition>()

    artworkList.forEach((artwork, index) => {
      const position = layoutEngineRef.current!.generatePosition(index)
      newLayouts.set(artwork.id, position)
    })

    setLayouts(newLayouts)
  }

  const recalculateLayouts = () => {
    calculateLayouts(artworks)
  }

  const triggerReorganization = () => {
    setIsReorganizing(true)
    setTimeout(() => {
      recalculateLayouts()
      setIsReorganizing(false)
    }, 500)
  }

  // Initialize layout engine
  useEffect(() => {
    if (boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect()
      layoutEngineRef.current = new GalleryLayoutEngine(
        rect.width - 100, // Padding
        rect.height - 150, // Header space
        200,
        200
      )
      loadGallery()

      // Check for new artwork arrival
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('from') === 'result') {
        triggerReorganization()
      }
    }

    // Handle resize
    const handleResize = () => {
      if (boardRef.current && layoutEngineRef.current) {
        const rect = boardRef.current.getBoundingClientRect()
        layoutEngineRef.current.updateDimensions(
          rect.width - 100,
          rect.height - 150
        )
        recalculateLayouts()
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [loadGallery])

  // Handle refresh request from parent
  useEffect(() => {
    if (shouldRefresh && boardRef.current && layoutEngineRef.current) {
      // Small delay to ensure artwork is saved to localStorage
      setTimeout(() => {
        loadGallery()
        triggerReorganization()
        if (onRefreshComplete) {
          onRefreshComplete()
        }
      }, 100)
    }
  }, [shouldRefresh, onRefreshComplete, loadGallery])

  // Reload gallery when filter changes
  useEffect(() => {
    if (boardRef.current && layoutEngineRef.current) {
      loadGallery()
    }
  }, [filter, loadGallery])

  // Setup realtime connection
  useEffect(() => {
    if (!realtimeEnabled) return

    // Connect to Supabase realtime
    supabaseRealtimeGalleryService.connect()

    // Subscribe to events
    const unsubscribe = supabaseRealtimeGalleryService.subscribe(
      (event: SupabaseRealtimeEvent) => {
        switch (event.type) {
          case 'new_artwork':
            if (event.artwork) {
              // Reload gallery to show new artwork
              loadGallery()
              talkArtSoundEffects.playCorkPop()
            }
            break

          case 'update_artwork':
            if (event.artwork) {
              // Update the artwork in the list
              setArtworks((prev) =>
                prev.map((art) =>
                  art.id === event.artwork!.id ? event.artwork! : art
                )
              )
            }
            break

          case 'delete_artwork':
            if (event.artwork) {
              // Remove the artwork from the list
              setArtworks((prev) =>
                prev.filter((art) => art.id !== event.artwork!.id)
              )
            }
            break
        }
      }
    )

    return () => {
      unsubscribe()
      supabaseRealtimeGalleryService.disconnect()
    }
  }, [realtimeEnabled, loadGallery])

  const handleIncomingArtwork = (artwork: any) => {
    // Will convert to TalkArtArtwork format
    // Calculate random start position from edges
    const side = Math.floor(Math.random() * 4)
    let startX = 0,
      startY = 0

    switch (side) {
      case 0: // Top
        startX = Math.random() * window.innerWidth
        startY = -100
        break
      case 1: // Right
        startX = window.innerWidth + 100
        startY = Math.random() * window.innerHeight
        break
      case 2: // Bottom
        startX = Math.random() * window.innerWidth
        startY = window.innerHeight + 100
        break
      case 3: // Left
        startX = -100
        startY = Math.random() * window.innerHeight
        break
    }

    setFlyingStartPosition({ x: startX, y: startY })
    setIncomingArtwork(artwork)

    // Play notification sound
    talkArtSoundEffects.playCorkPop()
  }

  const handleIncomingArtworkComplete = () => {
    if (incomingArtwork) {
      // Just reload gallery to show new artwork (already saved to Supabase)
      loadGallery()
      triggerReorganization()

      setIncomingArtwork(null)
    }
  }

  const handleLike = useCallback(
    (e: React.MouseEvent, artwork: TalkArtArtwork) => {
      e.stopPropagation()
      // TODO: Implement like functionality with Supabase

      // Play a subtle sound effect
      playPaperSound()
    },
    []
  )

  const handleDelete = useCallback(
    (artwork: TalkArtArtwork) => {
      if (confirm('このアートワークを削除しますか？')) {
        // TODO: Implement delete functionality with Supabase
        setSelectedArtwork(null)
        playTapeSound()
      }
    },
    [filter]
  )

  // Sound effects
  const playPaperSound = async () => {
    await talkArtSoundEffects.playPaperRustle()
  }

  const playPinSound = async () => {
    await talkArtSoundEffects.playPinPush()
  }

  const playTapeSound = async () => {
    await talkArtSoundEffects.playTapeRip()
  }

  const playFlipSound = async () => {
    await talkArtSoundEffects.playPaperFlip()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
    })
  }

  // Generate flutter animation styles
  const getFlutterStyle = (baseRotation: number) => {
    const styleTag = document.createElement('style')
    styleTag.textContent = createPaperFlutterAnimation(baseRotation, 0.5)
    return styleTag
  }

  return (
    <div className="fixed inset-0 bg-amber-50 z-50 overflow-hidden animate-fadeIn">
      <BulletinBoardTexture />

      {/* Cork board texture background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(139, 115, 85, 0.03) 10px,
              rgba(139, 115, 85, 0.03) 20px
            )
          `,
          backgroundColor: '#D2B48C',
        }}
      />

      {/* Header */}
      <div className="relative bg-amber-800/10 backdrop-blur-sm p-4 border-b-4 border-amber-700/20 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h2
            className="text-3xl font-bold text-amber-900"
            style={{ fontFamily: 'serif' }}
          >
            🎋 夏祭りの思い出掲示板 🎋
          </h2>
          <button
            onClick={onClose}
            className="text-amber-700 hover:text-amber-900 transition-colors bg-white/50 rounded-full p-2"
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

        {/* Filters and Realtime Toggle */}
        <div className="max-w-7xl mx-auto mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {(['all', 'today'] as const).map((filterType) => (
              <button
                key={filterType}
                onClick={() => {
                  setFilter(filterType)
                }}
                className={`px-4 py-2 rounded-full font-medium transition-all transform hover:scale-105 ${
                  filter === filterType
                    ? 'bg-yellow-400 text-amber-900 shadow-md'
                    : 'bg-white/50 text-amber-700 hover:bg-white/70'
                }`}
                style={{ fontFamily: 'sans-serif' }}
              >
                {filterType === 'all' && `すべて (${stats.total})`}
                {filterType === 'today' && `今日 (${stats.today})`}
              </button>
            ))}
          </div>

          {/* Realtime Toggle */}
          <div className="flex items-center gap-2 bg-white/50 px-4 py-2 rounded-full">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={realtimeEnabled}
                onChange={(e) => {
                  setRealtimeEnabled(e.target.checked)
                  supabaseRealtimeGalleryService.setEnabled(e.target.checked)
                }}
                className="w-4 h-4 text-yellow-400 rounded focus:ring-yellow-500"
              />
              <span className="text-amber-700 font-medium">
                リアルタイム更新
              </span>
            </label>
            {supabaseRealtimeGalleryService.isConnected() && (
              <span
                className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                title="接続中"
              />
            )}
          </div>
        </div>
      </div>

      {/* Gallery Board */}
      <div
        ref={boardRef}
        className="relative h-[calc(100vh-120px)] p-12 overflow-auto"
      >
        {artworks.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8 bg-white/50 rounded-lg shadow-lg">
              <p className="text-xl text-amber-700">
                まだアートワークがありません
              </p>
              <p className="text-sm text-amber-600 mt-2">
                最初の作品を作ってみましょう！
              </p>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full">
            {artworks.map((artwork) => {
              const layout = layouts.get(artwork.id)
              if (!layout) return null

              const isHovered = hoveredId === artwork.id
              // Use artwork ID to generate consistent colors
              const decorationColorIndex = artwork.id.charCodeAt(0) % 3
              const pinColorIndex = artwork.id.charCodeAt(1) % 4
              const decorationColors = ['yellow', 'white', 'pink'] as const
              const pinColors = ['red', 'blue', 'green', 'yellow'] as const
              const decorationColor = decorationColors[decorationColorIndex]
              const pinColor = pinColors[pinColorIndex]

              return (
                <div
                  key={artwork.id}
                  className="absolute cursor-pointer transition-all duration-300"
                  style={{
                    left: layout.x,
                    top: layout.y,
                    transform: `
                      translate(-50%, -50%) 
                      rotate(${layout.rotation}deg) 
                      scale(${layout.scale})
                    `,
                    zIndex: isHovered ? 1000 : layout.zIndex,
                    transformOrigin: 'center center',
                    transition: isReorganizing
                      ? 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'
                      : 'all 0.3s ease',
                  }}
                  onMouseEnter={() => {
                    setHoveredId(artwork.id)
                    playPaperSound()
                  }}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => {
                    playFlipSound()
                    setSelectedArtwork(artwork)
                    setHoveredId(null) // Clear hover state when clicking
                  }}
                >
                  {/* Shadow */}
                  <div
                    className="absolute inset-0 bg-black/20 blur-lg"
                    style={{
                      transform: 'translate(4px, 4px)',
                      borderRadius: '8px',
                    }}
                  />

                  {/* Photo container */}
                  <div
                    className="relative bg-white p-2 rounded-lg shadow-xl"
                    style={{
                      width: '200px',
                      height: '200px',
                      transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                      boxShadow: isHovered
                        ? '0 15px 30px rgba(0,0,0,0.3)'
                        : '0 10px 25px rgba(0,0,0,0.2)',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {/* Image with relative positioning */}
                    <div className="relative">
                      <img
                        src={artwork.image_url}
                        alt={artwork.prompt}
                        className="w-full h-[160px] object-cover rounded"
                        style={{
                          filter: isHovered
                            ? 'brightness(1.05)'
                            : 'brightness(1)',
                        }}
                      />
                    </div>

                    {/* Decorations (above image) */}
                    {layout.decorationType === 'tape' && (
                      <TapeDecoration
                        rotation={layout.tapeRotation}
                        color={decorationColor}
                      />
                    )}
                    {layout.decorationType === 'pin' && (
                      <PinDecoration color={pinColor} />
                    )}
                    {layout.decorationType === 'both' && (
                      <>
                        <TapeDecoration
                          rotation={layout.tapeRotation}
                          color={decorationColor}
                        />
                        <div style={{ transform: 'translateY(160px)' }}>
                          <TapeDecoration
                            rotation={-layout.tapeRotation!}
                            color={
                              decorationColors[(decorationColorIndex + 1) % 3]
                            }
                          />
                        </div>
                      </>
                    )}

                    {/* Paper corner fold */}
                    {artwork.id.charCodeAt(2) % 3 > 1 && (
                      <PaperCornerFold
                        corner={
                          artwork.id.charCodeAt(3) % 2 === 0
                            ? 'top-right'
                            : 'bottom-left'
                        }
                        size={25}
                      />
                    )}

                    {/* Info overlay */}
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                      <p className="text-xs text-gray-600 truncate max-w-[120px]">
                        {formatDate(artwork.created_at)}
                      </p>
                      <button
                        onClick={(e) => handleLike(e, artwork)}
                        className="flex items-center gap-1 bg-white/80 rounded-full px-2 py-1"
                      >
                        <HandwrittenHeart filled={false} size={16} />
                        <span className="text-xs text-gray-700">
                          {artwork.view_count || 0}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Selected artwork modal */}
      {selectedArtwork && (
        <div
          className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => {
            setSelectedArtwork(null)
            setHoveredId(null) // Clear hover state when closing modal
          }}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl max-h-[90vh] overflow-y-auto animate-slideInUp shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img
                src={selectedArtwork.image_url}
                alt={selectedArtwork.prompt}
                className="w-full h-auto rounded-t-2xl"
              />
              <button
                onClick={() => {
                  setSelectedArtwork(null)
                  setHoveredId(null) // Clear hover state when closing with button
                }}
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
              <h3 className="text-xl font-bold text-amber-900 mb-3">
                アートワーク詳細
              </h3>

              <div className="space-y-3 text-gray-700">
                <div>
                  <p className="text-sm text-gray-500 mb-1">プロンプト</p>
                  <p className="text-base">{selectedArtwork.prompt}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">作成日時</p>
                  <p className="text-base">
                    {new Date(selectedArtwork.created_at).toLocaleString(
                      'ja-JP'
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <p className="text-sm text-gray-500">いいね:</p>
                  <div className="flex items-center gap-1">
                    <HandwrittenHeart filled size={20} />
                    <p className="text-base font-medium">
                      {selectedArtwork.view_count || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleDelete(selectedArtwork)}
                  className="bg-red-500 text-white py-2 px-4 rounded-full hover:bg-red-600 transition-colors"
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Incoming Artwork Animation */}
      {incomingArtwork && (
        <TalkArtFlyingAnimation
          artwork={{
            imageUrl: incomingArtwork.image_url,
            prompt: incomingArtwork.prompt,
            metadata: {
              createdAt: new Date(incomingArtwork.created_at),
              sessionId: incomingArtwork.session_id,
              generationTime: 0,
              style: 'watercolor',
              themes: [],
            },
          }}
          startPosition={flyingStartPosition}
          onComplete={handleIncomingArtworkComplete}
        />
      )}
    </div>
  )
}
