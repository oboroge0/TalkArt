import { useState, useEffect } from 'react'
import { Meta } from '@/components/meta'
import '@/lib/i18n'

// TalkArt configuration
const talkartConfig = require('../../../talkart.config.js')

type ExperiencePhase =
  | 'start'
  | 'questions'
  | 'generation'
  | 'result'
  | 'gallery'

interface ConversationResponse {
  question: string
  selectedAnswer: string
  timestamp: number
}

const TalkArt = () => {
  const [currentPhase, setCurrentPhase] = useState<ExperiencePhase>('start')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<ConversationResponse[]>([])
  const [generatedArtwork, setGeneratedArtwork] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Start experience
  const startExperience = () => {
    setCurrentPhase('questions')
    setCurrentQuestionIndex(0)
    setResponses([])
  }

  // Handle answer selection
  const selectAnswer = (answer: string) => {
    const response: ConversationResponse = {
      question: talkartConfig.questions[currentQuestionIndex].text,
      selectedAnswer: answer,
      timestamp: Date.now(),
    }

    const newResponses = [...responses, response]
    setResponses(newResponses)

    if (currentQuestionIndex < talkartConfig.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      // All questions answered, proceed to generation
      setCurrentPhase('generation')
      generateArtwork(newResponses)
    }
  }

  // Generate artwork (placeholder)
  const generateArtwork = async (allResponses: ConversationResponse[]) => {
    setIsLoading(true)

    // Simulate art generation
    setTimeout(() => {
      setGeneratedArtwork('/images/placeholder-artwork.jpg')
      setIsLoading(false)
      setCurrentPhase('result')
    }, 3000)
  }

  // Reset experience
  const resetExperience = () => {
    setCurrentPhase('start')
    setCurrentQuestionIndex(0)
    setResponses([])
    setGeneratedArtwork(null)
  }

  // View gallery
  const viewGallery = () => {
    setCurrentPhase('gallery')
  }

  return (
    <div className="h-[100svh] bg-gradient-to-b from-indigo-900 to-purple-900 text-white">
      <Meta />

      {/* Start Screen */}
      {currentPhase === 'start' && (
        <div className="h-full flex flex-col items-center justify-center p-8 animate-fadeIn">
          <h1 className="text-5xl font-bold mb-8 text-center">
            夏祭りの思い出を
            <br />
            アートにしよう
          </h1>
          <p className="text-xl mb-12 text-center opacity-80">
            AIアーティストがあなたの思い出を
            <br />
            美しいアート作品に変えます
          </p>
          <button
            onClick={startExperience}
            className="px-12 py-4 bg-yellow-400 text-purple-900 rounded-full text-xl font-bold hover:scale-105 transition-transform"
          >
            はじめる
          </button>
        </div>
      )}

      {/* Questions Screen */}
      {currentPhase === 'questions' && (
        <div className="h-full flex flex-col items-center justify-center p-8 animate-fadeIn">
          <div className="max-w-2xl w-full">
            <div className="mb-8">
              <div className="flex justify-between mb-4">
                <span className="text-sm opacity-60">
                  質問 {currentQuestionIndex + 1} /{' '}
                  {talkartConfig.questions.length}
                </span>
                <span className="text-sm opacity-60">
                  {Math.floor(
                    (currentQuestionIndex / talkartConfig.questions.length) *
                      100
                  )}
                  %
                </span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentQuestionIndex + 1) / talkartConfig.questions.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            <h2 className="text-3xl font-bold mb-8 text-center">
              {talkartConfig.questions[currentQuestionIndex].text}
            </h2>

            <div className="space-y-4">
              {talkartConfig.questions[currentQuestionIndex].options.map(
                (option: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => selectAnswer(option)}
                    className="w-full p-4 bg-white/10 rounded-lg text-lg hover:bg-white/20 hover:scale-105 transition-all"
                  >
                    {option}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Generation Screen */}
      {currentPhase === 'generation' && (
        <div className="h-full flex flex-col items-center justify-center p-8 animate-fadeIn">
          <div className="text-center">
            <div className="mb-8">
              <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
            <h2 className="text-3xl font-bold mb-4">アートを生成中...</h2>
            <p className="text-lg opacity-80">あなたの思い出を描いています</p>
          </div>
        </div>
      )}

      {/* Result Screen */}
      {currentPhase === 'result' && generatedArtwork && (
        <div className="h-full flex flex-col items-center justify-center p-8 animate-fadeIn">
          <h2 className="text-4xl font-bold mb-8">完成！</h2>

          <div className="max-w-lg mb-8">
            <div className="bg-white p-2 rounded-lg shadow-2xl">
              <div className="aspect-square bg-gray-200 rounded">
                {/* Placeholder for generated artwork */}
                <div className="h-full flex items-center justify-center text-gray-500">
                  生成されたアートワーク
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mb-8">
            <p className="text-lg mb-4">QRコードで共有</p>
            <div className="w-32 h-32 bg-white mx-auto rounded">
              {/* QR Code placeholder */}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={resetExperience}
              className="px-8 py-3 bg-yellow-400 text-purple-900 rounded-full font-bold hover:scale-105 transition-transform"
            >
              もう一度
            </button>
            <button
              onClick={viewGallery}
              className="px-8 py-3 bg-white/20 rounded-full font-bold hover:bg-white/30 transition-colors"
            >
              ギャラリーを見る
            </button>
          </div>
        </div>
      )}

      {/* Gallery Screen */}
      {currentPhase === 'gallery' && (
        <div className="h-full p-8 animate-fadeIn overflow-auto">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">みんなの作品</h2>
              <button
                onClick={resetExperience}
                className="px-6 py-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              >
                戻る
              </button>
            </div>

            <div className="grid grid-cols-5 gap-4">
              {/* Gallery items placeholder */}
              {Array.from({ length: 20 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-square bg-white/10 rounded-lg hover:scale-105 transition-transform"
                >
                  <div className="h-full flex items-center justify-center text-white/50">
                    作品 {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TalkArt
