import { create } from 'zustand'
import { SystemConfig, AnimationConfig, AudioConfig } from '@/features/talkart/types'

interface ConfigStore {
  config: SystemConfig
  updateConfig: (updates: Partial<SystemConfig>) => void
  updateAnimationConfig: (updates: Partial<AnimationConfig>) => void
  updateAudioConfig: (updates: Partial<AudioConfig>) => void
  resetToDefaults: () => void
}

const defaultConfig: SystemConfig = {
  // パフォーマンス設定
  targetFPS: 60,
  enableGPUAcceleration: true,
  
  // 体験設定
  conversationTimeLimit: 45, // 45秒
  generationTimeLimit: 10,   // 10秒
  
  // アニメーション設定
  animation: {
    fadeTransitionDuration: 300, // 0.3秒
    buttonHoverScale: 1.05,
    enableParticleEffects: true,
    enableCharacterAnimations: true
  },
  
  // 音響設定
  audio: {
    completionSoundEnabled: true,
    backgroundMusicEnabled: true,
    volumeLevels: {
      bgm: 0.3,
      se: 0.7,
      voice: 0.8
    }
  },
  
  // デバッグ設定
  debugMode: false,
  showFPS: false,
  showTimeRemaining: false
}

export const useConfigStore = create<ConfigStore>((set, get) => ({
  config: defaultConfig,

  updateConfig: (updates: Partial<SystemConfig>) => {
    const { config } = get()
    set({
      config: {
        ...config,
        ...updates
      }
    })
  },

  updateAnimationConfig: (updates: Partial<AnimationConfig>) => {
    const { config } = get()
    set({
      config: {
        ...config,
        animation: {
          ...config.animation,
          ...updates
        }
      }
    })
  },

  updateAudioConfig: (updates: Partial<AudioConfig>) => {
    const { config } = get()
    set({
      config: {
        ...config,
        audio: {
          ...config.audio,
          ...updates
        }
      }
    })
  },

  resetToDefaults: () => {
    set({
      config: defaultConfig
    })
  }
}))