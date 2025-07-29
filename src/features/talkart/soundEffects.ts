// TalkArt Sound Effects Manager
export class TalkArtSoundEffects {
  private sounds: Map<string, HTMLAudioElement> = new Map()
  private volumeLevel: number = 0.5
  private isMuted: boolean = false
  private initialized: boolean = false

  constructor() {
    // Initialize sound effects only on client side
    if (typeof window !== 'undefined') {
      this.initializeSounds()
    }
  }

  private initializeSounds() {
    if (this.initialized) return

    // Define sound effect paths
    const soundPaths = {
      paperRustle: '/sounds/paper-rustle.mp3',
      tapeRip: '/sounds/tape-rip.mp3',
      pinPush: '/sounds/pin-push.mp3',
      paperFlip: '/sounds/paper-flip.mp3',
      corkPop: '/sounds/cork-pop.mp3',
    }

    // Preload sounds only in browser environment
    if (typeof Audio !== 'undefined') {
      Object.entries(soundPaths).forEach(([key, path]) => {
        try {
          const audio = new Audio(path)
          audio.volume = this.volumeLevel
          audio.preload = 'auto'
          this.sounds.set(key, audio)
        } catch (error) {
          console.warn(`Failed to load sound effect: ${key}`, error)
        }
      })
      this.initialized = true
    }
  }

  // Play specific sound effect
  public async playSound(soundName: string): Promise<void> {
    if (this.isMuted) return

    // Ensure sounds are initialized
    if (!this.initialized && typeof window !== 'undefined') {
      this.initializeSounds()
    }

    const sound = this.sounds.get(soundName)
    if (!sound) {
      console.warn(`Sound effect '${soundName}' not found`)
      return
    }

    try {
      // Clone the audio to allow overlapping sounds
      const clonedSound = sound.cloneNode() as HTMLAudioElement
      clonedSound.volume = this.volumeLevel
      await clonedSound.play()
    } catch (error) {
      console.error(`Failed to play sound effect '${soundName}':`, error)
    }
  }

  // Convenience methods for specific sounds
  public async playPaperRustle(): Promise<void> {
    await this.playSound('paperRustle')
  }

  public async playTapeRip(): Promise<void> {
    await this.playSound('tapeRip')
  }

  public async playPinPush(): Promise<void> {
    await this.playSound('pinPush')
  }

  public async playPaperFlip(): Promise<void> {
    await this.playSound('paperFlip')
  }

  public async playCorkPop(): Promise<void> {
    await this.playSound('corkPop')
  }

  // Volume control
  public setVolume(volume: number): void {
    this.volumeLevel = Math.max(0, Math.min(1, volume))
    this.sounds.forEach((sound) => {
      sound.volume = this.volumeLevel
    })
  }

  // Mute control
  public setMute(muted: boolean): void {
    this.isMuted = muted
  }

  // Get current settings
  public getSettings() {
    return {
      volume: this.volumeLevel,
      muted: this.isMuted,
    }
  }
}

// Export singleton instance
export const talkArtSoundEffects = new TalkArtSoundEffects()
