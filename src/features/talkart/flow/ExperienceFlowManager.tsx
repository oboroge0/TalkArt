import React, { useState, useEffect, useCallback } from 'react'
import { useSessionStore } from '@/stores/talkart/sessionStore'
import { useGalleryStore } from '@/stores/talkart/galleryStore'
import { useConfigStore } from '@/stores/talkart/configStore'
import { TalkArtLayout } from '@/components/talkart/TalkArtLayout'
import { TalkArtBackground } from '@/components/talkart/TalkArtBackground'
import { TalkArtForm } from '@/components/talkart/TalkArtForm'
import { StartButton } from '@/components/talkart/TalkArtButton'
import { TalkArtGalleryMini } from '@/components/talkart/TalkArtGallery'
import {
  ExperiencePhase,
  ConversationResponse,
  GeneratedArtwork,
} from '@/features/talkart/types'

interface ExperienceFlowManagerProps {
  onComplete?: (artwork: GeneratedArtwork) => void
  onError?: (error: string) => void
}

export const ExperienceFlowManager: React.FC<ExperienceFlowManagerProps> = ({
  onComplete,
  onError,
}) => {
  const {
    currentSession,
    flowState,
    startSession,
    setPhase,
    setGeneratedArtwork,
    setError,
    setTransitioning,
    resetSession,
  } = useSessionStore()

  const { addArtwork } = useGalleryStore()
  const { config } = useConfigStore()

  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)

  // フェーズ遷移の処理
  const transitionToPhase = useCallback(
    async (nextPhase: ExperiencePhase) => {
      setTransitioning(true)
      setError(null)

      // フェード効果のための遅延
      await new Promise((resolve) =>
        setTimeout(resolve, config.animation.fadeTransitionDuration)
      )

      setPhase(nextPhase)
      setTransitioning(false)
    },
    [
      setPhase,
      setTransitioning,
      setError,
      config.animation.fadeTransitionDuration,
    ]
  )

  // 体験開始
  const handleStartExperience = useCallback(async () => {
    startSession()
    await transitionToPhase('QUESTIONS')
  }, [startSession, transitionToPhase])

  // 質問完了時の処理
  const handleQuestionsComplete = useCallback(
    async (responses: ConversationResponse[]) => {
      try {
        await transitionToPhase('GENERATION')
        setIsGenerating(true)
        setGenerationProgress(0)

        // プログレス更新のシミュレーション
        const progressInterval = setInterval(() => {
          setGenerationProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval)
              return 90
            }
            return prev + 10
          })
        }, 1000)

        // アート生成API呼び出し
        const response = await fetch('/api/talkart/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            responses,
            sessionId: currentSession?.sessionId,
          }),
        })

        clearInterval(progressInterval)

        if (!response.ok) {
          throw new Error('アート生成に失敗しました')
        }

        const result = await response.json()
        if (!result.success) {
          throw new Error(result.error || 'アート生成に失敗しました')
        }

        const artwork: GeneratedArtwork = result.data
        setGeneratedArtwork(artwork)
        setGenerationProgress(100)

        // ギャラリーに追加
        await addArtworkToGallery(artwork)

        // 結果フェーズに遷移
        setTimeout(async () => {
          setIsGenerating(false)
          await transitionToPhase('RESULT')
          onComplete?.(artwork)
        }, 1000)
      } catch (error) {
        console.error('Art generation error:', error)
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'アート生成中にエラーが発生しました'
        setError(errorMessage)
        setIsGenerating(false)
        onError?.(errorMessage)
      }
    },
    [
      currentSession,
      transitionToPhase,
      setGeneratedArtwork,
      setError,
      onComplete,
      onError,
    ]
  )

  // ギャラリーへの追加
  const addArtworkToGallery = async (artwork: GeneratedArtwork) => {
    try {
      const response = await fetch('/api/talkart/gallery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(artwork),
      })

      if (response.ok) {
        addArtwork(artwork)
      }
    } catch (error) {
      console.warn('Failed to add artwork to gallery:', error)
      // ギャラリー追加の失敗は体験を止めない
    }
  }

  // 体験リセット
  const handleRestart = useCallback(async () => {
    resetSession()
    setIsGenerating(false)
    setGenerationProgress(0)
    await transitionToPhase('START')
  }, [resetSession, transitionToPhase])

  // 現在のフェーズに応じたコンテンツをレンダリング
  const renderPhaseContent = () => {
    if (flowState.isTransitioning) {
      return <div className="text-center text-white">読み込み中...</div>
    }

    switch (flowState.currentPhase) {
      case 'START':
        return (
          <div className="text-center">
            <div className="mb-8">
              <h2 className="text-5xl font-bold text-white mb-4">
                夏祭りの記憶をアートに
              </h2>
              <p className="text-xl text-gray-200 mb-8">
                あなたの夏祭りの思い出を5つの質問で教えてください。
                <br />
                AIがその記憶を美しいアートワークに変換します。
              </p>
            </div>
            <StartButton
              onClick={handleStartExperience}
              disabled={flowState.isTransitioning}
            />
            <div className="mt-12">
              <TalkArtGalleryMini />
            </div>
          </div>
        )

      case 'QUESTIONS':
        return (
          <TalkArtForm
            onComplete={handleQuestionsComplete}
            onTimeout={() => setError('時間切れです。もう一度お試しください。')}
          />
        )

      case 'GENERATION':
        return (
          <div className="text-center">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">
                あなたのアートを生成中...
              </h2>
              <p className="text-gray-200 mb-8">
                夏祭りの思い出を美しいアートワークに変換しています
              </p>
            </div>

            {/* プログレスバー */}
            <div className="max-w-md mx-auto mb-8">
              <div className="w-full bg-gray-700 rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-orange-500 to-pink-500 h-4 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
              <p className="text-white mt-2">{generationProgress}% 完了</p>
            </div>

            {/* 生成中のアニメーション */}
            <div className="flex justify-center items-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl">🎨</span>
                </div>
              </div>
            </div>
          </div>
        )

      case 'RESULT':
        return (
          <div className="text-center">
            {currentSession?.generatedArtwork && (
              <>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-white mb-4">
                    🎉 完成しました！
                  </h2>
                  <p className="text-gray-200">
                    あなたの夏祭りの思い出がアートになりました
                  </p>
                </div>

                {/* 生成されたアートワーク */}
                <div className="max-w-lg mx-auto mb-8">
                  <div className="bg-white rounded-xl p-4 shadow-2xl">
                    <img
                      src={currentSession.generatedArtwork.imageUrl}
                      alt="Generated summer festival artwork"
                      className="w-full h-auto rounded-lg"
                    />
                    <div className="mt-4 text-sm text-gray-600">
                      生成時間:{' '}
                      {currentSession.generatedArtwork.metadata.generationTime}
                      ms
                    </div>
                  </div>
                </div>

                {/* アクションボタン */}
                <div className="space-y-4">
                  <button
                    onClick={handleRestart}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-300"
                  >
                    もう一度作成する
                  </button>
                </div>

                {/* ミニギャラリー */}
                <div className="mt-12">
                  <h3 className="text-xl font-bold text-white mb-4">
                    他の作品も見てみましょう
                  </h3>
                  <TalkArtGalleryMini />
                </div>
              </>
            )}
          </div>
        )

      default:
        return <div className="text-center text-white">不明な状態です</div>
    }
  }

  // エラー表示
  if (flowState.error) {
    return (
      <TalkArtLayout phase={flowState.currentPhase}>
        <TalkArtBackground />
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-4">
            エラーが発生しました
          </h2>
          <p className="text-gray-200 mb-8">{flowState.error}</p>
          <button
            onClick={handleRestart}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-300"
          >
            最初からやり直す
          </button>
        </div>
      </TalkArtLayout>
    )
  }

  return (
    <TalkArtLayout phase={flowState.currentPhase}>
      <TalkArtBackground
        variant={flowState.currentPhase === 'RESULT' ? 'fireworks' : 'default'}
      />
      {renderPhaseContent()}
    </TalkArtLayout>
  )
}
