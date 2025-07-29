// Gallery share page
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function GallerySharePage() {
  const router = useRouter()
  const { id } = router.query

  useEffect(() => {
    // Redirect to the API share page
    if (id) {
      window.location.href = `/api/talkart/share/${id}`
    }
  }, [id])

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-purple-800 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p>読み込み中...</p>
      </div>
    </div>
  )
}
