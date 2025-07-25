import React, { useState } from 'react'
import { TalkArtGallery } from './TalkArtGallery'
import { HoverEffect } from './TalkArtAnimations'

export const TalkArtGalleryButton: React.FC = () => {
  const [showGallery, setShowGallery] = useState(false)

  return (
    <>
      <HoverEffect scale={1.05}>
        <button
          onClick={() => setShowGallery(true)}
          className="w-full py-2 px-4 rounded-full bg-purple-500 hover:bg-purple-600 text-white font-medium transition-all duration-300"
        >
          🖼️ ギャラリーを見る
        </button>
      </HoverEffect>

      {/* ギャラリーモーダル */}
      {showGallery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-2xl font-bold">夏祭りの思い出ギャラリー</h2>
              <button
                onClick={() => setShowGallery(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div
              className="overflow-y-auto"
              style={{ maxHeight: 'calc(90vh - 80px)' }}
            >
              <TalkArtGallery />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
