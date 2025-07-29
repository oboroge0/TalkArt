import { useState, useEffect, useCallback } from 'react'
import settingsStore from '@/features/stores/settings'
import homeStore from '@/features/stores/home'
import { IconButton } from './iconButton'
import { generateMessageId } from '@/utils/messageUtils'
import { useQuestionFlow } from '@/features/talkart/questionFlowManager'
import { TalkArtQuestionDisplay } from './talkArtQuestionDisplay'
import { TalkArtParticles } from './talkArtParticles'
import { ArtGenerator, GeneratedArtwork } from '@/features/talkart/artGenerator'
import { ArtStorage } from '@/features/talkart/artStorage'
import { TalkArtResult } from './talkArtResult'
import { talkArtAudioManager } from '@/features/talkart/audioManager'
import { talkArtSessionManager } from '@/features/talkart/sessionManager'
import { TalkArtSessionStats } from './talkArtSessionStats'
import { useRouter } from 'next/router'

// Import TalkArt configuration
const talkartConfig = require('../../talkart.config.js')

// Initialize services
const artGenerator = new ArtGenerator()
const artStorage = new ArtStorage()

type ExperiencePhase = 'start' | 'questions' | 'generation' | 'result'

export const TalkArtForm = () => {
  const router = useRouter()
  const [currentPhase, setCurrentPhase] = useState<ExperiencePhase>('start')
  const [generatedArtwork, setGeneratedArtwork] =
    useState<GeneratedArtwork | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showParticles, setShowParticles] = useState(false)
  const [showSessionStats, setShowSessionStats] = useState(false)
  const [galleryStats, setGalleryStats] = useState({ total: 0, today: 0 })

  // Use question flow manager
  const questionFlow = useQuestionFlow({
    questions: talkartConfig.questions.map((q: any, index: number) => ({
      id: q.id || `q${index}`,
      text: q.text,
      options: q.options,
    })),
    maxDuration: 45000, // 45 seconds as per requirements
    timeoutBehavior: 'proceed',
  })

  // Load gallery stats on mount
  useEffect(() => {
    const stats = artStorage.getGalleryStats()
    setGalleryStats(stats)
  }, [currentPhase]) // Update when phase changes (after new artwork)

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (currentPhase === 'questions' && questionFlow.currentQuestion) {
        const key = e.key
        if (key >= '1' && key <= '3') {
          const optionIndex = parseInt(key) - 1
          if (optionIndex < questionFlow.currentQuestion.options.length) {
            handleAnswerSelection(
              questionFlow.currentQuestion.options[optionIndex]
            )
          }
        }
      }
    }

    window.addEventListener('keypress', handleKeyPress)
    return () => window.removeEventListener('keypress', handleKeyPress)
  }, [currentPhase, questionFlow.currentQuestion])

  // Monitor flow completion
  useEffect(() => {
    if (
      !questionFlow.isFlowActive &&
      currentPhase === 'questions' &&
      questionFlow.responses.length > 0
    ) {
      // Flow completed due to timeout
      console.log('Question flow timed out, proceeding to generation')

      // End session with timeout status but still generate artwork
      const currentSession = talkArtSessionManager.getCurrentSession()
      if (currentSession && currentSession.status === 'active') {
        // We'll update status after generation completes
        setCurrentPhase('generation')
        generateArtworkAfterTimeout(questionFlow.responses)
      }
    }
  }, [questionFlow.isFlowActive, currentPhase, questionFlow.responses])

  // Start experience
  const startExperience = () => {
    // Start a new session
    talkArtSessionManager.startSession()

    setCurrentPhase('questions')
    questionFlow.startFlow()
    // Clear any existing chat messages
    homeStore.setState({ chatLog: [] })

    // Add greeting message
    homeStore.setState({
      chatLog: [
        {
          role: 'assistant' as const,
          content: 'こんにちは！夏祭りの思い出を聞かせてください。',
          timestamp: new Date().toLocaleString('ja-JP'),
          id: generateMessageId(),
        },
      ],
    })
  }

  // Handle answer selection
  const handleAnswerSelection = useCallback(
    (answer: string) => {
      if (!questionFlow.currentQuestion) return

      // Record response in session
      talkArtSessionManager.addResponse(questionFlow.currentQuestion.id, answer)

      // Display question and answer in chat
      const newMessages = [
        {
          role: 'assistant' as const,
          content: questionFlow.currentQuestion.text,
          timestamp: new Date().toLocaleString('ja-JP'),
          id: generateMessageId(),
        },
        {
          role: 'user' as const,
          content: answer,
          timestamp: new Date().toLocaleString('ja-JP'),
          id: generateMessageId(),
        },
      ]

      homeStore.setState({
        chatLog: [...homeStore.getState().chatLog, ...newMessages],
      })

      const completedResponses = questionFlow.selectAnswer(answer)

      if (completedResponses) {
        // All questions answered, proceed to generation
        setCurrentPhase('generation')
        generateArtwork(completedResponses)
      }
    },
    [questionFlow]
  )

  // Generate artwork after timeout
  const generateArtworkAfterTimeout = async (allResponses: any[]) => {
    // Add timeout message before generation
    homeStore.setState({
      chatLog: [
        ...homeStore.getState().chatLog,
        {
          role: 'assistant' as const,
          content: '時間になりました。いただいた回答でアートを作成します！',
          timestamp: new Date().toLocaleString('ja-JP'),
          id: generateMessageId(),
        },
      ],
    })

    // Mark session as timeout but continue with generation
    await generateArtwork(allResponses, true)
  }

  // Generate artwork
  const generateArtwork = async (
    allResponses: any[],
    isTimeout: boolean = false
  ) => {
    setIsLoading(true)
    const currentSession = talkArtSessionManager.getCurrentSession()
    const sessionId = currentSession?.id || `session_${Date.now()}`

    // Add generation message
    homeStore.setState({
      chatLog: [
        ...homeStore.getState().chatLog,
        {
          role: 'assistant' as const,
          content: 'あなたの思い出をアートに描いています...',
          timestamp: new Date().toLocaleString('ja-JP'),
          id: generateMessageId(),
        },
      ],
    })

    try {
      // Generate artwork using AI service
      const artwork = await artGenerator.generateArtwork(
        allResponses,
        sessionId
      )

      // Save to gallery
      const savedArtwork = await artStorage.saveArtwork(artwork)

      // Update session with artwork ID
      talkArtSessionManager.setGeneratedArtworkId(savedArtwork.id)

      // Notify realtime service
      import('@/features/talkart/realtimeService').then(
        ({ realtimeGalleryService }) => {
          realtimeGalleryService.notifyNewArtwork(savedArtwork)
        }
      )

      // Set artwork first
      setGeneratedArtwork(artwork)
      setIsLoading(false)
      setShowParticles(true)

      // Small delay to ensure artwork state is set before changing phase
      setTimeout(() => {
        setCurrentPhase('result')
      }, 100)

      // Play completion sound
      await talkArtAudioManager.playCompletionSound()

      // Add completion message with prompt info
      homeStore.setState({
        chatLog: [
          ...homeStore.getState().chatLog,
          {
            role: 'assistant' as const,
            content: '完成しました！素敵な夏祭りの思い出アートができました。',
            timestamp: new Date().toLocaleString('ja-JP'),
            id: generateMessageId(),
          },
        ],
      })

      // End session successfully (or with timeout)
      talkArtSessionManager.endSession(isTimeout ? 'timeout' : 'completed')

      // Hide particles after animation
      setTimeout(() => setShowParticles(false), 4000)
    } catch (error) {
      console.error('Art generation failed:', error)
      setIsLoading(false)

      // End session with error
      talkArtSessionManager.endSession(
        'error',
        error instanceof Error ? error.message : 'Unknown error'
      )

      // Show error message
      homeStore.setState({
        chatLog: [
          ...homeStore.getState().chatLog,
          {
            role: 'assistant' as const,
            content:
              'アート生成中にエラーが発生しました。もう一度お試しください。',
            timestamp: new Date().toLocaleString('ja-JP'),
            id: generateMessageId(),
          },
        ],
      })

      // Return to start
      setTimeout(() => {
        resetExperience()
      }, 3000)
    }
  }

  // Reset experience
  const resetExperience = () => {
    // Reset session manager
    talkArtSessionManager.reset()

    setCurrentPhase('start')
    questionFlow.stopFlow()
    setGeneratedArtwork(null)
    homeStore.setState({ chatLog: [] })
  }

  // Render based on current phase
  return (
    <>
      <TalkArtParticles active={showParticles} />

      {/* Session Stats Modal */}
      {showSessionStats && (
        <TalkArtSessionStats onClose={() => setShowSessionStats(false)} />
      )}

      {(() => {
        switch (currentPhase) {
          case 'start':
            return (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent z-10">
                <div className="max-w-4xl mx-auto text-center text-white">
                  <h2 className="text-2xl font-bold mb-4 animate-slideInDown">
                    夏祭りの思い出をアートにしよう
                  </h2>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={startExperience}
                      className="px-8 py-3 bg-yellow-400 text-purple-900 rounded-full text-lg font-bold hover:scale-105 transition-transform animate-slideInUp animate-glow"
                    >
                      はじめる
                    </button>
                    <button
                      onClick={() => router.push('/gallery')}
                      className="px-8 py-3 bg-purple-700 text-white rounded-full text-lg font-bold hover:scale-105 transition-transform animate-slideInUp border-2 border-yellow-400/50"
                    >
                      ギャラリー
                    </button>
                  </div>
                  {galleryStats.total > 0 && (
                    <p className="mt-4 text-sm text-yellow-400/80 animate-fadeIn">
                      これまでに {galleryStats.total} 個のアートを作成しました
                      {galleryStats.today > 0 &&
                        ` (今日: ${galleryStats.today}個)`}
                    </p>
                  )}
                </div>

                {/* Admin/Debug Button - Small and discrete */}
                <button
                  onClick={() => setShowSessionStats(true)}
                  className="absolute bottom-4 right-4 p-2 bg-purple-800/50 text-white/50 rounded-full hover:bg-purple-700 hover:text-white transition-all"
                  title="セッション統計"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </button>
              </div>
            )

          case 'questions':
            return (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent z-10">
                <div className="max-w-4xl mx-auto">
                  {questionFlow.currentQuestion && (
                    <TalkArtQuestionDisplay
                      question={questionFlow.currentQuestion}
                      onSelectAnswer={handleAnswerSelection}
                      progress={questionFlow.progress}
                    />
                  )}
                </div>
              </div>
            )

          case 'generation':
            return (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent z-10">
                <div className="max-w-4xl mx-auto text-center text-white">
                  <div className="mb-4 animate-fadeIn">
                    <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                  <p className="text-lg animate-pulse">アートを生成中...</p>
                  <div className="mt-4 flex justify-center gap-2">
                    <span
                      className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    ></span>
                    <span
                      className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                      style={{ animationDelay: '200ms' }}
                    ></span>
                    <span
                      className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                      style={{ animationDelay: '400ms' }}
                    ></span>
                  </div>
                </div>
              </div>
            )

          case 'result':
            return generatedArtwork ? (
              <TalkArtResult
                artwork={generatedArtwork}
                onReset={resetExperience}
                onViewGallery={() => {
                  // Gallery handled by flying animation in TalkArtResult
                }}
              />
            ) : (
              // Keep showing generation screen if artwork is not ready yet
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent z-10">
                <div className="max-w-4xl mx-auto text-center text-white">
                  <div className="mb-4 animate-fadeIn">
                    <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                  <p className="text-lg animate-pulse">アートを準備中...</p>
                </div>
              </div>
            )

          default:
            return null
        }
      })()}
    </>
  )
}
