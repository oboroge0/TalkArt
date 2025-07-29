// TalkArt Audio Manager
export class TalkArtAudioManager {
  private audioContext: AudioContext | null = null
  private completionSound: HTMLAudioElement | null = null
  private volumeLevel: number = 0.7
  private isMuted: boolean = false

  constructor() {
    // Initialize audio on user interaction
    if (typeof window !== 'undefined') {
      this.initializeAudio()
    }
  }

  private initializeAudio() {
    // Preload completion sound
    this.completionSound = new Audio('/sounds/completion.mp3')
    this.completionSound.volume = this.volumeLevel
    this.completionSound.preload = 'auto'

    // Initialize AudioContext on first user interaction
    const initContext = () => {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)()
        document.removeEventListener('click', initContext)
      }
    }
    document.addEventListener('click', initContext)
  }

  // Play completion sound
  public async playCompletionSound(): Promise<void> {
    if (this.isMuted || !this.completionSound) return

    try {
      // Reset to beginning
      this.completionSound.currentTime = 0
      this.completionSound.volume = this.volumeLevel

      // Play the sound
      await this.completionSound.play()
    } catch (error) {
      console.error('Failed to play completion sound:', error)
    }
  }

  // Set volume (0.0 to 1.0)
  public setVolume(level: number): void {
    this.volumeLevel = Math.max(0, Math.min(1, level))
    if (this.completionSound) {
      this.completionSound.volume = this.volumeLevel
    }
  }

  // Get current volume
  public getVolume(): number {
    return this.volumeLevel
  }

  // Toggle mute
  public toggleMute(): void {
    this.isMuted = !this.isMuted
  }

  // Set mute state
  public setMute(muted: boolean): void {
    this.isMuted = muted
  }

  // Check if muted
  public isMutedState(): boolean {
    return this.isMuted
  }

  // Preload audio files
  public async preloadAudio(): Promise<void> {
    if (!this.completionSound) return

    return new Promise((resolve, reject) => {
      if (this.completionSound!.readyState === 4) {
        resolve()
      } else {
        this.completionSound!.addEventListener(
          'canplaythrough',
          () => resolve(),
          { once: true }
        )
        this.completionSound!.addEventListener(
          'error',
          () => reject(new Error('Failed to load audio')),
          { once: true }
        )
      }
    })
  }

  // Clean up resources
  public dispose(): void {
    if (this.completionSound) {
      this.completionSound.pause()
      this.completionSound.src = ''
      this.completionSound = null
    }

    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }
}

// Singleton instance
export const talkArtAudioManager = new TalkArtAudioManager()
