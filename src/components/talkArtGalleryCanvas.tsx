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
import QRCode from 'qrcode'
import { supabaseArtStorage } from '@/features/talkart/supabaseArtStorage'
import { TalkArtArtwork, supabase } from '@/lib/supabase'
import { ArtworkComposer } from '@/utils/artworkComposer'
import {
  GalleryLayoutEngine,
  LayoutPosition,
} from '@/features/talkart/galleryLayoutEngine'
import { talkArtSoundEffects } from '@/features/talkart/soundEffects'
import {
  realtimeGalleryService,
  RealtimeEvent,
} from '@/features/talkart/realtimeService'

interface TalkArtGalleryCanvasProps {
  onClose: () => void
  onSelectArtwork?: (artwork: TalkArtArtwork) => void
  shouldRefresh?: boolean
  onRefreshComplete?: () => void
}

// Individual artwork component
interface ArtworkNodeProps {
  artwork: TalkArtArtwork
  layout: LayoutPosition
  isHovered: boolean
  onHover: (id: string | null) => void
  onClick: (artwork: TalkArtArtwork) => void
  onDragEnd: (id: string, x: number, y: number) => void
  onQRClick: (artwork: TalkArtArtwork) => void
}

// QR Code Hook
const useArtworkQRCode = (artwork: TalkArtArtwork) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const baseUrl = window.location.origin
        const shareCode = artwork.id
        const url = `${baseUrl}/gallery/${shareCode}`

        const qrUrl = await QRCode.toDataURL(url, {
          width: 128,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        })
        setQrCodeUrl(qrUrl)
      } catch (error) {
        console.error(
          'Failed to generate QR code for artwork:',
          artwork.id,
          error
        )
      }
    }

    generateQRCode()
  }, [artwork.id])

  return qrCodeUrl
}

// QR Code Modal Component
const QRCodeModal: React.FC<{
  artwork: TalkArtArtwork
  onClose: () => void
}> = ({ artwork, onClose }) => {
  const qrCodeUrl = useArtworkQRCode(artwork)

  if (!qrCodeUrl) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">QRコードを生成中...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-purple-900 mb-2">
          アートワークをダウンロード
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          QRコードを読み取ってスマホでダウンロード
        </p>
        <div className="bg-gray-50 p-4 rounded-xl mb-4">
          <img src={qrCodeUrl} alt="QR Code" className="mx-auto" />
        </div>
        <p className="text-xs text-gray-500 mb-4">
          作品ID: {artwork.id.slice(0, 8)}...
        </p>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
        >
          閉じる
        </button>
      </div>
    </div>
  )
}

// Load and render individual artwork image with logo
const ArtworkImage: React.FC<{ url: string }> = ({ url }) => {
  const [originalImage] = useImage(url, 'anonymous')
  const [logoImage] = useImage('/images/logo.png', 'anonymous')
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [compositeImage, setCompositeImage] = useState<HTMLImageElement | null>(
    null
  )

  // Create composite image with logo when both images are loaded
  useEffect(() => {
    if (!originalImage || !logoImage) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = originalImage.width
    canvas.height = originalImage.height

    // Draw original image
    ctx.drawImage(originalImage, 0, 0)

    // Calculate logo size (30% of image width)
    const logoDisplayWidth = canvas.width * 0.3
    const logoAspectRatio = logoImage.height / logoImage.width
    const logoDisplayHeight = logoDisplayWidth * logoAspectRatio

    // Position: bottom-right corner (no shadow, perfect fit)
    const logoX = canvas.width - logoDisplayWidth
    const logoY = canvas.height - logoDisplayHeight

    // Set logo opacity
    ctx.save()
    ctx.globalAlpha = 0.85

    // Draw logo
    ctx.drawImage(logoImage, logoX, logoY, logoDisplayWidth, logoDisplayHeight)

    ctx.restore()

    // Convert to image
    const img = document.createElement('img')
    img.onload = () => setCompositeImage(img)
    img.src = canvas.toDataURL('image/png', 0.95)
  }, [originalImage, logoImage])

  // Use composite image if available, otherwise fallback to original
  const imageToDisplay = compositeImage || originalImage

  return imageToDisplay ? (
    <Image
      image={imageToDisplay}
      width={180}
      height={200}
      x={10}
      y={10}
      perfectDrawEnabled={false}
    />
  ) : null
}

// Modal version of artwork image with logo
const ArtworkImageModal: React.FC<{
  url: string
  alt: string
  artwork?: any // Pass full artwork object to check for compositeImageUrl
}> = ({ url, alt, artwork }) => {
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(
    null
  )
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null)
  const [compositeImageUrl, setCompositeImageUrl] = useState<string | null>(
    null
  )

  useEffect(() => {
    // Check if artwork has compositeImageUrl (poetry + logo already embedded)
    // Support both direct compositeImageUrl and nested metadata structure
    const compositeUrl =
      artwork?.compositeImageUrl ||
      artwork?.composite_image_url ||
      artwork?.metadata?.compositeImageUrl

    console.log('🎨 Gallery artwork data:', {
      hasCompositeImageUrl: !!artwork?.compositeImageUrl,
      hasCompositeImageUrlSnake: !!artwork?.composite_image_url,
      hasPoetry: !!artwork?.poetry,
      compositeUrlLength: compositeUrl ? compositeUrl.length : 0,
      isDataUrl: compositeUrl?.startsWith('data:image/') || false,
    })

    if (compositeUrl && compositeUrl.startsWith('data:image/')) {
      console.log('✅ Using pre-composed artwork with poetry and logo')
      setCompositeImageUrl(compositeUrl)
      return
    }

    // Check if poetry data exists for full composition
    const poetryData = artwork?.poetry?.poem || artwork?.poetry

    if (poetryData && typeof poetryData === 'string') {
      console.log(
        '🎭 Creating full composition with poetry and logo for gallery'
      )

      // Use ArtworkComposer for full poetry + logo composition
      ArtworkComposer.composeArtwork({
        imageUrl: url,
        poetry: poetryData,
        logoUrl: '/images/logo.png',
        sessionId: artwork?.session_id || 'gallery',
      })
        .then((compositeResult) => {
          if (compositeResult.compositeImageUrl.startsWith('data:image/')) {
            console.log('✅ Full composition created for gallery display')
            setCompositeImageUrl(compositeResult.compositeImageUrl)
          } else {
            throw new Error('Composition failed, falling back to logo-only')
          }
        })
        .catch((error) => {
          console.warn('⚠️ Full composition failed, using logo-only:', error)
          createLogoOnlyComposite()
        })
    } else {
      console.log('🔄 Creating logo-only composite for gallery display')
      createLogoOnlyComposite()
    }

    // Logo-only composition function
    function createLogoOnlyComposite() {
      // Load original image
      const loadOriginal = new Promise<HTMLImageElement>((resolve, reject) => {
        const img = document.createElement('img')
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = url
      })

      // Load logo image
      const loadLogo = new Promise<HTMLImageElement>((resolve, reject) => {
        const img = document.createElement('img')
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = '/images/logo.png'
      })

      Promise.all([loadOriginal, loadLogo])
        .then(([original, logo]) => {
          setOriginalImage(original)
          setLogoImage(logo)

          // Create composite image (logo only)
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          if (!ctx) return

          canvas.width = original.width
          canvas.height = original.height

          // Draw original image
          ctx.drawImage(original, 0, 0)

          // Calculate logo size (30% of image width)
          const logoDisplayWidth = canvas.width * 0.3
          const logoAspectRatio = logo.height / logo.width
          const logoDisplayHeight = logoDisplayWidth * logoAspectRatio

          // Position: bottom-right corner (no shadow, perfect fit)
          const logoX = canvas.width - logoDisplayWidth
          const logoY = canvas.height - logoDisplayHeight

          // Set logo opacity
          ctx.save()
          ctx.globalAlpha = 0.85

          // Draw logo
          ctx.drawImage(logo, logoX, logoY, logoDisplayWidth, logoDisplayHeight)
          ctx.restore()

          // Set composite image URL
          setCompositeImageUrl(canvas.toDataURL('image/png', 0.95))
        })
        .catch((error) => {
          console.error('Failed to load images for modal:', error)
          // Fallback to original image URL
          setCompositeImageUrl(url)
        })
    }
  }, [url, artwork])

  return (
    <img
      src={compositeImageUrl || url}
      alt={alt}
      className="w-full h-auto rounded-t-2xl"
    />
  )
}

const ArtworkNode: React.FC<ArtworkNodeProps> = ({
  artwork,
  layout,
  isHovered,
  onHover,
  onClick,
  onDragEnd,
  onQRClick,
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
        height={240}
        fill="white"
        cornerRadius={8}
        stroke={isDragging ? '#fbbf24' : undefined}
        strokeWidth={isDragging ? 3 : 0}
      />

      {/* Paper texture effect */}
      <Rect
        width={200}
        height={240}
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
            y={220}
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
      <Group x={10} y={215}>
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

      {/* QR Code Button */}
      <Group
        x={170}
        y={5}
        onClick={(e) => {
          e.cancelBubble = true
          onQRClick(artwork)
        }}
        onMouseEnter={() => {
          document.body.style.cursor = 'pointer'
        }}
        onMouseLeave={() => {
          document.body.style.cursor = 'default'
        }}
      >
        {/* QR Code background */}
        <Circle
          radius={12}
          fill="rgba(255, 255, 255, 0.95)"
          stroke="#e5e7eb"
          strokeWidth={1}
        />

        {/* QR Code icon (simplified) */}
        <Rect x={-6} y={-6} width={3} height={3} fill="#374151" />
        <Rect x={-6} y={-1} width={3} height={3} fill="#374151" />
        <Rect x={-6} y={4} width={3} height={3} fill="#374151" />
        <Rect x={-1} y={-6} width={3} height={3} fill="#374151" />
        <Rect x={-1} y={4} width={3} height={3} fill="#374151" />
        <Rect x={4} y={-6} width={3} height={3} fill="#374151" />
        <Rect x={4} y={-1} width={3} height={3} fill="#374151" />
        <Rect x={4} y={4} width={3} height={3} fill="#374151" />
      </Group>
    </Group>
  )
}

export const TalkArtGalleryCanvas: React.FC<TalkArtGalleryCanvasProps> = ({
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
  const [realtimeEnabled, setRealtimeEnabled] = useState(true)
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 })
  const [qrModalArtwork, setQrModalArtwork] = useState<TalkArtArtwork | null>(
    null
  )

  const containerRef = useRef<HTMLDivElement>(null)
  const layoutEngineRef = useRef<GalleryLayoutEngine | null>(null)

  // Calculate layouts for artworks
  const calculateLayouts = useCallback(
    (artworkList: TalkArtArtwork[]) => {
      if (!layoutEngineRef.current) return

      layoutEngineRef.current.reset()
      const newLayouts = new Map<string, LayoutPosition>()

      artworkList.forEach((artwork, index) => {
        const position = layoutEngineRef.current!.generatePosition(
          index,
          artwork.id
        )
        newLayouts.set(artwork.id, position)
      })

      // Calculate required canvas height based on content
      if (artworkList.length > 0) {
        const cellWidth = 200 * 1.5
        const cellHeight = 240 * 1.6 // Updated for portrait format
        const colsPerRow = Math.floor((stageSize.width - 100) / cellWidth)
        const rows = Math.ceil(artworkList.length / colsPerRow)
        const requiredHeight = Math.max(
          stageSize.height,
          rows * cellHeight + 100
        )

        setStageSize((prev) => ({ ...prev, height: requiredHeight }))
      }

      setLayouts(newLayouts)
    },
    [stageSize.width]
  )

  // Load gallery data
  const loadGallery = useCallback(async () => {
    console.log('Loading gallery data...')
    const allArtworks = await supabaseArtStorage.getRecentArtworks(50)
    console.log('Fetched artworks from Supabase:', allArtworks.length, 'items')
    console.log(
      'Artwork IDs:',
      allArtworks.map((a) => a.id)
    )

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

    // Sort by creation date (newest first for grid layout)
    filtered = filtered.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    console.log('Setting artworks state with', filtered.length, 'items')
    setArtworks(filtered)
    calculateLayouts(filtered)
  }, [filter, calculateLayouts])

  // Handle artwork deletion
  const handleDelete = useCallback(
    async (artwork: TalkArtArtwork) => {
      if (confirm('このアートワークを削除しますか？')) {
        try {
          // Use the storage service to delete both database record and image file
          const success = await supabaseArtStorage.deleteArtwork(artwork.id)

          if (!success) {
            alert('削除に失敗しました')
            return
          }

          // Update local state immediately for better UX
          setArtworks((prev) => prev.filter((art) => art.id !== artwork.id))
          setLayouts((prev) => {
            const newLayouts = new Map(prev)
            newLayouts.delete(artwork.id)
            return newLayouts
          })
          setSelectedArtwork(null)

          // Play sound effect (ignore error if sound file is missing)
          try {
            talkArtSoundEffects.playTapeRip()
          } catch (soundError) {
            console.log('Sound effect not available')
          }

          // Reload gallery data from Supabase to ensure consistency
          console.log('Reloading gallery after deletion...')
          await loadGallery()
        } catch (error) {
          console.error('Failed to delete artwork:', error)
          alert('削除に失敗しました')
        }
      }
    },
    [loadGallery]
  )

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
            240 // Updated height for portrait format
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

  // Setup realtime connection (stable connection without infinite reconnects)
  useEffect(() => {
    if (!realtimeEnabled) {
      console.log('🔴 Realtime disabled')
      return
    }

    console.log('🟢 Setting up stable realtime connection...')

    // Force disconnect any existing connection first
    realtimeGalleryService.disconnect()

    // Small delay then connect
    setTimeout(() => {
      realtimeGalleryService.connect()
      console.log('🔗 Connection initiated')

      // Test direct SSE connection
      setTimeout(() => {
        console.log('🧪 Testing direct SSE connection...')
        const testEventSource = new EventSource('/api/talkart/stream')
        testEventSource.onopen = () => {
          console.log('✅ Direct SSE test connection opened')
          setTimeout(() => {
            testEventSource.close()
            console.log('🔒 Direct SSE test connection closed')
          }, 2000)
        }
        testEventSource.onerror = (error) => {
          console.error('❌ Direct SSE test connection failed:', error)
          testEventSource.close()
        }
        testEventSource.onmessage = (event) => {
          console.log('📨 Direct SSE test message:', event.data)
        }
      }, 500)
    }, 100)

    const unsubscribe = realtimeGalleryService.subscribe(
      (event: RealtimeEvent) => {
        console.log('🎉 Realtime event received in gallery:', event)
        if (event.type === 'new_artwork') {
          console.log('📥 New artwork event - reloading gallery')
          // Use the current loadGallery function
          loadGallery()
          try {
            talkArtSoundEffects.playCorkPop()
          } catch (e) {
            console.log('🔇 Sound effect failed:', e)
          }
        } else if (event.type === 'connected') {
          console.log('🔗 Connected to realtime service')
        } else if (event.type === 'ping') {
          console.log('💓 Keepalive ping')
        } else {
          console.log('📋 Other event type:', event.type)
        }
      }
    )

    // Check connection status after connection is established
    const statusCheck = setTimeout(() => {
      console.log('🌐 Connection status check:', {
        connected: realtimeGalleryService.isConnected(),
        enabled: realtimeEnabled,
      })

      // If still not connected after 2 seconds, there might be an issue
      if (!realtimeGalleryService.isConnected()) {
        console.warn('⚠️ Connection not established after 2 seconds')
      }
    }, 2000)

    return () => {
      console.log('🔌 Cleaning up realtime connection')
      clearTimeout(statusCheck)
      unsubscribe()
      realtimeGalleryService.disconnect()
    }
  }, [realtimeEnabled]) // Remove loadGallery from dependencies to prevent reconnections

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
    <div
      className="fixed inset-0 z-50 overflow-hidden animate-fadeIn"
      style={{
        backgroundImage: 'url(/images/CorkBoard.jpg)',
        backgroundRepeat: 'repeat',
        backgroundSize: 'auto',
        border: '12px solid #8B4513',
        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3)',
      }}
    >
      {/* Header - Cork Board Frame */}
      <div
        className="relative p-6 border-b-8 shadow-2xl"
        style={{
          background:
            'linear-gradient(135deg, #8B4513 0%, #A0522D 50%, #8B4513 100%)',
          borderColor: '#654321',
          boxShadow:
            'inset 0 4px 8px rgba(0,0,0,0.3), 0 8px 16px rgba(0,0,0,0.4)',
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h2
            className="text-4xl font-bold drop-shadow-lg"
            style={{
              color: '#FAEBD7',
              textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
              fontFamily: 'serif',
            }}
          >
            🎋 夏祭りの思い出掲示板 🎋
          </h2>
          <button
            onClick={onClose}
            className="transition-colors rounded-full p-2"
            style={{
              color: '#FAEBD7',
              backgroundColor: 'rgba(0,0,0,0.3)',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.3)'
            }}
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
                className="px-4 py-2 rounded-full font-medium transition-all transform hover:scale-105"
                style={
                  filter === filterType
                    ? {
                        backgroundColor: '#D2691E',
                        color: '#FAEBD7',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                      }
                    : {
                        backgroundColor: 'rgba(250, 235, 215, 0.8)',
                        color: '#8B4513',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      }
                }
              >
                {filterType === 'all' && `すべて (${stats.total})`}
                {filterType === 'today' && `今日 (${stats.today})`}
              </button>
            ))}
          </div>

          {/* Realtime Toggle */}
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full"
            style={{
              backgroundColor: 'rgba(250, 235, 215, 0.8)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={realtimeEnabled}
                onChange={(e) => {
                  setRealtimeEnabled(e.target.checked)
                  if (e.target.checked) {
                    realtimeGalleryService.connect()
                  } else {
                    realtimeGalleryService.disconnect()
                  }
                }}
                className="w-4 h-4 text-yellow-400 rounded focus:ring-yellow-500"
              />
              <span className="font-medium" style={{ color: '#8B4513' }}>
                リアルタイム更新
              </span>
            </label>
            {realtimeEnabled && (
              <span
                className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                title="接続中"
              />
            )}
          </div>
        </div>
      </div>

      {/* Canvas container */}
      <div
        ref={containerRef}
        className="relative h-[calc(100vh-120px)] overflow-auto"
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
                    onQRClick={(art) => setQrModalArtwork(art)}
                  />
                )
              })}
            </Layer>
          </Stage>
        )}
      </div>

      {/* Individual Artwork QR Code Modal */}
      {qrModalArtwork && (
        <QRCodeModal
          artwork={qrModalArtwork}
          onClose={() => setQrModalArtwork(null)}
        />
      )}

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
              <ArtworkImageModal
                url={selectedArtwork.image_url}
                alt={selectedArtwork.prompt}
                artwork={selectedArtwork}
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

              <div className="space-y-4 text-gray-700">
                {/* Poetry Display (AI Exhibition Feature) */}
                {selectedArtwork.poetry && (
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-3">
                      <svg
                        className="w-5 h-5 text-purple-600"
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
                      <p className="text-sm font-semibold text-purple-800">
                        AI詩人が紡いだ思い出
                      </p>
                      <span className="text-xs text-white bg-blue-500 px-2 py-1 rounded-full">
                        GPT-4
                      </span>
                    </div>
                    <div className="text-gray-800 whitespace-pre-line leading-relaxed text-center font-serif">
                      {selectedArtwork.poetry.poem}
                    </div>
                    {selectedArtwork.poetry.metadata && (
                      <div className="mt-3 text-xs text-purple-600">
                        生成時間:{' '}
                        {selectedArtwork.poetry.metadata.generationTime}ms
                      </div>
                    )}
                  </div>
                )}

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

                {/* Question system indicator */}
                {selectedArtwork.metadata?.questionMode && (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-500">質問システム:</p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        selectedArtwork.metadata.questionMode === 'multilayer'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {selectedArtwork.metadata.questionMode === 'multilayer'
                        ? '🎯 多層システム'
                        : '📝 クラシック'}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <p className="text-sm text-gray-500">閲覧数:</p>
                  <p className="text-base font-medium">
                    {selectedArtwork.view_count || 0}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleDelete(selectedArtwork)}
                  className="bg-red-500 text-white py-2 px-4 rounded-full hover:bg-red-600 transition-colors flex items-center gap-2"
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  削除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
