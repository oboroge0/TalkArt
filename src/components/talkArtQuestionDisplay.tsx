import React from 'react'
import { Question } from '@/features/talkart/questionFlowManager'

interface TalkArtQuestionDisplayProps {
  question: Question
  onSelectAnswer: (answer: string) => void
  progress: {
    questionNumber: number
    totalQuestions: number
    percentage: number
    timeRemaining: number
  }
}

export const TalkArtQuestionDisplay: React.FC<TalkArtQuestionDisplayProps> = ({
  question,
  onSelectAnswer,
  progress,
}) => {
  // Format time remaining
  const formatTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000)
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`
  }

  return (
    <div className="w-full animate-fadeIn">
      {/* Progress and Timer */}
      <div className="mb-6">
        <div className="flex justify-between text-white text-sm mb-2">
          <span>
            質問 {progress.questionNumber} / {progress.totalQuestions}
          </span>
          <span className="flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {formatTime(progress.timeRemaining)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden relative">
          <div
            className="bg-gradient-to-r from-yellow-400 to-orange-400 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress.percentage}%` }}
          />
          <div className="absolute inset-0 progress-shimmer" />
        </div>

        {/* Time warning */}
        {progress.timeRemaining < 10000 && (
          <div className="mt-2 text-yellow-400 text-sm text-center animate-pulse">
            まもなく次の質問に進みます
          </div>
        )}
      </div>

      {/* Question */}
      <h3 className="text-white text-2xl font-bold mb-6 text-center leading-relaxed">
        {question.text}
      </h3>

      {/* Answer options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => onSelectAnswer(option)}
            className="group relative p-4 bg-white/10 backdrop-blur-sm rounded-xl text-white hover:bg-white/20 transition-all duration-200 transform hover:scale-105 hover:-translate-y-1"
            style={{
              animationDelay: `${index * 100}ms`,
              animation: 'fadeIn 0.5s ease-out forwards',
            }}
          >
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

            {/* Option number */}
            <div className="absolute top-2 left-2 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">
              {index + 1}
            </div>

            {/* Option text */}
            <span className="relative z-10 block pt-2">{option}</span>

            {/* Hover indicator */}
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <svg
                className="w-4 h-4 text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </button>
        ))}
      </div>

      {/* Keyboard hint */}
      <div className="mt-4 text-center text-white/50 text-xs">
        キーボードの 1, 2, 3 でも選択できます
      </div>
    </div>
  )
}
