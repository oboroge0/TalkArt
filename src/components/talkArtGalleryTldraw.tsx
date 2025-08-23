import React, { useCallback, useEffect, useState } from 'react'
import {
  Tldraw,
  createShapeId,
  Editor,
  TLShapePartial,
  TLImageShape,
  useEditor,
  TLUiOverrides,
  DefaultToolbar,
  DefaultToolbarContent,
} from 'tldraw'
import 'tldraw/tldraw.css'
import { TalkArtArtwork } from '@/lib/supabase'
import { supabaseArtStorage } from '@/features/talkart/supabaseArtStorage'
import { supabaseRealtimeGalleryService } from '@/features/talkart/supabaseRealtimeService'
import { talkArtSoundEffects } from '@/features/talkart/soundEffects'
import { SupabaseRealtimeEvent } from '@/features/talkart/supabaseRealtimeService'

interface TalkArtGalleryTldrawProps {
  onClose: () => void
  onSelectArtwork?: (artwork: TalkArtArtwork) => void
  shouldRefresh?: boolean
  onRefreshComplete?: () => void
}

// Custom toolbar that includes only the tools we want
// Note: Temporarily using default toolbar due to API changes in tldraw v3
const CustomToolbarContent = DefaultToolbarContent

// Custom UI overrides to simplify the interface
const uiOverrides: TLUiOverrides = {
  tools(editor, tools) {
    // Remove tools we don't need
    delete tools['arrow']
    delete tools['line']
    delete tools['frame']
    delete tools['geo']
    delete tools['highlight']
    delete tools['laser']
    return tools
  },
}

export const TalkArtGalleryTldraw: React.FC<TalkArtGalleryTldrawProps> = ({
  onClose,
  onSelectArtwork,
  shouldRefresh = false,
  onRefreshComplete,
}) => {
  const [editor, setEditor] = useState<Editor | null>(null)
  const [artworks, setArtworks] = useState<TalkArtArtwork[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'today'>('all')
  const [stats, setStats] = useState({ total: 0, today: 0 })

  // Load artworks from storage
  const loadArtworks = useCallback(async () => {
    setIsLoading(true)
    try {
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

      // Add artworks to the canvas
      if (editor && filtered.length > 0) {
        await addArtworksToCanvas(editor, filtered)
      }
    } catch (error) {
      console.error('Failed to load artworks:', error)
    } finally {
      setIsLoading(false)
    }
  }, [editor, filter])

  // Add artworks to the tldraw canvas
  const addArtworksToCanvas = async (
    editor: Editor,
    artworks: TalkArtArtwork[]
  ) => {
    editor.batch(() => {
      // Clear existing shapes first
      const allShapes = editor.getCurrentPageShapes()
      const artworkShapes = allShapes.filter(
        (shape) =>
          shape.type === 'image' &&
          (shape as TLImageShape).props.url?.includes('talkart')
      )
      if (artworkShapes.length > 0) {
        editor.deleteShapes(artworkShapes.map((s) => s.id))
      }

      // Calculate grid layout
      const padding = 50
      const imageSize = 200
      const spacing = 250
      const cols = Math.floor(
        (editor.getViewportScreenBounds().width - padding * 2) / spacing
      )

      artworks.forEach((artwork, index) => {
        const row = Math.floor(index / cols)
        const col = index % cols
        const x = padding + col * spacing
        const y = padding + row * spacing

        // Random rotation for natural look
        const rotation = (Math.random() - 0.5) * 0.2

        // Create image shape for artwork
        const shapeId = createShapeId()
        const imageShape: TLShapePartial<TLImageShape> = {
          id: shapeId,
          type: 'image',
          x,
          y,
          rotation,
          props: {
            url: artwork.image_url,
            w: imageSize,
            h: imageSize,
            assetId: null,
            crop: null,
          },
          meta: {} as any,
        }

        editor.createShape(imageShape)

        // Add a small note with creation date
        const noteId = createShapeId()
        const dateText = new Date(artwork.created_at).toLocaleDateString(
          'ja-JP',
          {
            month: 'short',
            day: 'numeric',
          }
        )

        editor.createShape({
          id: noteId,
          type: 'note',
          x: x + imageSize - 60,
          y: y - 20,
          props: {
            text: dateText,
            color: 'yellow',
            size: 's',
          },
        })
      })

      // Zoom to fit all content
      editor.zoomToFit({ animation: { duration: 500 } })
    })
  }

  // Handle editor mount
  const handleMount = useCallback(
    (editor: Editor) => {
      setEditor(editor)

      // Set up custom event handlers
      // TODO: Fix event handler for tldraw v3
      // The pointer.up event has been removed/renamed in tldraw v3
      // This functionality allows selecting artworks by clicking on them
      // editor.on('pointer.up', () => {
      //   const selectedShapes = editor.getSelectedShapes()
      //   const imageShape = selectedShapes.find(
      //     (shape) => shape.type === 'image'
      //   )

      //   if (imageShape && imageShape.meta?.artworkData) {
      //     const artwork = imageShape.meta.artworkData as TalkArtArtwork
      //     if (onSelectArtwork) {
      //       onSelectArtwork(artwork)
      //     }
      //   }
      // })

      // Customize the background
      editor.updateInstanceState({
        isGridMode: false,
      })
    },
    [onSelectArtwork]
  )

  // Initial load
  useEffect(() => {
    if (editor) {
      loadArtworks()
    }
  }, [editor, loadArtworks])

  // Setup realtime updates
  useEffect(() => {
    supabaseRealtimeGalleryService.connect()

    const unsubscribe = supabaseRealtimeGalleryService.subscribe(
      (event: SupabaseRealtimeEvent) => {
        if (event.type === 'new_artwork') {
          loadArtworks()
          talkArtSoundEffects.playCorkPop()
        }
      }
    )

    return () => {
      unsubscribe()
      supabaseRealtimeGalleryService.disconnect()
    }
  }, [loadArtworks])

  // Handle refresh
  useEffect(() => {
    if (shouldRefresh && editor) {
      setTimeout(() => {
        loadArtworks()
        if (onRefreshComplete) {
          onRefreshComplete()
        }
      }, 100)
    }
  }, [shouldRefresh, editor, onRefreshComplete, loadArtworks])

  return (
    <div className="fixed inset-0 bg-amber-50 z-50 overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-sm border-b border-amber-200 flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-6">
          <h2 className="text-2xl font-bold text-amber-800">
            みんなの思い出ギャラリー
          </h2>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-amber-700">
            <span>全作品: {stats.total}点</span>
            <span className="text-amber-500">|</span>
            <span>本日: {stats.today}点</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Filter buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'all'
                  ? 'bg-amber-500 text-white'
                  : 'bg-white text-amber-700 hover:bg-amber-100'
              }`}
            >
              すべて
            </button>
            <button
              onClick={() => setFilter('today')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'today'
                  ? 'bg-amber-500 text-white'
                  : 'bg-white text-amber-700 hover:bg-amber-100'
              }`}
            >
              今日
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="text-amber-700 hover:text-amber-900 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
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
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-amber-700">ギャラリーを読み込み中...</p>
          </div>
        </div>
      )}

      {/* Tldraw canvas */}
      <div className="absolute inset-0 top-16">
        <Tldraw
          onMount={handleMount}
          overrides={uiOverrides}
          hideUi={false}
          components={{
            Toolbar: (props) => (
              <DefaultToolbar {...props}>
                <CustomToolbarContent />
              </DefaultToolbar>
            ),
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
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
              pointerEvents: 'none',
            }}
          />
        </Tldraw>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 text-sm text-amber-700 max-w-md">
        <p className="font-medium mb-1">💡 ヒント</p>
        <p>• アートワークをクリックして詳細を表示</p>
        <p>• ペンツールで自由にメモや装飾を追加</p>
        <p>• テキストツールでコメントを残す</p>
      </div>
    </div>
  )
}
