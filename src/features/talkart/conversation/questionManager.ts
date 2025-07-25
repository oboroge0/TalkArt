import {
  ConversationQuestion,
  ConversationResponse,
  ConversationFlow,
} from '@/features/talkart/types'
import { conversationFlow } from './questionData'

export class QuestionManager {
  private questions: ConversationQuestion[]
  private currentQuestionIndex: number = 0
  private responses: ConversationResponse[] = []
  private startTime: number = 0
  private questionStartTime: number = 0

  constructor(flow?: ConversationFlow) {
    this.questions = flow?.questions || conversationFlow.questions
    this.startTime = Date.now()
  }

  // 現在の質問を取得
  getCurrentQuestion(): ConversationQuestion | null {
    if (this.currentQuestionIndex >= this.questions.length) {
      return null
    }
    return this.questions[this.currentQuestionIndex]
  }

  // 次の質問に進む
  nextQuestion(): ConversationQuestion | null {
    this.currentQuestionIndex++
    this.questionStartTime = Date.now()
    return this.getCurrentQuestion()
  }

  // 回答を追加
  addResponse(selectedAnswer: string): void {
    const currentQuestion = this.getCurrentQuestion()
    if (!currentQuestion) return

    const response: ConversationResponse = {
      questionId: currentQuestion.id,
      question: currentQuestion.text,
      selectedAnswer,
      timestamp: Date.now(),
      stepNumber: currentQuestion.stepNumber,
    }

    this.responses.push(response)
  }

  // 進捗情報を取得
  getProgress(): {
    current: number
    total: number
    percentage: number
    isComplete: boolean
  } {
    return {
      current: this.currentQuestionIndex + 1,
      total: this.questions.length,
      percentage:
        ((this.currentQuestionIndex + 1) / this.questions.length) * 100,
      isComplete: this.currentQuestionIndex >= this.questions.length,
    }
  }

  // 経過時間を取得
  getElapsedTime(): number {
    return Date.now() - this.startTime
  }

  // 残り時間を取得
  getRemainingTime(): number {
    const elapsed = this.getElapsedTime()
    const maxTime = conversationFlow.maxDuration * 1000 // ミリ秒に変換
    return Math.max(0, maxTime - elapsed)
  }

  // 現在の質問の残り時間を取得
  getCurrentQuestionRemainingTime(): number {
    const currentQuestion = this.getCurrentQuestion()
    if (!currentQuestion || !currentQuestion.timeLimit) return 0

    const elapsed = Date.now() - this.questionStartTime
    const maxTime = currentQuestion.timeLimit * 1000
    return Math.max(0, maxTime - elapsed)
  }

  // タイムアウトチェック
  isTimedOut(): boolean {
    return this.getRemainingTime() <= 0
  }

  // 現在の質問がタイムアウトしているかチェック
  isCurrentQuestionTimedOut(): boolean {
    const currentQuestion = this.getCurrentQuestion()
    if (!currentQuestion || !currentQuestion.timeLimit) return false

    return this.getCurrentQuestionRemainingTime() <= 0
  }

  // すべての回答を取得
  getResponses(): ConversationResponse[] {
    return [...this.responses]
  }

  // 会話の要約を生成
  generateSummary(): string {
    if (this.responses.length === 0) {
      return '夏祭りの思い出を描いてください'
    }

    let summary = '夏祭りの思い出: '

    this.responses.forEach((response, index) => {
      switch (response.questionId) {
        case 'q1_atmosphere':
          summary += `雰囲気は${response.selectedAnswer}、`
          break
        case 'q2_sound':
          summary += `印象的な音は${response.selectedAnswer}、`
          break
        case 'q3_food':
          summary += `思い出の食べ物は${response.selectedAnswer}、`
          break
        case 'q4_activity':
          summary += `楽しかった体験は${response.selectedAnswer}、`
          break
        case 'q5_emotion':
          summary += `全体的な感情は${response.selectedAnswer}`
          break
      }
    })

    summary +=
      'という夏祭りの記憶を、温かく懐かしい雰囲気の日本の夏祭りのイラストとして描いてください。'
    return summary
  }

  // セッションをリセット
  reset(): void {
    this.currentQuestionIndex = 0
    this.responses = []
    this.startTime = Date.now()
    this.questionStartTime = Date.now()
  }

  // 質問をスキップ
  skipCurrentQuestion(): void {
    const currentQuestion = this.getCurrentQuestion()
    if (currentQuestion) {
      this.addResponse('（時間切れのためスキップ）')
    }
    this.nextQuestion()
  }

  // デバッグ用: 現在の状態を取得
  getDebugInfo(): any {
    return {
      currentQuestionIndex: this.currentQuestionIndex,
      questionsTotal: this.questions.length,
      responsesCount: this.responses.length,
      elapsedTime: this.getElapsedTime(),
      remainingTime: this.getRemainingTime(),
      isComplete: this.getProgress().isComplete,
      isTimedOut: this.isTimedOut(),
    }
  }
}
