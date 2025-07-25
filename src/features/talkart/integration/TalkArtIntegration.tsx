import { useEffect } from 'react'
import { useTalkArtStore } from '@/stores/talkart/talkArtStore'
import { useSessionStore } from '@/stores/talkart/sessionStore'
import { useConfigStore } from '@/stores/talkart/configStore'
import { generateArtwork } from '@/features/talkart/generation/artGenerationAPI'
import { useTalkArtAudio } from '@/hooks/useTalkArtAudio'
import homeStore from '@/features/stores/home'

interface TalkArtQuestion {
  id: string
  stepNumber: number
  question: string
  choices: string[]
}

export const TalkArtIntegration = () => {
  const {
    isActive,
    currentQuestion,
    questionIndex,
    setCurrentQuestion,
    nextQuestion,
    resetTalkArt,
  } = useTalkArtStore()
  const {
    phase,
    conversationResponses,
    setPhase,
    startSession,
    endSession,
    setGeneratedArtwork,
  } = useSessionStore()
  const { config } = useConfigStore()
  const { playCompletionSound, playNotificationSound } = useTalkArtAudio()
  const upsertMessage = homeStore((state) => state.upsertMessage)

  // TalkArtモード開始時の処理
  useEffect(() => {
    if (isActive && phase === 'START') {
      startSession()
      setPhase('QUESTIONS')

      // 最初の質問を生成
      const firstQuestion: TalkArtQuestion = {
        id: 'q1',
        stepNumber: 0,
        question: '夏祭りで一番印象に残っているのは何ですか？',
        choices: ['花火の美しさ', '屋台の賑わい', '浴衣を着た思い出'],
      }
      setCurrentQuestion(firstQuestion)

      // アシスタントメッセージとして質問を表示
      upsertMessage({
        role: 'assistant',
        content: firstQuestion.question,
      })
      playNotificationSound()
    }
  }, [isActive, phase])

  // 回答が追加されたときの処理
  useEffect(() => {
    if (phase === 'QUESTIONS' && conversationResponses.length > questionIndex) {
      // 次の質問を生成するか、アート生成に移行
      if (conversationResponses.length < 5) {
        // 質問リスト
        const questions: TalkArtQuestion[] = [
          {
            id: 'q1',
            stepNumber: 0,
            question: '夏祭りで一番印象に残っているのは何ですか？',
            choices: ['花火の美しさ', '屋台の賑わい', '浴衣を着た思い出'],
          },
          {
            id: 'q2',
            stepNumber: 1,
            question: '誰と一緒に行きましたか？',
            choices: ['家族と', '友達と', '恋人と'],
          },
          {
            id: 'q3',
            stepNumber: 2,
            question: '夏祭りの時間帯はいつが好きですか？',
            choices: ['夕暮れ時', '夜の賑わい', '花火の時間'],
          },
          {
            id: 'q4',
            stepNumber: 3,
            question: '屋台で何を食べましたか？',
            choices: ['かき氷', 'たこ焼き', 'りんご飴'],
          },
          {
            id: 'q5',
            stepNumber: 4,
            question: 'その思い出の感情は？',
            choices: ['楽しかった', 'ロマンチックだった', '懐かしい'],
          },
        ]

        const nextQuestionData = questions[conversationResponses.length]
        setCurrentQuestion(nextQuestionData)
        nextQuestion()

        // アシスタントメッセージとして質問を表示
        upsertMessage({
          role: 'assistant',
          content: nextQuestionData.question,
        })
      } else {
        // 5つの質問が完了したらアート生成フェーズへ
        setPhase('GENERATION')
        upsertMessage({
          role: 'assistant',
          content:
            '素敵な思い出ですね！今からあなただけの夏祭りアートを描きます...',
        })
        handleArtGeneration()
      }
    }
  }, [conversationResponses.length])

  // アート生成処理
  const handleArtGeneration = async () => {
    try {
      const result = await generateArtwork({
        sessionId: useSessionStore.getState().sessionId,
        responses: conversationResponses,
        config: {
          artStyle: 'watercolor',
          colorPalette: 'vibrant',
        },
      })

      if (result.success && result.artwork) {
        setGeneratedArtwork(result.artwork)
        setPhase('RESULT')
        playCompletionSound()

        // 結果メッセージを表示
        upsertMessage({
          role: 'assistant',
          content: `完成しました！あなたの夏祭りの思い出が美しいアートになりました。\n\n生成されたアート: ${result.artwork.imageUrl}`,
        })

        // 3秒後に自動的にTalkArtモードを終了
        setTimeout(() => {
          endSession()
          resetTalkArt()
          upsertMessage({
            role: 'assistant',
            content:
              'TalkArt体験ありがとうございました！また新しい思い出を作りに来てくださいね。',
          })
        }, 30000) // 30秒表示
      } else {
        throw new Error(result.error || 'アート生成に失敗しました')
      }
    } catch (error) {
      console.error('Art generation error:', error)
      upsertMessage({
        role: 'assistant',
        content: '申し訳ございません。アート生成中にエラーが発生しました。',
      })

      // エラー時は3秒後にリセット
      setTimeout(() => {
        endSession()
        resetTalkArt()
      }, 3000)
    }
  }

  return null // このコンポーネントはUIを持たない
}

// TalkArt統合を有効化するためのフック
export const useTalkArtIntegration = () => {
  const { isActive } = useTalkArtStore()
  return { isActive }
}
