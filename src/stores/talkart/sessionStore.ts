import { create } from 'zustand'
import { 
  SessionData, 
  ExperiencePhase, 
  ConversationResponse, 
  GeneratedArtwork,
  ExperienceFlowState 
} from '@/features/talkart/types'

interface SessionState {
  // セッションデータ
  currentSession: SessionData | null
  
  // 体験フロー状態
  flowState: ExperienceFlowState
  
  // アクション
  startSession: () => void
  endSession: () => void
  setPhase: (phase: ExperiencePhase) => void
  addConversationResponse: (response: ConversationResponse) => void
  setGeneratedArtwork: (artwork: GeneratedArtwork) => void
  resetSession: () => void
  setTimeRemaining: (time: number) => void
  setError: (error: string | null) => void
  setTransitioning: (transitioning: boolean) => void
}

const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

const initialFlowState: ExperienceFlowState = {
  currentPhase: 'START',
  isTransitioning: false,
  canProceed: true,
  error: undefined,
  timeRemaining: undefined
}

export const useSessionStore = create<SessionState>((set, get) => ({
  currentSession: null,
  flowState: initialFlowState,

  startSession: () => {
    const sessionId = generateSessionId()
    const newSession: SessionData = {
      sessionId,
      startTime: new Date(),
      currentPhase: 'START',
      conversationResponses: []
    }
    
    set({
      currentSession: newSession,
      flowState: {
        ...initialFlowState,
        currentPhase: 'START'
      }
    })
  },

  endSession: () => {
    const { currentSession } = get()
    if (currentSession) {
      const updatedSession: SessionData = {
        ...currentSession,
        endTime: new Date()
      }
      set({
        currentSession: updatedSession
      })
    }
  },

  setPhase: (phase: ExperiencePhase) => {
    const { currentSession, flowState } = get()
    if (currentSession) {
      set({
        currentSession: {
          ...currentSession,
          currentPhase: phase
        },
        flowState: {
          ...flowState,
          currentPhase: phase,
          error: undefined
        }
      })
    }
  },

  addConversationResponse: (response: ConversationResponse) => {
    const { currentSession } = get()
    if (currentSession) {
      set({
        currentSession: {
          ...currentSession,
          conversationResponses: [
            ...currentSession.conversationResponses,
            response
          ]
        }
      })
    }
  },

  setGeneratedArtwork: (artwork: GeneratedArtwork) => {
    const { currentSession } = get()
    if (currentSession) {
      set({
        currentSession: {
          ...currentSession,
          generatedArtwork: artwork
        }
      })
    }
  },

  resetSession: () => {
    set({
      currentSession: null,
      flowState: initialFlowState
    })
  },

  setTimeRemaining: (time: number) => {
    const { flowState } = get()
    set({
      flowState: {
        ...flowState,
        timeRemaining: time
      }
    })
  },

  setError: (error: string | null) => {
    const { flowState } = get()
    set({
      flowState: {
        ...flowState,
        error: error || undefined
      }
    })
  },

  setTransitioning: (transitioning: boolean) => {
    const { flowState } = get()
    set({
      flowState: {
        ...flowState,
        isTransitioning: transitioning
      }
    })
  }
}))