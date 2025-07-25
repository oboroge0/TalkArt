import { useEffect, useCallback } from 'react'
import { audioManager } from '@/features/talkart/audio/audioManager'
import { useConfigStore } from '@/stores/talkart/configStore'

export const useTalkArtAudio = () => {
  const { config } = useConfigStore()

  // 音響システム初期化
  useEffect(() => {
    const initializeAudio = async () => {
      if (config.audio.completionSoundEnabled) {
        // ユーザー操作を待ってから初期化
        const handleUserGesture = async () => {
          await audioManager.initializeOnUserGesture()
          document.removeEventListener('click', handleUserGesture)
          document.removeEventListener('touchstart', handleUserGesture)
        }

        document.addEventListener('click', handleUserGesture, { once: true })
        document.addEventListener('touchstart', handleUserGesture, {
          once: true,
        })
      }
    }

    initializeAudio()

    return () => {
      // クリーンアップは必要に応じて
    }
  }, [config.audio.completionSoundEnabled])

  // ボリューム設定の同期
  useEffect(() => {
    if (audioManager.isAudioAvailable()) {
      audioManager.setSoundVolume('completion', config.audio.volumeLevels.se)
      audioManager.setSoundVolume('click', config.audio.volumeLevels.se * 0.7)
      audioManager.setSoundVolume(
        'notification',
        config.audio.volumeLevels.se * 0.8
      )
    }
  }, [config.audio.volumeLevels.se])

  // 完了音を再生
  const playCompletionSound = useCallback(async () => {
    if (
      config.audio.completionSoundEnabled &&
      audioManager.isAudioAvailable()
    ) {
      await audioManager.playCompletionSound()
    }
  }, [config.audio.completionSoundEnabled])

  // クリック音を再生
  const playClickSound = useCallback(async () => {
    if (
      config.audio.completionSoundEnabled &&
      audioManager.isAudioAvailable()
    ) {
      await audioManager.playClickSound()
    }
  }, [config.audio.completionSoundEnabled])

  // 通知音を再生
  const playNotificationSound = useCallback(async () => {
    if (
      config.audio.completionSoundEnabled &&
      audioManager.isAudioAvailable()
    ) {
      await audioManager.playNotificationSound()
    }
  }, [config.audio.completionSoundEnabled])

  // カスタム音を再生
  const playSound = useCallback(
    async (soundName: string, volume?: number) => {
      if (
        config.audio.completionSoundEnabled &&
        audioManager.isAudioAvailable()
      ) {
        await audioManager.playSound(soundName, volume)
      }
    },
    [config.audio.completionSoundEnabled]
  )

  // ボリューム設定
  const setVolume = useCallback((soundName: string, volume: number) => {
    if (audioManager.isAudioAvailable()) {
      audioManager.setSoundVolume(soundName, volume)
    }
  }, [])

  // マスターボリューム設定
  const setMasterVolume = useCallback((volume: number) => {
    if (audioManager.isAudioAvailable()) {
      audioManager.setMasterVolume(volume)
    }
  }, [])

  return {
    // 再生関数
    playCompletionSound,
    playClickSound,
    playNotificationSound,
    playSound,

    // 設定関数
    setVolume,
    setMasterVolume,

    // 状態
    isAudioEnabled: config.audio.completionSoundEnabled,
    isAudioAvailable: audioManager.isAudioAvailable(),
    volumeSettings: audioManager.getVolumeSettings(),
  }
}
