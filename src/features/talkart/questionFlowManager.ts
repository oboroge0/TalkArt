// TalkArt Question Flow Manager
import { useState, useCallback, useEffect, useRef } from 'react'

export interface Question {
  id: string
  text: string
  options: string[]
  characterMotion?: string
  backgroundEffect?: string
}

export interface ConversationResponse {
  question: string
  selectedAnswer: string
  timestamp: number
  questionId: string
}

export interface QuestionFlowConfig {
  questions: Question[]
  maxDuration: number // milliseconds
  timeoutBehavior: 'skip' | 'proceed' | 'extend'
}

export const useQuestionFlow = (config: QuestionFlowConfig) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<ConversationResponse[]>([])
  const [isFlowActive, setIsFlowActive] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(config.maxDuration)

  const flowStartTime = useRef<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Start the question flow
  const startFlow = useCallback(() => {
    setCurrentQuestionIndex(0)
    setResponses([])
    setIsFlowActive(true)
    setTimeRemaining(config.maxDuration)
    flowStartTime.current = Date.now()
  }, [config.maxDuration])

  // Stop the flow
  const stopFlow = useCallback(() => {
    setIsFlowActive(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Handle answer selection
  const selectAnswer = useCallback(
    (answer: string) => {
      if (!isFlowActive) return

      const currentQuestion = config.questions[currentQuestionIndex]
      const response: ConversationResponse = {
        question: currentQuestion.text,
        selectedAnswer: answer,
        timestamp: Date.now(),
        questionId: currentQuestion.id,
      }

      const newResponses = [...responses, response]
      setResponses(newResponses)

      // Move to next question or complete flow
      if (currentQuestionIndex < config.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
      } else {
        stopFlow()
        return newResponses
      }

      return null
    },
    [currentQuestionIndex, responses, isFlowActive, config.questions, stopFlow]
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
          switch (config.timeoutBehavior) {
            case 'skip':
              // Skip to next question with default answer
              selectAnswer(config.questions[currentQuestionIndex].options[0])
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
        }
      }, 100) // Update every 100ms

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
      }
    }
  }, [isFlowActive, config, currentQuestionIndex, selectAnswer, stopFlow])

  // Get current question
  const currentQuestion =
    isFlowActive && currentQuestionIndex < config.questions.length
      ? config.questions[currentQuestionIndex]
      : null

  // Progress calculation
  const progress = {
    questionNumber: currentQuestionIndex + 1,
    totalQuestions: config.questions.length,
    percentage: ((currentQuestionIndex + 1) / config.questions.length) * 100,
    timeElapsed: flowStartTime.current ? Date.now() - flowStartTime.current : 0,
    timeRemaining,
  }

  return {
    currentQuestion,
    responses,
    isFlowActive,
    progress,
    startFlow,
    stopFlow,
    selectAnswer,
  }
}
