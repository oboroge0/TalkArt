import { useCallback, useEffect, useState } from 'react'
import settingsStore from '@/features/stores/settings'
import homeStore from '@/features/stores/home'
import menuStore from '@/features/stores/menu'
import slideStore from '@/features/stores/slide'
import { handleSendChatFn } from '../features/chat/handlers'
import { MessageInputContainer } from './messageInputContainer'
import { PresetQuestionButtons } from './presetQuestionButtons'
import { SlideText } from './slideText'
import { isMultiModalAvailable } from '@/features/constants/aiModels'
import { AIService } from '@/features/constants/settings'
import { TalkArtModeButton } from './talkart/TalkArtModeButton'
import { TalkArtChoiceButtons } from './talkart/TalkArtChoiceButtons'
import { TalkArtResultDisplay } from './talkart/TalkArtResultDisplay'
import { TalkArtGalleryButton } from './talkart/TalkArtGalleryButton'
import { useTalkArtStore } from '@/stores/talkart/talkArtStore'
import { useSessionStore } from '@/stores/talkart/sessionStore'
import { LoadingSpinner } from './talkart/TalkArtAnimations'

export const Form = () => {
  const modalImage = homeStore((s) => s.modalImage)
  const webcamStatus = homeStore((s) => s.webcamStatus)
  const captureStatus = homeStore((s) => s.captureStatus)
  const slideMode = settingsStore((s) => s.slideMode)
  const slideVisible = menuStore((s) => s.slideVisible)
  const slidePlaying = slideStore((s) => s.isPlaying)
  const chatProcessingCount = homeStore((s) => s.chatProcessingCount)
  const multiModalMode = settingsStore((s) => s.multiModalMode)
  const selectAIService = settingsStore((s) => s.selectAIService)
  const selectAIModel = settingsStore((s) => s.selectAIModel)
  const enableMultiModal = settingsStore((s) => s.enableMultiModal)
  const [delayedText, setDelayedText] = useState('')
  const handleSendChat = handleSendChatFn()
  const { isActive: isTalkArtActive } = useTalkArtStore()
  const { flowState } = useSessionStore()

  useEffect(() => {
    // テキストと画像がそろったら、チャットを送信
    if (delayedText && modalImage) {
      handleSendChat(delayedText)
      setDelayedText('')
    }

    // コンポーネントがアンマウントされる際にpending操作をクリーンアップ
    return () => {
      if (delayedText) {
        setDelayedText('')
      }
    }
  }, [modalImage, delayedText, handleSendChat])

  const hookSendChat = useCallback(
    (text: string) => {
      // マルチモーダル機能が使用可能かチェック
      const isMultiModalSupported = isMultiModalAvailable(
        selectAIService as AIService,
        selectAIModel,
        enableMultiModal,
        multiModalMode
      )

      // モードに基づいて画像キャプチャの必要性を判定
      let shouldCaptureImage = false

      if (isMultiModalSupported && (webcamStatus || captureStatus)) {
        switch (multiModalMode) {
          case 'always':
            shouldCaptureImage = true
            break
          case 'never':
            shouldCaptureImage = false
            break
          case 'ai-decide':
            // AI判断モードの場合、とりあえず画像をキャプチャして、後でAIに判断させる
            shouldCaptureImage = true
            break
        }
      }

      // 画像キャプチャが必要な場合
      if (shouldCaptureImage) {
        // すでにmodalImageが存在する場合は、Webcamのキャプチャーをスキップ
        homeStore.setState((state) => {
          if (!state.modalImage) {
            return { ...state, triggerShutter: true }
          }
          return state
        })
        // 画像が取得されるまで遅延させる
        setDelayedText(text)
      } else {
        // 画像キャプチャが不要な場合は直接送信
        handleSendChat(text)
      }
    },
    [
      handleSendChat,
      webcamStatus,
      captureStatus,
      setDelayedText,
      multiModalMode,
      selectAIService,
      selectAIModel,
    ]
  )

  return slideMode &&
    slideVisible &&
    slidePlaying &&
    chatProcessingCount !== 0 ? (
    <SlideText />
  ) : (
    <>
      {/* TalkArtボタンコンテナ */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <TalkArtModeButton />
        </div>
        <div className="flex-1">
          <TalkArtGalleryButton />
        </div>
      </div>

      {/* TalkArtモードの場合はフェーズに応じて表示を切り替え */}
      {isTalkArtActive ? (
        <>
          {flowState.currentPhase === 'QUESTIONS' && <TalkArtChoiceButtons />}
          {flowState.currentPhase === 'GENERATION' && (
            <div className="text-center py-8">
              <LoadingSpinner
                size="large"
                text="あなただけの夏祭りアートを描いています..."
              />
            </div>
          )}
          {flowState.currentPhase === 'RESULT' && <TalkArtResultDisplay />}
        </>
      ) : (
        <>
          <PresetQuestionButtons onSelectQuestion={hookSendChat} />
          <MessageInputContainer onChatProcessStart={hookSendChat} />
        </>
      )}
    </>
  )
}
