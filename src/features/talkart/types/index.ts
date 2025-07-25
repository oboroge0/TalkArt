// TalkArt体験のフェーズ定義
export type ExperiencePhase = 'START' | 'QUESTIONS' | 'GENERATION' | 'RESULT'

// セッションデータ
export interface SessionData {
  sessionId: string
  startTime: Date
  currentPhase: ExperiencePhase
  conversationResponses: ConversationResponse[]
  generatedArtwork?: GeneratedArtwork
  endTime?: Date
}

// 会話応答データ
export interface ConversationResponse {
  questionId: string
  question: string
  selectedAnswer: string
  timestamp: number
  stepNumber: number
}

// 質問フローデータ
export interface ConversationQuestion {
  id: string
  text: string
  options: string[]
  stepNumber: number
  timeLimit?: number
}

export interface ConversationFlow {
  questions: ConversationQuestion[]
  maxDuration: number
  timeoutBehavior: 'skip' | 'repeat' | 'end'
}

// アートワーク関連
export interface GeneratedArtwork {
  id: string
  imageUrl: string
  prompt: string
  metadata: ArtworkMetadata
  createdAt: Date
  sessionId: string
}

export interface ArtworkMetadata {
  generationTime: number
  artStyle: string
  themes: string[]
  dimensions: {
    width: number
    height: number
  }
}

// ギャラリー関連
export interface GalleryItem {
  id: string
  artwork: GeneratedArtwork
  position?: {
    x: number
    y: number
    rotation: number
    scale: number
  }
  displayOrder: number
}

export interface GalleryState {
  items: GalleryItem[]
  totalCount: number
  isLoading: boolean
  lastUpdated: Date
}

// 体験フロー制御
export interface ExperienceFlowState {
  currentPhase: ExperiencePhase
  isTransitioning: boolean
  timeRemaining?: number
  canProceed: boolean
  error?: string
}

// アニメーション設定
export interface AnimationConfig {
  fadeTransitionDuration: number
  buttonHoverScale: number
  enableParticleEffects: boolean
  enableCharacterAnimations: boolean
}

// 音響設定
export interface AudioConfig {
  completionSoundEnabled: boolean
  backgroundMusicEnabled: boolean
  volumeLevels: {
    bgm: number
    se: number
    voice: number
  }
}

// システム設定
export interface SystemConfig {
  // パフォーマンス設定
  targetFPS: number
  enableGPUAcceleration: boolean

  // 体験設定
  conversationTimeLimit: number
  generationTimeLimit: number

  // アニメーション設定
  animation: AnimationConfig

  // 音響設定
  audio: AudioConfig

  // デバッグ設定
  debugMode: boolean
  showFPS: boolean
  showTimeRemaining: boolean
}

// API レスポンス型
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: Date
}

export interface ArtGenerationRequest {
  conversationSummary: string
  style?: string
  dimensions?: {
    width: number
    height: number
  }
}

export interface ArtGenerationResponse {
  imageUrl: string
  prompt: string
  generationTime: number
  metadata: ArtworkMetadata
}

// エラー型
export interface TalkArtError {
  type: 'NETWORK_ERROR' | 'GENERATION_FAILED' | 'TIMEOUT' | 'VALIDATION_ERROR'
  message: string
  timestamp: Date
  context?: any
  recoverable: boolean
}

// イベント型
export interface TalkArtEvent {
  type: string
  data: any
  timestamp: Date
  sessionId: string
}

// QRコード共有
export interface ShareData {
  artworkId: string
  shareUrl: string
  qrCodeDataUrl: string
  expiresAt?: Date
}
