import React, { useState, useEffect, useCallback } from 'react'
import { ConversationQuestion } from '@/features/talkart/types'
import { QuestionManager } from '@/features/talkart/conversation/questionManager'
import { useSessionStore } from '@/stores/talkart/sessionStore'
import { useConfigStore } from '@/stores/talkart/configStore'
import { ChoiceButton } from './TalkArtButton'

interface TalkArtFormProps {
  onComplete: (responses: any[]) => void
  onTimeout?: () => void
}

export const TalkArtForm: React.FC<TalkArtFormProps> = ({ onComplete, onTimeout }) => {
  const [questionManager] = useState(() => new QuestionManager())
  const [currentQuestion, setCurrentQuestion] = useState<ConversationQuestion | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [timeRemaining, setTimeRemaining] = useState<number>(45)
  const [questionTimeRemaining, setQuestionTimeRemaining] = useState<number>(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const { addConversationResponse, setTimeRemaining: setStoreTimeRemaining } = useSessionStore()
  const { config } = useConfigStore()

  // 質問を初期化
  useEffect(() => {
    const firstQuestion = questionManager.getCurrentQuestion()
    setCurrentQuestion(firstQuestion)
    if (firstQuestion && firstQuestion.timeLimit) {
      setQuestionTimeRemaining(firstQuestion.timeLimit)
    }
  }, [questionManager])

  // タイマー管理
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.ceil(questionManager.getRemainingTime() / 1000)
      const questionRemaining = Math.ceil(questionManager.getCurrentQuestionRemainingTime() / 1000)
      
      setTimeRemaining(remaining)
      setQuestionTimeRemaining(questionRemaining)
      setStoreTimeRemaining(remaining)

      // 全体タイムアウト
      if (remaining <= 0) {
        clearInterval(timer)
        handleTimeout()
        return
      }

      // 現在の質問タイムアウト
      if (questionRemaining <= 0 && currentQuestion) {
        handleQuestionTimeout()
      }
    }, 100)

    return () => clearInterval(timer)
  }, [currentQuestion, questionManager, setStoreTimeRemaining])

  // 回答選択
  const handleAnswerSelect = useCallback((answer: string) => {
    setSelectedAnswer(answer)
  }, [])

  // 次の質問へ進む
  const handleNext = useCallback(async () => {
    if (!selectedAnswer || !currentQuestion) return

    setIsTransitioning(true)

    // 回答を記録
    questionManager.addResponse(selectedAnswer)
    addConversationResponse({
      questionId: currentQuestion.id,
      question: currentQuestion.text,
      selectedAnswer,
      timestamp: Date.now(),
      stepNumber: currentQuestion.stepNumber
    })

    // 短い遅延後に次の質問へ
    setTimeout(() => {
      const nextQuestion = questionManager.nextQuestion()
      
      if (nextQuestion) {
        setCurrentQuestion(nextQuestion)
        setSelectedAnswer('')
        if (nextQuestion.timeLimit) {
          setQuestionTimeRemaining(nextQuestion.timeLimit)
        }
      } else {
        // すべての質問が完了
        const responses = questionManager.getResponses()
        onComplete(responses)
      }
      
      setIsTransitioning(false)
    }, config.animation.fadeTransitionDuration)
  }, [selectedAnswer, currentQuestion, questionManager, addConversationResponse, onComplete, config])

  // 質問タイムアウト処理
  const handleQuestionTimeout = useCallback(() => {
    if (config.debugMode) {
      console.log('Question timeout occurred')
    }
    
    questionManager.skipCurrentQuestion()
    const nextQuestion = questionManager.getCurrentQuestion()
    
    if (nextQuestion) {
      setCurrentQuestion(nextQuestion)
      setSelectedAnswer('')
      if (nextQuestion.timeLimit) {
        setQuestionTimeRemaining(nextQuestion.timeLimit)
      }
    } else {
      const responses = questionManager.getResponses()
      onComplete(responses)
    }
  }, [questionManager, onComplete, config])

  // 全体タイムアウト処理
  const handleTimeout = useCallback(() => {
    const responses = questionManager.getResponses()
    if (onTimeout) {
      onTimeout()
    } else {
      onComplete(responses)
    }
  }, [questionManager, onTimeout, onComplete])

  // 進捗情報
  const progress = questionManager.getProgress()

  if (!currentQuestion) {
    return (
      <div className="text-center text-white">
        <p>質問を読み込んでいます...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* 進捗バー */}
      <div className="mb-8">
        <div className="flex justify-between text-white text-sm mb-2">
          <span>質問 {progress.current} / {progress.total}</span>
          <span>残り時間: {timeRemaining}秒</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-orange-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        {questionTimeRemaining > 0 && (
          <div className="mt-2">
            <div className="text-xs text-gray-300 mb-1">
              この質問の残り時間: {questionTimeRemaining}秒
            </div>
            <div className="w-full bg-gray-600 rounded-full h-1">
              <div 
                className="bg-yellow-500 h-1 rounded-full transition-all duration-100"
                style={{ 
                  width: `${currentQuestion.timeLimit ? (questionTimeRemaining / currentQuestion.timeLimit) * 100 : 0}%` 
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 質問カード */}
      <div className={`bg-white/90 backdrop-blur-sm rounded-xl p-8 shadow-2xl transition-all duration-${config.animation.fadeTransitionDuration} ${
        isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
      }`}>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {currentQuestion.text}
        </h2>

        <div className="space-y-4">
          {currentQuestion.options.map((option, index) => (
            <ChoiceButton
              key={index}
              onClick={() => handleAnswerSelect(option)}
              selected={selectedAnswer === option}
              disabled={isTransitioning}
            >
              {option}
            </ChoiceButton>
          ))}
        </div>

        {/* 次へボタン */}
        <div className="mt-8 text-center">
          <button
            onClick={handleNext}
            disabled={!selectedAnswer || isTransitioning}
            className={`
              px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg
              transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
              hover:scale-105 active:scale-95
            `}
          >
            {progress.isComplete ? 'アートを生成する' : '次へ'}
          </button>
        </div>
      </div>

      {/* デバッグ情報 */}
      {config.debugMode && (
        <div className="mt-4 p-4 bg-black/50 rounded-lg text-white text-xs">
          <pre>{JSON.stringify(questionManager.getDebugInfo(), null, 2)}</pre>
        </div>
      )}
    </div>
  )
}