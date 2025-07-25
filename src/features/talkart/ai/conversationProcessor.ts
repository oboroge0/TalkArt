import { ConversationResponse } from '@/features/talkart/types'

export class ConversationProcessor {
  // 会話応答から感情とテーマを分析
  analyzeResponses(responses: ConversationResponse[]): {
    emotion: string
    themes: string[]
    artStyle: string
  } {
    const analysis = {
      emotion: 'nostalgic',
      themes: [] as string[],
      artStyle: 'japanese_festival_illustration',
    }

    responses.forEach((response) => {
      switch (response.questionId) {
        case 'q1_atmosphere':
          if (response.selectedAnswer.includes('賑やか')) {
            analysis.themes.push('lively')
            analysis.themes.push('crowded')
          } else if (response.selectedAnswer.includes('静か')) {
            analysis.themes.push('peaceful')
            analysis.themes.push('mystical')
          } else if (response.selectedAnswer.includes('懐かしくて')) {
            analysis.themes.push('family')
            analysis.themes.push('warm')
          }
          break

        case 'q2_sound':
          if (response.selectedAnswer.includes('太鼓')) {
            analysis.themes.push('traditional_drums')
          } else if (response.selectedAnswer.includes('風鈴')) {
            analysis.themes.push('wind_chimes')
          } else if (response.selectedAnswer.includes('笑い声')) {
            analysis.themes.push('people_chatting')
          }
          break

        case 'q3_food':
          if (response.selectedAnswer.includes('かき氷')) {
            analysis.themes.push('shaved_ice')
          } else if (response.selectedAnswer.includes('焼きそば')) {
            analysis.themes.push('yakisoba')
          } else if (response.selectedAnswer.includes('りんご飴')) {
            analysis.themes.push('candy_apple')
          }
          break

        case 'q4_activity':
          if (response.selectedAnswer.includes('金魚すくい')) {
            analysis.themes.push('goldfish_scooping')
          } else if (response.selectedAnswer.includes('花火')) {
            analysis.themes.push('fireworks')
          } else if (response.selectedAnswer.includes('浴衣')) {
            analysis.themes.push('yukata')
          }
          break

        case 'q5_emotion':
          if (response.selectedAnswer.includes('興奮と喜び')) {
            analysis.emotion = 'joyful'
          } else if (response.selectedAnswer.includes('幸せと安らぎ')) {
            analysis.emotion = 'peaceful'
          } else if (response.selectedAnswer.includes('懐かしさと温もり')) {
            analysis.emotion = 'nostalgic'
          }
          break
      }
    })

    return analysis
  }

  // アート生成用のプロンプトを構築
  buildArtPrompt(
    responses: ConversationResponse[],
    analysis: ReturnType<typeof this.analyzeResponses>
  ): string {
    const basePrompt = 'Japanese summer festival (natsu matsuri) illustration'
    const stylePrompt = `in warm, ${analysis.emotion} atmosphere`

    // テーマ要素を組み合わせる
    const elements = analysis.themes
      .map((theme) => {
        switch (theme) {
          case 'lively':
            return 'bustling festival atmosphere'
          case 'crowded':
            return 'many people enjoying'
          case 'peaceful':
            return 'serene and calm mood'
          case 'mystical':
            return 'lanterns glowing softly'
          case 'family':
            return 'families together'
          case 'warm':
            return 'warm feeling'
          case 'traditional_drums':
            return 'taiko drums'
          case 'wind_chimes':
            return 'furin wind chimes'
          case 'people_chatting':
            return 'people laughing and talking'
          case 'shaved_ice':
            return 'kakigori stand'
          case 'yakisoba':
            return 'yakisoba stall'
          case 'candy_apple':
            return 'candy apples (ringo-ame)'
          case 'goldfish_scooping':
            return 'kingyo-sukui game'
          case 'fireworks':
            return 'hanabi fireworks in sky'
          case 'yukata':
            return 'people wearing yukata'
          default:
            return theme
        }
      })
      .join(', ')

    // 最終的なプロンプト
    const fullPrompt = `${basePrompt} ${stylePrompt}, featuring ${elements}. Traditional Japanese festival scene with paper lanterns, festival stalls, warm lighting. Digital art, detailed illustration, Studio Ghibli style, nostalgic mood, summer evening atmosphere.`

    return fullPrompt
  }

  // 会話サマリーを生成
  generateConversationSummary(responses: ConversationResponse[]): string {
    if (responses.length === 0) {
      return '夏祭りの思い出'
    }

    const summary: string[] = []

    responses.forEach((response) => {
      switch (response.questionId) {
        case 'q1_atmosphere':
          summary.push(`雰囲気: ${response.selectedAnswer}`)
          break
        case 'q2_sound':
          summary.push(`音: ${response.selectedAnswer}`)
          break
        case 'q3_food':
          summary.push(`食べ物: ${response.selectedAnswer}`)
          break
        case 'q4_activity':
          summary.push(`体験: ${response.selectedAnswer}`)
          break
        case 'q5_emotion':
          summary.push(`感情: ${response.selectedAnswer}`)
          break
      }
    })

    return summary.join('、')
  }
}