import React from 'react'
import { useTalkArtStore } from '@/stores/talkart/talkArtStore'
import { useSessionStore } from '@/stores/talkart/sessionStore'
import { FadeTransition, HoverEffect } from './TalkArtAnimations'
import { useTalkArtAudio } from '@/hooks/useTalkArtAudio'

export const TalkArtChoiceButtons: React.FC = () => {
  const { isActive, currentQuestion } = useTalkArtStore()
  const { flowState, addConversationResponse } = useSessionStore()
  const { playClickSound } = useTalkArtAudio()

  if (!isActive || flowState.currentPhase !== 'QUESTIONS' || !currentQuestion) {
    return null
  }

  const handleChoice = async (choiceIndex: number) => {
    await playClickSound()

    const response = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      choices: currentQuestion.choices,
      selectedChoice: choiceIndex,
      selectedAnswer: currentQuestion.choices[choiceIndex],
      timestamp: Date.now(),
      stepNumber: currentQuestion.stepNumber,
    }

    addConversationResponse(response)
  }

  return (
    <div className="w-full max-w-2xl mx-auto mb-4">
      <FadeTransition show={true}>
        {/* 質問テキスト */}
        <div className="text-center mb-4">
          <p className="text-lg font-semibold text-white bg-black bg-opacity-50 rounded-lg px-4 py-2 inline-block">
            {currentQuestion.question}
          </p>
        </div>

        {/* 選択肢ボタン */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {currentQuestion.choices.map((choice: string, index: number) => (
            <HoverEffect key={index} scale={1.05}>
              <button
                onClick={() => handleChoice(index)}
                className="w-full bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 font-medium py-3 px-4 rounded-lg shadow-lg transition-all duration-300 text-sm sm:text-base"
              >
                {choice}
              </button>
            </HoverEffect>
          ))}
        </div>

        {/* タイマー表示 */}
        <div className="mt-4 text-center">
          <div className="w-full max-w-xs mx-auto bg-gray-300 rounded-full h-2">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </FadeTransition>
    </div>
  )
}
