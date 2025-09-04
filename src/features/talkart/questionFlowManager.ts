// TalkArt Question Flow Manager
import { useState, useCallback, useEffect, useRef } from 'react'

// Original question format (for backward compatibility)
export interface Question {
  id: string
  text: string
  options: string[]
  characterMotion?: string
  backgroundEffect?: string
}

// New multilayer question format
export interface MultilayerQuestion {
  id: string
  axis: 'composition' | 'elements' | 'objects' | 'mood'
  text: string
  options: Array<{
    value: string
    label: string
  }>
  characterMotion?: string
  backgroundEffect?: string
}

export interface ConversationResponse {
  question: string
  selectedAnswer: string
  timestamp: number
  questionId: string
  // New multilayer fields (optional for backward compatibility)
  axis?: 'composition' | 'elements' | 'objects' | 'mood'
  selectedValue?: string // The value part of multilayer option
  selectedLabel?: string // The label part of multilayer option
}

export interface QuestionFlowConfig {
  questions: Question[]
  maxDuration: number // milliseconds
  timeoutBehavior: 'skip' | 'proceed' | 'extend'
  // New multilayer system support
  multilayerQuestions?: MultilayerQuestion[]
  questionMode?: 'classic' | 'multilayer'
  fallbackToClassic?: boolean
}

export const useQuestionFlow = (config: QuestionFlowConfig) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<ConversationResponse[]>([])
  const [isFlowActive, setIsFlowActive] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(config.maxDuration)
  const [activeQuestionMode, setActiveQuestionMode] = useState<
    'classic' | 'multilayer'
  >('classic')
  const [multilayerFallbackTriggered, setMultilayerFallbackTriggered] =
    useState(false)

  const flowStartTime = useRef<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Determine which question system to use
  const determineQuestionMode = useCallback(() => {
    try {
      if (
        config.questionMode === 'multilayer' &&
        config.multilayerQuestions?.length
      ) {
        console.log('🎯 Using multilayer question system')
        setActiveQuestionMode('multilayer')
        return 'multilayer'
      } else if (config.fallbackToClassic && config.questions?.length) {
        console.log('🔄 Falling back to classic question system')
        setActiveQuestionMode('classic')
        return 'classic'
      } else {
        console.warn(
          '⚠️ No valid question system found, using classic as default'
        )
        setActiveQuestionMode('classic')
        return 'classic'
      }
    } catch (error) {
      console.error(
        '❌ Error determining question mode, falling back to classic:',
        error
      )
      setActiveQuestionMode('classic')
      setMultilayerFallbackTriggered(true)
      return 'classic'
    }
  }, [
    config.questionMode,
    config.multilayerQuestions,
    config.questions,
    config.fallbackToClassic,
  ])

  // Get current questions array based on active mode
  const getCurrentQuestions = useCallback(() => {
    return activeQuestionMode === 'multilayer' && config.multilayerQuestions
      ? config.multilayerQuestions
      : config.questions
  }, [activeQuestionMode, config.multilayerQuestions, config.questions])

  // Start the question flow
  const startFlow = useCallback(() => {
    try {
      // Determine question mode first
      determineQuestionMode()

      setCurrentQuestionIndex(0)
      setResponses([])
      setIsFlowActive(true)
      setTimeRemaining(config.maxDuration)
      flowStartTime.current = Date.now()

      console.log('🚀 Question flow started with mode:', activeQuestionMode)
    } catch (error) {
      console.error('❌ Error starting question flow:', error)
      // Fallback to classic mode
      setActiveQuestionMode('classic')
      setMultilayerFallbackTriggered(true)
      setCurrentQuestionIndex(0)
      setResponses([])
      setIsFlowActive(true)
      setTimeRemaining(config.maxDuration)
      flowStartTime.current = Date.now()
    }
  }, [config.maxDuration, determineQuestionMode, activeQuestionMode])

  // Stop the flow
  const stopFlow = useCallback(() => {
    setIsFlowActive(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Handle answer selection (supports both classic and multilayer)
  const selectAnswer = useCallback(
    (answer: string, optionValue?: string) => {
      if (!isFlowActive) return

      try {
        const currentQuestions = getCurrentQuestions()
        const currentQuestion = currentQuestions[currentQuestionIndex]

        if (!currentQuestion) {
          console.error('❌ Current question not found')
          return
        }

        // Create response based on question type
        const response: ConversationResponse = {
          question: currentQuestion.text,
          selectedAnswer: answer,
          timestamp: Date.now(),
          questionId: currentQuestion.id,
        }

        // Add multilayer-specific fields if applicable
        if (activeQuestionMode === 'multilayer' && 'axis' in currentQuestion) {
          const multilayerQ = currentQuestion as MultilayerQuestion
          response.axis = multilayerQ.axis
          response.selectedValue = optionValue || answer
          response.selectedLabel = answer
        }

        const newResponses = [...responses, response]
        setResponses(newResponses)

        console.log('📝 Answer selected:', {
          mode: activeQuestionMode,
          question: currentQuestion.id,
          answer,
          axis: response.axis,
        })

        // Move to next question or complete flow
        if (currentQuestionIndex < currentQuestions.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1)
        } else {
          stopFlow()
          return newResponses
        }

        return null
      } catch (error) {
        console.error('❌ Error in selectAnswer:', error)
        // Try to continue with whatever we have
        stopFlow()
        return responses
      }
    },
    [
      currentQuestionIndex,
      responses,
      isFlowActive,
      getCurrentQuestions,
      activeQuestionMode,
      stopFlow,
    ]
  )

  // Timer management
  useEffect(() => {
    if (isFlowActive && flowStartTime.current) {
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - flowStartTime.current!
        const remaining = Math.max(0, config.maxDuration - elapsed)
        setTimeRemaining(remaining)

        // Handle timeout
        if (remaining === 0) {
          try {
            const currentQuestions = getCurrentQuestions()
            const currentQuestion = currentQuestions[currentQuestionIndex]

            switch (config.timeoutBehavior) {
              case 'skip':
                if (currentQuestion) {
                  // Skip to next question with default answer
                  const defaultAnswer =
                    activeQuestionMode === 'multilayer' &&
                    'options' in currentQuestion
                      ? (currentQuestion as MultilayerQuestion).options[0].label
                      : (currentQuestion as Question).options[0]
                  selectAnswer(defaultAnswer)
                }
                break
              case 'proceed':
                // Stop flow and proceed with current responses
                stopFlow()
                break
              case 'extend':
                // Extend time by 50%
                flowStartTime.current = Date.now() - config.maxDuration * 0.5
                break
            }
          } catch (error) {
            console.error('❌ Error handling timeout:', error)
            stopFlow()
          }
        }
      }, 100) // Update every 100ms

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
      }
    }
  }, [isFlowActive, config, currentQuestionIndex, selectAnswer, stopFlow])

  // Get current question (safely handles both systems)
  const currentQuestion = (() => {
    try {
      if (!isFlowActive) return null

      const currentQuestions = getCurrentQuestions()
      return currentQuestionIndex < currentQuestions.length
        ? currentQuestions[currentQuestionIndex]
        : null
    } catch (error) {
      console.error('❌ Error getting current question:', error)
      return null
    }
  })()

  // Progress calculation (safely handles both systems)
  const progress = (() => {
    try {
      const currentQuestions = getCurrentQuestions()
      const totalQuestions = currentQuestions.length

      return {
        questionNumber: currentQuestionIndex + 1,
        totalQuestions,
        percentage:
          totalQuestions > 0
            ? ((currentQuestionIndex + 1) / totalQuestions) * 100
            : 0,
        timeElapsed: flowStartTime.current
          ? Date.now() - flowStartTime.current
          : 0,
        timeRemaining,
        questionMode: activeQuestionMode,
        fallbackTriggered: multilayerFallbackTriggered,
      }
    } catch (error) {
      console.error('❌ Error calculating progress:', error)
      return {
        questionNumber: 1,
        totalQuestions: 1,
        percentage: 0,
        timeElapsed: 0,
        timeRemaining,
        questionMode: 'classic' as const,
        fallbackTriggered: true,
      }
    }
  })()

  return {
    currentQuestion,
    responses,
    isFlowActive,
    progress,
    startFlow,
    stopFlow,
    selectAnswer,
    // New multilayer system properties
    activeQuestionMode,
    multilayerFallbackTriggered,
    getCurrentQuestions,
  }
}
