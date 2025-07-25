import { create } from 'zustand'
import { TalkArtQuestion } from '@/features/talkart/types'

interface TalkArtStore {
  // TalkArtモードの状態
  isActive: boolean
  currentQuestion: TalkArtQuestion | null
  questionIndex: number

  // アクション
  startTalkArt: () => void
  setCurrentQuestion: (question: TalkArtQuestion) => void
  nextQuestion: () => void
  resetTalkArt: () => void
}

export const useTalkArtStore = create<TalkArtStore>((set, get) => ({
  isActive: false,
  currentQuestion: null,
  questionIndex: 0,

  startTalkArt: () => {
    set({ isActive: true, questionIndex: 0 })
  },

  setCurrentQuestion: (question) => {
    set({ currentQuestion: question })
  },

  nextQuestion: () => {
    const { questionIndex } = get()
    set({ questionIndex: questionIndex + 1 })
  },

  resetTalkArt: () => {
    set({
      isActive: false,
      currentQuestion: null,
      questionIndex: 0,
    })
  },
}))
