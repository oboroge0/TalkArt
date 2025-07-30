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
  // Always use Canvas mode
  return (
    <TalkArtGalleryCanvas
      onClose={onClose}
      onSelectArtwork={onSelectArtwork}
      shouldRefresh={shouldRefresh}
      onRefreshComplete={onRefreshComplete}
    />
  )
}
