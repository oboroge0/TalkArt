import React from 'react'
import { TalkArtArtwork } from '@/lib/supabase'
import { TalkArtGalleryCanvas } from './talkArtGalleryCanvas'

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
  // Check if tldraw mode is enabled
  const useTldraw = process.env.NEXT_PUBLIC_USE_TLDRAW_GALLERY === 'true'

  if (useTldraw) {
    // Import dynamically to avoid loading tldraw when not needed
    const TalkArtGalleryTldraw = React.lazy(() =>
      import('./talkArtGalleryTldraw').then((module) => ({
        default: module.TalkArtGalleryTldraw,
      }))
    )

    return (
      <React.Suspense
        fallback={
          <div className="fixed inset-0 bg-amber-50 z-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
          </div>
        }
      >
        <TalkArtGalleryTldraw
          onClose={onClose}
          onSelectArtwork={onSelectArtwork}
          shouldRefresh={shouldRefresh}
          onRefreshComplete={onRefreshComplete}
        />
      </React.Suspense>
    )
  }

  // Default to Canvas mode
  return (
    <TalkArtGalleryCanvas
      onClose={onClose}
      onSelectArtwork={onSelectArtwork}
      shouldRefresh={shouldRefresh}
      onRefreshComplete={onRefreshComplete}
    />
  )
}
