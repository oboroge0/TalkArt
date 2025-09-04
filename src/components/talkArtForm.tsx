import { useState, useEffect, useCallback } from 'react'
import settingsStore from '@/features/stores/settings'
import homeStore from '@/features/stores/home'
import { IconButton } from './iconButton'
import { generateMessageId } from '@/utils/messageUtils'
import { useQuestionFlow } from '@/features/talkart/questionFlowManager'
import { TalkArtQuestionDisplay } from './talkArtQuestionDisplay'
import { TalkArtParticles } from './talkArtParticles'
import { ArtGenerator, GeneratedArtwork } from '@/features/talkart/artGenerator'
import { supabaseArtStorage } from '@/features/talkart/supabaseArtStorage'
import { TalkArtArtwork } from '@/lib/supabase'
import { TalkArtResult } from './talkArtResult'
import { talkArtAudioManager } from '@/features/talkart/audioManager'
import { talkArtSessionManager } from '@/features/talkart/sessionManager'
import { TalkArtSessionStats } from './talkArtSessionStats'
import { TalkArtMovieSequence } from './TalkArtMovieSequence'
import { useRouter } from 'next/router'

// Import TalkArt configuration
const talkartConfig = require('../../talkart.config.js')

// Initialize services
const artGenerator = new ArtGenerator()

type ExperiencePhase = 'start' | 'questions' | 'generation' | 'result'

export const TalkArtForm = () => {
  const router = useRouter()
  const [currentPhase, setCurrentPhase] = useState<ExperiencePhase>('start')
  const [generatedArtwork, setGeneratedArtwork] =
    useState<GeneratedArtwork | null>(null)
  const [savedArtworkInfo, setSavedArtworkInfo] = useState<{
    id: string
    shareCode: string
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showParticles, setShowParticles] = useState(false)
  const [showSessionStats, setShowSessionStats] = useState(false)
  const [galleryStats, setGalleryStats] = useState({ total: 0, today: 0 })
  const [isGenerationComplete, setIsGenerationComplete] = useState(false)

  // Use question flow manager with multilayer support
  const questionFlow = useQuestionFlow({
    // Classic questions (fallback)
    questions: talkartConfig.questions.map((q: any, index: number) => ({
      id: q.id || `q${index}`,
      text: q.text,
      options: q.options,
    })),
    // New multilayer questions
    multilayerQuestions: talkartConfig.multilayerQuestions || [],
    // Configuration
    questionMode: talkartConfig.questionSystem?.mode || 'classic',
    fallbackToClassic: talkartConfig.questionSystem?.fallbackToClassic ?? true,
    maxDuration: 45000, // 45 seconds as per requirements
    timeoutBehavior: 'proceed',
  })

  // Load gallery stats on mount
  useEffect(() => {
    const loadStats = async () => {
      const stats = await supabaseArtStorage.getGalleryStats()
      setGalleryStats(stats)
    }
    loadStats()
  }, [currentPhase]) // Update when phase changes (after new artwork)

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (currentPhase === 'questions' && questionFlow.currentQuestion) {
        const key = e.key
        if (key >= '1' && key <= '3') {
          const optionIndex = parseInt(key) - 1
          const currentQuestion = questionFlow.currentQuestion

          // Check if this is a multilayer question
          const isMultilayerQuestion =
            'axis' in currentQuestion &&
            'options' in currentQuestion &&
            Array.isArray(currentQuestion.options) &&
            currentQuestion.options.length > 0 &&
            typeof currentQuestion.options[0] === 'object'

          if (
            isMultilayerQuestion &&
            optionIndex < currentQuestion.options.length
          ) {
            // Multilayer question - pass both label and value
            const option = (currentQuestion as any).options[optionIndex]
            handleAnswerSelection(option.label, option.value)
          } else if (
            !isMultilayerQuestion &&
            optionIndex < (currentQuestion as any).options.length
          ) {
            // Classic question - pass just the option string
            handleAnswerSelection((currentQuestion as any).options[optionIndex])
          }
        }
      }
    }

    window.addEventListener('keypress', handleKeyPress)
    return () => window.removeEventListener('keypress', handleKeyPress)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPhase, questionFlow.currentQuestion])

  // Monitor flow completion with comprehensive error handling
  useEffect(() => {
    try {
      // Check if flow has timed out or completed
      if (
        !questionFlow.isFlowActive &&
        currentPhase === 'questions' &&
        questionFlow.responses.length > 0
      ) {
        console.log('🕐 Question flow timed out, proceeding to generation')

        // Validate responses before proceeding
        if (
          !Array.isArray(questionFlow.responses) ||
          questionFlow.responses.length === 0
        ) {
          console.error('❌ Invalid responses array during timeout handling')

          homeStore.setState({
            chatLog: [
              ...homeStore.getState().chatLog,
              {
                role: 'assistant' as const,
                content:
                  'タイムアウト処理中にエラーが発生しました。最初からやり直してください。',
                timestamp: new Date().toLocaleString('ja-JP'),
                id: generateMessageId(),
              },
            ],
          })

          setTimeout(() => resetExperience(), 3000)
          return
        }

        // Check session status with error handling
        try {
          const currentSession = talkArtSessionManager.getCurrentSession()
          if (currentSession && currentSession.status === 'active') {
            console.log(
              '✅ Valid session found, proceeding to timeout generation'
            )
            setCurrentPhase('generation')
            generateArtworkAfterTimeout(questionFlow.responses)
          } else {
            console.warn(
              '⚠️ No active session found during timeout, starting new generation anyway'
            )
            setCurrentPhase('generation')
            generateArtworkAfterTimeout(questionFlow.responses)
          }
        } catch (sessionError) {
          console.error(
            '❌ Session error during timeout handling:',
            sessionError
          )

          // Continue with generation anyway as fallback
          console.log('🔄 Continuing with generation despite session error')
          setCurrentPhase('generation')
          generateArtworkAfterTimeout(questionFlow.responses)
        }
      }

      // Monitor for unexpected flow states
      if (
        currentPhase === 'questions' &&
        !questionFlow.isFlowActive &&
        questionFlow.responses.length === 0
      ) {
        console.warn(
          '⚠️ Question flow inactive with no responses - possible error state'
        )

        // Give it a moment to recover, then reset if still problematic
        setTimeout(() => {
          if (
            currentPhase === 'questions' &&
            !questionFlow.isFlowActive &&
            questionFlow.responses.length === 0
          ) {
            console.error('❌ Question flow stuck in error state, resetting')

            homeStore.setState({
              chatLog: [
                ...homeStore.getState().chatLog,
                {
                  role: 'assistant' as const,
                  content: '質問システムでエラーが発生しました。再開します。',
                  timestamp: new Date().toLocaleString('ja-JP'),
                  id: generateMessageId(),
                },
              ],
            })

            setTimeout(() => resetExperience(), 2000)
          }
        }, 5000)
      }
    } catch (error) {
      console.error('❌ Critical error in flow completion monitoring:', error)

      // Fallback to reset
      homeStore.setState({
        chatLog: [
          ...homeStore.getState().chatLog,
          {
            role: 'assistant' as const,
            content:
              'システムエラーが発生しました。アプリケーションを再開します。',
            timestamp: new Date().toLocaleString('ja-JP'),
            id: generateMessageId(),
          },
        ],
      })

      setTimeout(() => resetExperience(), 3000)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Handle answer selection with comprehensive error handling
  const handleAnswerSelection = useCallback(
    (answer: string, optionValue?: string) => {
      try {
        // Validate current question exists
        if (!questionFlow.currentQuestion) {
          console.error('❌ No current question available for answer selection')
          return
        }

        // Validate answer parameter
        if (!answer || typeof answer !== 'string' || answer.trim() === '') {
          console.error('❌ Invalid answer provided:', answer)
          return
        }

        console.log('📝 Processing answer selection:', {
          questionId: questionFlow.currentQuestion.id,
          answer,
          optionValue,
          questionMode: questionFlow.activeQuestionMode,
        })

        // Record response in session with validation
        try {
          talkArtSessionManager.addResponse(
            questionFlow.currentQuestion.id,
            optionValue || answer
          )
        } catch (sessionError) {
          console.warn('⚠️ Session manager error (non-critical):', sessionError)
        }

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
            content: answer, // Display the label (human-readable text)
            timestamp: new Date().toLocaleString('ja-JP'),
            id: generateMessageId(),
          },
        ]

        // Update chat log with error boundary
        try {
          homeStore.setState({
            chatLog: [...homeStore.getState().chatLog, ...newMessages],
          })
        } catch (storeError) {
          console.error('❌ Error updating chat log:', storeError)
          // Continue anyway - chat display is not critical for functionality
        }

        // Pass both parameters to questionFlow with error handling
        let completedResponses = null
        try {
          completedResponses = questionFlow.selectAnswer(answer, optionValue)
        } catch (flowError) {
          console.error('❌ Question flow error:', flowError)

          // Show error message and reset
          homeStore.setState({
            chatLog: [
              ...homeStore.getState().chatLog,
              {
                role: 'assistant' as const,
                content:
                  '質問の処理中にエラーが発生しました。最初からやり直してください。',
                timestamp: new Date().toLocaleString('ja-JP'),
                id: generateMessageId(),
              },
            ],
          })

          setTimeout(() => resetExperience(), 3000)
          return
        }

        // If all questions completed, proceed to generation
        if (completedResponses) {
          console.log('✅ All questions completed, proceeding to generation')

          // Validate responses before proceeding
          if (!completedResponses || completedResponses.length === 0) {
            console.error('❌ No completed responses available')

            homeStore.setState({
              chatLog: [
                ...homeStore.getState().chatLog,
                {
                  role: 'assistant' as const,
                  content:
                    '回答の記録に問題が発生しました。もう一度お試しください。',
                  timestamp: new Date().toLocaleString('ja-JP'),
                  id: generateMessageId(),
                },
              ],
            })

            setTimeout(() => resetExperience(), 3000)
            return
          }

          // Proceed to generation phase
          setCurrentPhase('generation')
          generateArtwork(completedResponses)
        }
      } catch (error) {
        console.error('❌ Critical error in handleAnswerSelection:', error)

        // Show user-friendly error message
        homeStore.setState({
          chatLog: [
            ...homeStore.getState().chatLog,
            {
              role: 'assistant' as const,
              content:
                '予期しないエラーが発生しました。アプリケーションを再開します。',
              timestamp: new Date().toLocaleString('ja-JP'),
              id: generateMessageId(),
            },
          ],
        })

        // End session with error
        talkArtSessionManager.endSession(
          'error',
          error instanceof Error
            ? error.message
            : 'Critical answer selection error'
        )

        // Reset after delay
        setTimeout(() => resetExperience(), 3000)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [questionFlow]
  )

  // Generate artwork after timeout with error handling
  const generateArtworkAfterTimeout = async (allResponses: any[]) => {
    try {
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
    } catch (error) {
      console.error('❌ Error in generateArtworkAfterTimeout:', error)

      // Add error message to chat
      homeStore.setState({
        chatLog: [
          ...homeStore.getState().chatLog,
          {
            role: 'assistant' as const,
            content:
              'タイムアウト後のアート生成でエラーが発生しました。もう一度お試しください。',
            timestamp: new Date().toLocaleString('ja-JP'),
            id: generateMessageId(),
          },
        ],
      })

      // End session with error and return to start
      talkArtSessionManager.endSession(
        'error',
        error instanceof Error ? error.message : 'Timeout generation failed'
      )
      setTimeout(() => resetExperience(), 3000)
    }
  }

  // Generate artwork
  const generateArtwork = async (
    allResponses: any[],
    isTimeout: boolean = false
  ) => {
    setIsLoading(true)
    setIsGenerationComplete(false)
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
      // Validate responses before processing
      if (!allResponses || allResponses.length === 0) {
        throw new Error('No responses provided for artwork generation')
      }

      // Generate artwork using AI service with timeout
      console.log(
        '🎨 Starting artwork generation with responses:',
        allResponses.length
      )
      const artworkPromise = artGenerator.generateArtwork(
        allResponses,
        sessionId
      )

      // Add timeout to artwork generation (60 seconds to accommodate Canvas composition)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('Artwork generation timed out')),
          60000
        )
      )

      const artwork = (await Promise.race([
        artworkPromise,
        timeoutPromise,
      ])) as any

      if (!artwork || !artwork.imageUrl) {
        throw new Error('Invalid artwork generated - missing image URL')
      }

      console.log('✅ Artwork generated successfully:', {
        hasImage: !!artwork.imageUrl,
        hasPoetry: !!artwork.poetry,
        questionMode: artwork.metadata?.questionMode,
      })

      // Save to Supabase (single attempt - don't block UI)
      console.log('💾 Attempting to save artwork to Supabase')
      let savedArtwork = null

      try {
        savedArtwork = await supabaseArtStorage.saveArtwork(artwork)
        if (savedArtwork) {
          console.log(
            '✅ Artwork saved to Supabase successfully:',
            savedArtwork.id
          )
        }
      } catch (saveError) {
        console.warn('⚠️ Save to Supabase failed (non-blocking):', saveError)
        // Continue anyway - artwork can still be displayed
      }

      // Continue even if save fails (artwork can still be shown)
      if (savedArtwork) {
        // Update session with artwork ID
        talkArtSessionManager.setGeneratedArtworkId(savedArtwork.id)

        // Store saved artwork info
        setSavedArtworkInfo({
          id: savedArtwork.id,
          shareCode: savedArtwork.share_code || savedArtwork.id,
        })

        // Notify realtime service (non-blocking)
        try {
          const { realtimeGalleryService } = await import(
            '@/features/talkart/realtimeService'
          )
          realtimeGalleryService.notifyNewArtwork({
            ...artwork,
            id: savedArtwork.id,
            shareCode: savedArtwork.share_code || savedArtwork.id,
          })
        } catch (realtimeError) {
          console.warn(
            '⚠️ Realtime notification failed (non-critical):',
            realtimeError
          )
        }
      } else {
        console.warn(
          '⚠️ Artwork could not be saved to database, but continuing with display'
        )
      }

      // Set artwork first
      setGeneratedArtwork(artwork)
      setIsLoading(false)
      setIsGenerationComplete(true)
      setShowParticles(true)

      // Small delay to ensure artwork state is set before changing phase
      setTimeout(() => {
        setCurrentPhase('result')
      }, 100)

      // Play completion sound (non-blocking)
      try {
        await talkArtAudioManager.playCompletionSound()
      } catch (audioError) {
        console.warn('⚠️ Audio playback failed (non-critical):', audioError)
      }

      // Add completion message with context
      const completionMessage = artwork.poetry
        ? '完成しました！AIが描いたアートと詩をお楽しみください。'
        : '完成しました！素敵な夏祭りの思い出アートができました。'

      homeStore.setState({
        chatLog: [
          ...homeStore.getState().chatLog,
          {
            role: 'assistant' as const,
            content: completionMessage,
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
      console.error('❌ Art generation failed:', error)
      setIsLoading(false)
      setIsGenerationComplete(true)

      // Determine error type and message
      let errorMessage =
        'アート生成中にエラーが発生しました。もう一度お試しください。'
      let errorType = 'generation_error'

      if (error instanceof Error) {
        if (error.message.includes('timed out')) {
          errorMessage =
            'アート生成がタイムアウトしました。ネットワーク接続を確認してもう一度お試しください。'
          errorType = 'timeout_error'
        } else if (error.message.includes('Invalid artwork')) {
          errorMessage =
            'アートの生成に失敗しました。しばらく待ってからもう一度お試しください。'
          errorType = 'invalid_artwork_error'
        } else if (error.message.includes('No responses')) {
          errorMessage =
            '質問の回答が見つかりません。最初からやり直してください。'
          errorType = 'no_responses_error'
        }
      }

      // End session with specific error information
      talkArtSessionManager.endSession(
        'error',
        `${errorType}: ${error instanceof Error ? error.message : 'Unknown error'}`
      )

      // Show user-friendly error message
      homeStore.setState({
        chatLog: [
          ...homeStore.getState().chatLog,
          {
            role: 'assistant' as const,
            content: errorMessage,
            timestamp: new Date().toLocaleString('ja-JP'),
            id: generateMessageId(),
          },
        ],
      })

      // Return to start after delay
      setTimeout(() => {
        resetExperience()
      }, 4000)
    }
  }

  // Reset experience with comprehensive error handling
  const resetExperience = () => {
    try {
      console.log('🔄 Starting experience reset')

      // Reset session manager with error handling
      try {
        talkArtSessionManager.reset()
      } catch (sessionError) {
        console.warn(
          '⚠️ Session manager reset error (non-critical):',
          sessionError
        )
      }

      // Reset component state with individual error boundaries
      try {
        setCurrentPhase('start')
      } catch (phaseError) {
        console.error('❌ Error setting phase to start:', phaseError)
      }

      try {
        questionFlow.stopFlow()
      } catch (flowError) {
        console.warn('⚠️ Question flow stop error (non-critical):', flowError)
      }

      try {
        setGeneratedArtwork(null)
        setSavedArtworkInfo(null)
      } catch (artworkError) {
        console.warn(
          '⚠️ Error resetting artwork state (non-critical):',
          artworkError
        )
      }

      try {
        setIsLoading(false)
        setShowParticles(false)
        setIsGenerationComplete(false)
      } catch (uiError) {
        console.warn('⚠️ Error resetting UI state (non-critical):', uiError)
      }

      // Reset chat log with error handling
      try {
        homeStore.setState({ chatLog: [] })
      } catch (storeError) {
        console.warn('⚠️ Error clearing chat log (non-critical):', storeError)
        // Try to at least add a reset message
        try {
          homeStore.setState({
            chatLog: [
              {
                role: 'assistant' as const,
                content: 'システムをリセットしました。',
                timestamp: new Date().toLocaleString('ja-JP'),
                id: generateMessageId(),
              },
            ],
          })
        } catch (fallbackError) {
          console.error('❌ Fallback chat message also failed:', fallbackError)
        }
      }

      console.log('✅ Experience reset completed')
    } catch (error) {
      console.error('❌ Critical error during reset:', error)

      // Force reload as last resort
      setTimeout(() => {
        console.warn('🔄 Forcing page reload due to reset failure')
        window.location.reload()
      }, 1000)
    }
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
              <>
                {/* Movie Sequence */}
                <TalkArtMovieSequence
                  isGenerating={true}
                  isGenerationComplete={isGenerationComplete}
                  onSequenceComplete={() => {
                    console.log('🎬 Movie sequence completed')
                  }}
                />

                {/* Generation UI */}
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
              </>
            )

          case 'result':
            return generatedArtwork ? (
              <TalkArtResult
                artwork={generatedArtwork}
                savedInfo={savedArtworkInfo}
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
