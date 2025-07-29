import React, { useState, useEffect } from 'react'
import { talkArtAudioManager } from '@/features/talkart/audioManager'

export const TalkArtAudioControl: React.FC = () => {
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(0.7)

  useEffect(() => {
    // Load saved preferences
    const savedMute = localStorage.getItem('talkart_audio_muted')
    const savedVolume = localStorage.getItem('talkart_audio_volume')

    if (savedMute !== null) {
      const muted = savedMute === 'true'
      setIsMuted(muted)
      talkArtAudioManager.setMute(muted)
    }

    if (savedVolume !== null) {
      const vol = parseFloat(savedVolume)
      setVolume(vol)
      talkArtAudioManager.setVolume(vol)
    }
  }, [])

  const toggleMute = () => {
    const newMuted = !isMuted
    setIsMuted(newMuted)
    talkArtAudioManager.setMute(newMuted)
    localStorage.setItem('talkart_audio_muted', String(newMuted))
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    talkArtAudioManager.setVolume(newVolume)
    localStorage.setItem('talkart_audio_volume', String(newVolume))
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-3 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMute}
          className="text-white hover:text-yellow-400 transition-colors"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
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
                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
              />
            </svg>
          ) : (
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
                d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
            </svg>
          )}
        </button>

        {!isMuted && (
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="w-24 h-2 bg-white/30 rounded-lg appearance-none cursor-pointer slider"
            aria-label="Volume"
          />
        )}
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: #fbbf24;
          cursor: pointer;
          border-radius: 50%;
        }

        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #fbbf24;
          cursor: pointer;
          border-radius: 50%;
          border: none;
        }
      `}</style>
    </div>
  )
}
