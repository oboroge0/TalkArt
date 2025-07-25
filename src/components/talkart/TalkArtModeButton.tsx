import React from 'react'
import { useTalkArtStore } from '@/stores/talkart/talkArtStore'
import { FadeTransition } from './TalkArtAnimations'

export const TalkArtModeButton: React.FC = () => {
  const { isActive, startTalkArt, resetTalkArt } = useTalkArtStore()

  const handleToggle = () => {
    if (isActive) {
      resetTalkArt()
    } else {
      startTalkArt()
    }
  }

  return (
    <FadeTransition show={true} className="mb-4">
      <button
        onClick={handleToggle}
        className={`w-full py-3 px-6 rounded-full font-bold transition-all duration-300 ${
          isActive
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white'
        }`}
      >
        {isActive ? '❌ TalkArtを終了' : '🎨 TalkArt体験を始める'}
      </button>
    </FadeTransition>
  )
}
