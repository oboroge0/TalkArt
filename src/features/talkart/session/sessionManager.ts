import {
  SessionData,
  ConversationResponse,
  GeneratedArtwork,
} from '@/features/talkart/types'

export class TalkArtSessionManager {
  private static readonly STORAGE_KEY = 'talkart_session'
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000 // 30分

  // セッションをローカルストレージに保存
  static saveSession(session: SessionData): void {
    try {
      const sessionWithTimestamp = {
        ...session,
        lastUpdated: new Date().toISOString(),
      }
      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(sessionWithTimestamp)
      )
    } catch (error) {
      console.warn('Failed to save session to localStorage:', error)
    }
  }

  // セッションをローカルストレージから復元
  static restoreSession(): SessionData | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return null

      const session = JSON.parse(stored)

      // タイムアウトチェック
      if (this.isSessionExpired(session)) {
        this.clearSession()
        return null
      }

      // 日付オブジェクトを復元
      return {
        ...session,
        startTime: new Date(session.startTime),
        endTime: session.endTime ? new Date(session.endTime) : undefined,
        generatedArtwork: session.generatedArtwork
          ? {
              ...session.generatedArtwork,
              createdAt: new Date(session.generatedArtwork.createdAt),
            }
          : undefined,
      }
    } catch (error) {
      console.warn('Failed to restore session from localStorage:', error)
      this.clearSession()
      return null
    }
  }

  // セッションをクリア
  static clearSession(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
    } catch (error) {
      console.warn('Failed to clear session from localStorage:', error)
    }
  }

  // セッションの有効期限チェック
  static isSessionExpired(session: any): boolean {
    if (!session.lastUpdated) return true

    const lastUpdated = new Date(session.lastUpdated)
    const now = new Date()

    return now.getTime() - lastUpdated.getTime() > this.SESSION_TIMEOUT
  }

  // セッション統計の取得
  static getSessionStats(): {
    totalSessions: number
    totalArtworks: number
    averageCompletionTime: number
  } {
    try {
      const stats = localStorage.getItem('talkart_stats')
      if (!stats) {
        return {
          totalSessions: 0,
          totalArtworks: 0,
          averageCompletionTime: 0,
        }
      }
      return JSON.parse(stats)
    } catch (error) {
      console.warn('Failed to get session stats:', error)
      return {
        totalSessions: 0,
        totalArtworks: 0,
        averageCompletionTime: 0,
      }
    }
  }

  // セッション統計の更新
  static updateSessionStats(session: SessionData): void {
    try {
      const currentStats = this.getSessionStats()

      const completionTime =
        session.endTime && session.startTime
          ? session.endTime.getTime() - session.startTime.getTime()
          : 0

      const newStats = {
        totalSessions: currentStats.totalSessions + 1,
        totalArtworks: session.generatedArtwork
          ? currentStats.totalArtworks + 1
          : currentStats.totalArtworks,
        averageCompletionTime:
          completionTime > 0
            ? (currentStats.averageCompletionTime * currentStats.totalSessions +
                completionTime) /
              (currentStats.totalSessions + 1)
            : currentStats.averageCompletionTime,
      }

      localStorage.setItem('talkart_stats', JSON.stringify(newStats))
    } catch (error) {
      console.warn('Failed to update session stats:', error)
    }
  }

  // ユーザーの過去の選択履歴を取得
  static getUserChoiceHistory(): {
    [questionId: string]: { [answer: string]: number }
  } {
    try {
      const history = localStorage.getItem('talkart_choice_history')
      return history ? JSON.parse(history) : {}
    } catch (error) {
      console.warn('Failed to get choice history:', error)
      return {}
    }
  }

  // ユーザーの選択履歴を更新
  static updateChoiceHistory(responses: ConversationResponse[]): void {
    try {
      const currentHistory = this.getUserChoiceHistory()

      responses.forEach((response) => {
        if (!currentHistory[response.questionId]) {
          currentHistory[response.questionId] = {}
        }

        const answerKey = response.selectedAnswer
        currentHistory[response.questionId][answerKey] =
          (currentHistory[response.questionId][answerKey] || 0) + 1
      })

      localStorage.setItem(
        'talkart_choice_history',
        JSON.stringify(currentHistory)
      )
    } catch (error) {
      console.warn('Failed to update choice history:', error)
    }
  }

  // セッションのバックアップ（将来的な拡張用）
  static exportSession(session: SessionData): string {
    return JSON.stringify({
      ...session,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    })
  }

  // セッションのインポート（将来的な拡張用）
  static importSession(sessionData: string): SessionData | null {
    try {
      const data = JSON.parse(sessionData)
      if (!data.sessionId || !data.startTime) {
        throw new Error('Invalid session data format')
      }

      return {
        ...data,
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : undefined,
        generatedArtwork: data.generatedArtwork
          ? {
              ...data.generatedArtwork,
              createdAt: new Date(data.generatedArtwork.createdAt),
            }
          : undefined,
      }
    } catch (error) {
      console.error('Failed to import session:', error)
      return null
    }
  }
}
