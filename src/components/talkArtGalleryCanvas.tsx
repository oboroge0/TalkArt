import React, { useState, useEffect, useRef, useCallback } from 'react'
import Konva from 'konva'
import {
  Stage,
  Layer,
  Group,
  Image,
  Rect,
  Circle,
  Text,
  Line,
  Ring,
} from 'react-konva'
import useImage from 'use-image'
import { supabaseArtStorage } from '@/features/talkart/supabaseArtStorage'
import { TalkArtArtwork } from '@/lib/supabase'
import {
  GalleryLayoutEngine,
  LayoutPosition,
} from '@/features/talkart/galleryLayoutEngine'
import { talkArtSoundEffects } from '@/features/talkart/soundEffects'
import {
  supabaseRealtimeGalleryService,
  SupabaseRealtimeEvent,
} from '@/features/talkart/supabaseRealtimeService'

interface TalkArtGalleryCanvasProps {
  onClose: () => void
  onSelectArtwork?: (artwork: TalkArtArtwork) => void
  shouldRefresh?: boolean
  onRefreshComplete?: () => void
  onSwitchToHtml?: () => void
}

// Individual artwork component
interface ArtworkNodeProps {
  artwork: TalkArtArtwork
  layout: LayoutPosition
  isHovered: boolean
  onHover: (id: string | null) => void
  onClick: (artwork: TalkArtArtwork) => void
  onDragEnd: (id: string, x: number, y: number) => void
}

// Load and render individual artwork image
const ArtworkImage: React.FC<{ url: string }> = ({ url }) => {
  const [image] = useImage(url, 'anonymous')
  return <Image image={image} width={180} height={160} x={10} y={10} />
}

const ArtworkNode: React.FC<ArtworkNodeProps> = ({
  artwork,
  layout,
  isHovered,
  onHover,
  onClick,
  onDragEnd,
}) => {
  const groupRef = useRef<Konva.Group>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Handle hover animations
  useEffect(() => {
    if (!groupRef.current) return

    const node = groupRef.current
    node.to({
      scaleX: isHovered ? layout.scale * 1.05 : layout.scale,
      scaleY: isHovered ? layout.scale * 1.05 : layout.scale,
      shadowBlur: isHovered ? 30 : 20,
      duration: 0.3,
      easing: Konva.Easings.EaseOut,
    })
  }, [isHovered, layout.scale])

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
    })
  }

  // Decoration colors
  const decorationColorIndex = artwork.id.charCodeAt(0) % 3
  const pinColorIndex = artwork.id.charCodeAt(1) % 4
  const tapeColors = ['#fef3c7', '#e0e7ff', '#fce7f3']
  const pinColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b']
  const tapeColor = tapeColors[decorationColorIndex]
  const pinColor = pinColors[pinColorIndex]

  return (
    <Group
      ref={groupRef}
      x={layout.x}
      y={layout.y}
      rotation={layout.rotation}
      scaleX={layout.scale}
      scaleY={layout.scale}
      draggable
      onMouseEnter={() => {
        document.body.style.cursor = 'pointer'
        onHover(artwork.id)
        talkArtSoundEffects.playPaperRustle()
      }}
      onMouseLeave={() => {
        document.body.style.cursor = 'default'
        onHover(null)
      }}
      onClick={() => {
        talkArtSoundEffects.playPaperFlip()
        onClick(artwork)
      }}
      onDragStart={() => {
        setIsDragging(true)
        document.body.style.cursor = 'grabbing'
        talkArtSoundEffects.playPaperRustle()
      }}
      onDragEnd={(e) => {
        setIsDragging(false)
        document.body.style.cursor = 'default'
        onDragEnd(artwork.id, e.target.x(), e.target.y())
      }}
      offsetX={100}
      offsetY={100}
      shadowColor="black"
      shadowBlur={20}
      shadowOffset={{ x: 4, y: 4 }}
      shadowOpacity={0.3}
    >
      {/* White background with padding */}
      <Rect
        width={200}
        height={200}
        fill="white"
        cornerRadius={8}
        stroke={isDragging ? '#fbbf24' : undefined}
        strokeWidth={isDragging ? 3 : 0}
      />

      {/* Paper texture effect */}
      <Rect
        width={200}
        height={200}
        fill="url(#paper-texture)"
        opacity={0.1}
        cornerRadius={8}
      />

      {/* Artwork image */}
      <ArtworkImage url={artwork.image_url} />

      {/* Decorations based on layout type */}
      {layout.decorationType !== 'pin' && (
        <Group>
          {/* Tape decoration with texture */}
          <Rect
            x={80}
            y={-10}
            width={40}
            height={20}
            fill={tapeColor}
            rotation={layout.tapeRotation || 0}
            opacity={0.9}
            cornerRadius={2}
          />
          {/* Tape edges */}
          <Line
            points={[80, -10, 120, -10]}
            stroke="rgba(0,0,0,0.1)"
            strokeWidth={1}
            rotation={layout.tapeRotation || 0}
            tension={0.1}
          />
        </Group>
      )}

      {layout.decorationType === 'pin' && (
        <Group>
          {/* Pin shadow */}
          <Circle
            x={100}
            y={12}
            radius={10}
            fill="black"
            opacity={0.3}
            blur={3}
          />
          {/* Pin body */}
          <Circle x={100} y={10} radius={8} fill={pinColor} />
          {/* Pin highlight */}
          <Circle x={98} y={8} radius={3} fill="white" opacity={0.6} />
        </Group>
      )}

      {/* Additional tape for 'both' decoration */}
      {layout.decorationType === 'both' && (
        <Group>
          <Rect
            x={80}
            y={180}
            width={40}
            height={20}
            fill={tapeColors[(decorationColorIndex + 1) % 3]}
            rotation={-layout.tapeRotation! || 0}
            opacity={0.9}
            cornerRadius={2}
          />
        </Group>
      )}

      {/* Paper corner fold */}
      {artwork.id.charCodeAt(2) % 3 > 1 && (
        <Group>
          <Line
            points={
              artwork.id.charCodeAt(3) % 2 === 0
                ? [175, 0, 200, 0, 200, 25] // top-right
                : [0, 175, 0, 200, 25, 200] // bottom-left
            }
            fill="rgba(0,0,0,0.1)"
            closed
          />
        </Group>
      )}

      {/* Date and view count */}
      <Group x={10} y={175}>
        {/* Background */}
        <Rect
          width={180}
          height={20}
          fill="rgba(255,255,255,0.9)"
          cornerRadius={10}
        />

        {/* Date text */}
        <Text
          text={formatDate(artwork.created_at)}
          fontSize={12}
          fontFamily="sans-serif"
          fill="#6b7280"
          x={5}
          y={4}
        />

        {/* View count */}
        <Group x={140}>
          {/* Heart icon (simplified) */}
          <Circle x={10} y={10} radius={5} fill="#ef4444" opacity={0.7} />
          <Text
            text={`${artwork.view_count || 0}`}
            fontSize={11}
            fontFamily="sans-serif"
            fill="#6b7280"
            x={20}
            y={4}
          />
        </Group>
      </Group>
    </Group>
  )
}

export const TalkArtGalleryCanvas: React.FC<TalkArtGalleryCanvasProps> = ({
  onClose,
  onSelectArtwork,
  shouldRefresh = false,
  onRefreshComplete,
  onSwitchToHtml,
}) => {
  const [artworks, setArtworks] = useState<TalkArtArtwork[]>([])
  const [layouts, setLayouts] = useState<Map<string, LayoutPosition>>(new Map())
  const [selectedArtwork, setSelectedArtwork] = useState<TalkArtArtwork | null>(
    null
  )
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'today'>('all')
  const [stats, setStats] = useState({ total: 0, today: 0 })
  const [realtimeEnabled, setRealtimeEnabled] = useState(true)
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 })

  const containerRef = useRef<HTMLDivElement>(null)
  const layoutEngineRef = useRef<GalleryLayoutEngine | null>(null)

  // Load gallery data
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

  // Calculate layouts for artworks
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

  // Handle artwork drag end
  const handleDragEnd = (id: string, x: number, y: number) => {
    setLayouts((prev) => {
      const newLayouts = new Map(prev)
      const layout = newLayouts.get(id)
      if (layout) {
        newLayouts.set(id, { ...layout, x, y })
      }
      return newLayouts
    })
  }

  // Initialize and handle resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setStageSize({ width: rect.width, height: rect.height - 120 })

        if (!layoutEngineRef.current) {
          layoutEngineRef.current = new GalleryLayoutEngine(
            rect.width - 100,
            rect.height - 250,
            200,
            200
          )
        } else {
          layoutEngineRef.current.updateDimensions(
            rect.width - 100,
            rect.height - 250
          )
        }

        if (artworks.length > 0) {
          calculateLayouts(artworks)
        }
      }
    }

    updateSize()
    loadGallery()

    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [loadGallery, artworks.length])

  // Setup realtime connection
  useEffect(() => {
    if (!realtimeEnabled) return

    supabaseRealtimeGalleryService.connect()

    const unsubscribe = supabaseRealtimeGalleryService.subscribe(
      (event: SupabaseRealtimeEvent) => {
        if (event.type === 'new_artwork') {
          loadGallery()
          talkArtSoundEffects.playCorkPop()
        }
      }
    )

    return () => {
      unsubscribe()
      supabaseRealtimeGalleryService.disconnect()
    }
  }, [realtimeEnabled, loadGallery])

  // Handle refresh
  useEffect(() => {
    if (shouldRefresh && layoutEngineRef.current) {
      setTimeout(() => {
        loadGallery()
        if (onRefreshComplete) {
          onRefreshComplete()
        }
      }, 100)
    }
  }, [shouldRefresh, onRefreshComplete, loadGallery])

  return (
    <div className="fixed inset-0 bg-amber-50 z-50 overflow-hidden animate-fadeIn">
      {/* Background texture */}
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

        {/* Filters */}
        <div className="max-w-7xl mx-auto mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {(['all', 'today'] as const).map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-4 py-2 rounded-full font-medium transition-all transform hover:scale-105 ${
                  filter === filterType
                    ? 'bg-yellow-400 text-amber-900 shadow-md'
                    : 'bg-white/50 text-amber-700 hover:bg-white/70'
                }`}
              >
                {filterType === 'all' && `すべて (${stats.total})`}
                {filterType === 'today' && `今日 (${stats.today})`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Canvas mode indicator */}
            <div className="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-full">
              <span className="text-green-700 font-medium">
                ✨ Canvas Mode (ドラッグ可能)
              </span>
            </div>

            {/* Switch to HTML mode */}
            {onSwitchToHtml && (
              <button
                onClick={onSwitchToHtml}
                className="bg-amber-600 text-white px-6 py-2 rounded-full font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
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
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
                HTML Mode
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Canvas container */}
      <div ref={containerRef} className="relative h-[calc(100vh-120px)]">
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
          <Stage width={stageSize.width} height={stageSize.height}>
            <Layer>
              {artworks.map((artwork) => {
                const layout = layouts.get(artwork.id)
                if (!layout) return null

                return (
                  <ArtworkNode
                    key={artwork.id}
                    artwork={artwork}
                    layout={layout}
                    isHovered={hoveredId === artwork.id}
                    onHover={setHoveredId}
                    onClick={(art) => {
                      setSelectedArtwork(art)
                      if (onSelectArtwork) onSelectArtwork(art)
                    }}
                    onDragEnd={handleDragEnd}
                  />
                )
              })}
            </Layer>
          </Stage>
        )}
      </div>

      {/* Selected artwork modal (keeping HTML version for now) */}
      {selectedArtwork && (
        <div
          className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedArtwork(null)}
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
                  <p className="text-sm text-gray-500">閲覧数:</p>
                  <p className="text-base font-medium">
                    {selectedArtwork.view_count || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
