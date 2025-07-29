import React, { useState, useEffect } from 'react'
import { TalkArtGalleryBoard } from '@/components/talkArtGalleryBoard'
import { TalkArtGalleryArrive } from '@/components/talkArtGalleryArrive'
import { useRouter } from 'next/router'
import { Meta } from '@/components/meta'
import { ArtStorage } from '@/features/talkart/artStorage'

const GalleryPage = () => {
  const router = useRouter()
  const [showArriveAnimation, setShowArriveAnimation] = useState(false)
  const [shouldRefresh, setShouldRefresh] = useState(false)

  useEffect(() => {
    // Check if coming from artwork result (via flying animation)
    const isFromResult = router.query.from === 'result'
    if (isFromResult) {
      setShowArriveAnimation(true)
      setShouldRefresh(true)
    }
  }, [router.query])

  const handleClose = () => {
    router.push('/')
  }

  return (
    <>
      <Meta />
      <TalkArtGalleryBoard
        shouldRefresh={shouldRefresh}
        onRefreshComplete={() => setShouldRefresh(false)}
        onClose={handleClose}
      />

      {showArriveAnimation && (
        <TalkArtGalleryArrive
          onComplete={() => setShowArriveAnimation(false)}
        />
      )}
    </>
  )
}

export default GalleryPage
