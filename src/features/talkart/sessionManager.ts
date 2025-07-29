// TalkArt Session Manager
export interface TalkArtSession {
  id: string
  startTime: Date
  endTime?: Date
  status: 'active' | 'completed' | 'timeout' | 'error'
  responses: Array<{
    questionId: string
    answer: string
    timestamp: Date
  }>
  generatedArtworkId?: string
  metadata: {
    duration?: number
    completionReason?: 'user_completed' | 'timeout' | 'error'
    errorMessage?: string
  }
}

export class TalkArtSessionManager {
  private static instance: TalkArtSessionManager
  private currentSession: TalkArtSession | null = null
  private sessionHistory: TalkArtSession[] = []
  private readonly MAX_HISTORY_SIZE = 50
  private readonly STORAGE_KEY = 'talkart_sessions'

  private constructor() {
    this.loadSessionHistory()
  }

  public static getInstance(): TalkArtSessionManager {
    if (!TalkArtSessionManager.instance) {
      TalkArtSessionManager.instance = new TalkArtSessionManager()
    }
    return TalkArtSessionManager.instance
  }

  // Start a new session
  public startSession(): TalkArtSession {
    if (this.currentSession && this.currentSession.status === 'active') {
      // End the current session if it's still active
      this.endSession('error', 'New session started before completion')
    }

    const session: TalkArtSession = {
      id: this.generateSessionId(),
      startTime: new Date(),
      status: 'active',
      responses: [],
      metadata: {},
    }

    this.currentSession = session
    console.log('TalkArt session started:', session.id)

    return session
  }

  // Add a response to the current session
  public addResponse(questionId: string, answer: string): void {
    if (!this.currentSession || this.currentSession.status !== 'active') {
      console.error('No active session to add response to')
      return
    }

    this.currentSession.responses.push({
      questionId,
      answer,
      timestamp: new Date(),
    })
  }

  // End the current session
  public endSession(
    status: 'completed' | 'timeout' | 'error' = 'completed',
    errorMessage?: string
  ): TalkArtSession | null {
    if (!this.currentSession) {
      console.error('No active session to end')
      return null
    }

    this.currentSession.endTime = new Date()
    this.currentSession.status = status

    // Calculate duration
    const duration =
      this.currentSession.endTime.getTime() -
      this.currentSession.startTime.getTime()
    this.currentSession.metadata.duration = duration

    // Set completion reason
    if (status === 'completed') {
      this.currentSession.metadata.completionReason = 'user_completed'
    } else if (status === 'timeout') {
      this.currentSession.metadata.completionReason = 'timeout'
    } else if (status === 'error') {
      this.currentSession.metadata.completionReason = 'error'
      if (errorMessage) {
        this.currentSession.metadata.errorMessage = errorMessage
      }
    }

    // Add to history
    this.addToHistory(this.currentSession)

    const completedSession = this.currentSession
    this.currentSession = null

    console.log('TalkArt session ended:', completedSession.id, status)
    return completedSession
  }

  // Set the generated artwork ID for the current session
  public setGeneratedArtworkId(artworkId: string): void {
    if (!this.currentSession) {
      console.error('No active session to set artwork ID')
      return
    }

    this.currentSession.generatedArtworkId = artworkId
  }

  // Get the current active session
  public getCurrentSession(): TalkArtSession | null {
    return this.currentSession
  }

  // Get session history
  public getSessionHistory(): TalkArtSession[] {
    return [...this.sessionHistory]
  }

  // Get session statistics
  public getSessionStats() {
    const completedSessions = this.sessionHistory.filter(
      (s) => s.status === 'completed'
    )
    const timeoutSessions = this.sessionHistory.filter(
      (s) => s.status === 'timeout'
    )
    const errorSessions = this.sessionHistory.filter(
      (s) => s.status === 'error'
    )

    const averageDuration =
      completedSessions.length > 0
        ? completedSessions.reduce(
            (sum, s) => sum + (s.metadata.duration || 0),
            0
          ) / completedSessions.length
        : 0

    const today = new Date().toDateString()
    const todaySessions = this.sessionHistory.filter(
      (s) => new Date(s.startTime).toDateString() === today
    )

    return {
      total: this.sessionHistory.length,
      completed: completedSessions.length,
      timeout: timeoutSessions.length,
      error: errorSessions.length,
      averageDuration: Math.round(averageDuration / 1000), // in seconds
      todayCount: todaySessions.length,
      completionRate:
        this.sessionHistory.length > 0
          ? Math.round(
              (completedSessions.length / this.sessionHistory.length) * 100
            )
          : 0,
    }
  }

  // Reset the session manager (for testing or cleanup)
  public reset(): void {
    if (this.currentSession && this.currentSession.status === 'active') {
      this.endSession('error', 'Session manager reset')
    }
    this.currentSession = null
  }

  // Clear all session history
  public clearHistory(): void {
    this.sessionHistory = []
    this.saveSessionHistory()
  }

  // Private methods
  private generateSessionId(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9)
    return `session_${timestamp}_${random}`
  }

  private addToHistory(session: TalkArtSession): void {
    this.sessionHistory.unshift(session)

    // Keep only the latest MAX_HISTORY_SIZE sessions
    if (this.sessionHistory.length > this.MAX_HISTORY_SIZE) {
      this.sessionHistory = this.sessionHistory.slice(0, this.MAX_HISTORY_SIZE)
    }

    this.saveSessionHistory()
  }

  private loadSessionHistory(): void {
    if (typeof window === 'undefined') {
      // Running on server, skip localStorage
      return
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Convert date strings back to Date objects
        this.sessionHistory = parsed.map((s: any) => ({
          ...s,
          startTime: new Date(s.startTime),
          endTime: s.endTime ? new Date(s.endTime) : undefined,
          responses: s.responses.map((r: any) => ({
            ...r,
            timestamp: new Date(r.timestamp),
          })),
        }))
      }
    } catch (error) {
      console.error('Failed to load session history:', error)
      this.sessionHistory = []
    }
  }

  private saveSessionHistory(): void {
    if (typeof window === 'undefined') {
      // Running on server, skip localStorage
      return
    }

    try {
      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(this.sessionHistory)
      )
    } catch (error) {
      console.error('Failed to save session history:', error)
    }
  }
}

// Export singleton instance
export const talkArtSessionManager = TalkArtSessionManager.getInstance()
