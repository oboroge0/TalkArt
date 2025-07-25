export class TalkArtAudioManager {
  private audioContext: AudioContext | null = null
  private sounds: Map<string, AudioBuffer> = new Map()
  private isInitialized = false
  private masterVolume = 0.7
  private soundVolumes = {
    completion: 0.8,
    click: 0.5,
    notification: 0.6,
    background: 0.3,
  }

  // 音響システムを初期化
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // ユーザー操作後にAudioContextを作成
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)()

      // 必要に応じてサスペンド状態を解除
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      // 基本的な音響ファイルをプリロード
      await this.preloadSounds()

      this.isInitialized = true
      console.log('TalkArt Audio Manager initialized')
    } catch (error) {
      console.warn('Failed to initialize audio manager:', error)
    }
  }

  // 音響ファイルをプリロード
  private async preloadSounds(): Promise<void> {
    const soundFiles = [
      { name: 'completion', url: '/talkart/sounds/completion.mp3' },
      { name: 'click', url: '/talkart/sounds/click.mp3' },
      { name: 'notification', url: '/talkart/sounds/notification.mp3' },
    ]

    const loadPromises = soundFiles.map(async (sound) => {
      try {
        const buffer = await this.loadSound(sound.url)
        this.sounds.set(sound.name, buffer)
      } catch (error) {
        console.warn(`Failed to load sound: ${sound.name}`, error)
        // フォールバック音を生成
        this.sounds.set(sound.name, this.generateFallbackSound(sound.name))
      }
    })

    await Promise.allSettled(loadPromises)
  }

  // 音響ファイルを読み込み
  private async loadSound(url: string): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized')
    }

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch sound: ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    return await this.audioContext.decodeAudioData(arrayBuffer)
  }

  // フォールバック音を生成（Web Audio APIで合成）
  private generateFallbackSound(type: string): AudioBuffer {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized')
    }

    const duration = 0.5
    const sampleRate = this.audioContext.sampleRate
    const buffer = this.audioContext.createBuffer(
      1,
      duration * sampleRate,
      sampleRate
    )
    const data = buffer.getChannelData(0)

    switch (type) {
      case 'completion':
        // 上昇するハーモニー音
        for (let i = 0; i < data.length; i++) {
          const t = i / sampleRate
          const frequency = 440 + t * 220 // 440Hz から 660Hz に上昇
          data[i] =
            Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 2) * 0.3
        }
        break

      case 'click':
        // 短いクリック音
        for (let i = 0; i < data.length * 0.1; i++) {
          const t = i / sampleRate
          data[i] = Math.sin(2 * Math.PI * 800 * t) * Math.exp(-t * 20) * 0.2
        }
        break

      case 'notification':
        // 2音の通知音
        for (let i = 0; i < data.length; i++) {
          const t = i / sampleRate
          const freq1 = t < 0.15 ? 523 : 659 // C5 → E5
          data[i] = Math.sin(2 * Math.PI * freq1 * t) * Math.exp(-t * 3) * 0.25
        }
        break

      default:
        // デフォルトのビープ音
        for (let i = 0; i < data.length * 0.2; i++) {
          const t = i / sampleRate
          data[i] = Math.sin(2 * Math.PI * 440 * t) * Math.exp(-t * 5) * 0.2
        }
    }

    return buffer
  }

  // 音を再生
  async playSound(soundName: string, volume?: number): Promise<void> {
    if (!this.isInitialized || !this.audioContext) {
      console.warn('Audio manager not initialized')
      return
    }

    const buffer = this.sounds.get(soundName)
    if (!buffer) {
      console.warn(`Sound not found: ${soundName}`)
      return
    }

    try {
      const source = this.audioContext.createBufferSource()
      const gainNode = this.audioContext.createGain()

      source.buffer = buffer
      source.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      // ボリューム設定
      const soundVolume =
        volume ??
        this.soundVolumes[soundName as keyof typeof this.soundVolumes] ??
        0.5
      gainNode.gain.value = soundVolume * this.masterVolume

      source.start()
    } catch (error) {
      console.warn(`Failed to play sound: ${soundName}`, error)
    }
  }

  // 完了音を再生
  async playCompletionSound(): Promise<void> {
    await this.playSound('completion')
  }

  // クリック音を再生
  async playClickSound(): Promise<void> {
    await this.playSound('click')
  }

  // 通知音を再生
  async playNotificationSound(): Promise<void> {
    await this.playSound('notification')
  }

  // マスターボリュームを設定
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume))
  }

  // 個別音のボリュームを設定
  setSoundVolume(soundName: string, volume: number): void {
    if (soundName in this.soundVolumes) {
      this.soundVolumes[soundName as keyof typeof this.soundVolumes] = Math.max(
        0,
        Math.min(1, volume)
      )
    }
  }

  // ボリューム設定を取得
  getVolumeSettings() {
    return {
      master: this.masterVolume,
      sounds: { ...this.soundVolumes },
    }
  }

  // 音響システムを停止
  destroy(): void {
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    this.sounds.clear()
    this.isInitialized = false
  }

  // ユーザー操作による初期化（初回クリック時など）
  async initializeOnUserGesture(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    // Safariなどで必要な場合がある
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }
  }

  // 音響が利用可能かチェック
  isAudioAvailable(): boolean {
    return this.isInitialized && this.audioContext !== null
  }
}

// シングルトンインスタンス
export const audioManager = new TalkArtAudioManager()
