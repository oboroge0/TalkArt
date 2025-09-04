// TalkArt Poetry Generation Service using GPT-4
import { ConversationResponse } from './questionFlowManager'

export interface PoetryGenerationConfig {
  apiKey?: string
  apiEndpoint?: string
  model?: string
  timeout?: number
}

export interface GeneratedPoetry {
  poem: string
  metadata: {
    createdAt: Date
    sessionId: string
    generationTime: number
    axis: {
      composition: string
      elements: string
      objects: string
      mood: string
    }
    style: 'haiku' | 'tanka' | 'free_verse'
  }
}

export class PoetryGenerator {
  private config: PoetryGenerationConfig

  constructor(config: PoetryGenerationConfig = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      apiEndpoint:
        config.apiEndpoint || 'https://api.openai.com/v1/chat/completions',
      model: config.model || 'gpt-4',
      timeout: config.timeout || 15000,
    }
  }

  // Analyze multilayer responses to extract 4-axis information
  private analyzeMultilayerResponses(responses: ConversationResponse[]) {
    const axisData = {
      composition: '',
      elements: '',
      objects: '',
      mood: '',
    }

    // Extract responses by axis
    responses.forEach((response) => {
      if (response.axis && response.selectedValue && response.selectedLabel) {
        switch (response.axis) {
          case 'composition':
            axisData.composition = response.selectedLabel
            break
          case 'elements':
            axisData.elements = response.selectedLabel
            break
          case 'objects':
            axisData.objects = response.selectedLabel
            break
          case 'mood':
            axisData.mood = response.selectedLabel
            break
        }
      }
    })

    // Fallback for classic questions if multilayer data is incomplete
    if (
      !axisData.composition &&
      !axisData.elements &&
      !axisData.objects &&
      !axisData.mood
    ) {
      console.log('🔄 Using classic responses for poetry generation')

      // Simple mapping from classic responses
      responses.forEach((response) => {
        const answer = response.selectedAnswer.toLowerCase()

        // Composition mapping
        if (answer.includes('花火') || answer.includes('浴衣')) {
          axisData.composition = '祭りの正面から'
          axisData.objects = '花火と浴衣姿'
        } else if (answer.includes('屋台') || answer.includes('かき氷')) {
          axisData.composition = '屋台の裏路地から静かに'
          axisData.objects = '金魚すくいと屋台の賑わい'
        } else if (answer.includes('お神輿') || answer.includes('太鼓')) {
          axisData.composition = '橋の上から見下ろして'
          axisData.objects = 'お囃子と太鼓の音'
        }

        // Elements mapping
        if (answer.includes('友達')) {
          axisData.elements = '友達と一緒に'
        } else if (answer.includes('家族')) {
          axisData.elements = '家族と一緒に'
        } else if (answer.includes('一人')) {
          axisData.elements = '一人で'
        }

        // Mood mapping
        if (answer.includes('ワクワク') || answer.includes('楽しかった')) {
          axisData.mood = 'ワクワクして心が躍った'
        } else if (
          answer.includes('懐かしく') ||
          answer.includes('温かかった')
        ) {
          axisData.mood = '切なく懐かしい気持ちになった'
        } else if (answer.includes('神秘的') || answer.includes('心が震えた')) {
          axisData.mood = '静かで温かい気持ちに包まれた'
        }
      })
    }

    return axisData
  }

  // Create poetry prompt from multilayer responses
  private createPoetryPrompt(
    axisData: ReturnType<typeof this.analyzeMultilayerResponses>
  ): string {
    return `あなたは日本の夏祭りの詩人です。以下の4つの要素から、美しい詩を作成してください。

【構図・視点】: ${axisData.composition}
【共に過ごす人】: ${axisData.elements} 
【印象的な要素】: ${axisData.objects}
【その時の気持ち】: ${axisData.mood}

要求：
1. 夏祭りの情景と感情を繊細に表現した詩を作成
2. 4つの要素すべてを自然に織り込む
3. 日本語の美しい表現を使用
4. 形式は自由詩（6-8行程度）
5. 読み手の心に響く情感豊かな内容
6. 季語や日本的な表現を適度に使用

詩のみを出力してください（説明や前置きは不要）。`
  }

  // Generate poetry using server-side GPT-4 API
  public async generatePoetry(
    responses: ConversationResponse[],
    sessionId: string
  ): Promise<GeneratedPoetry> {
    const startTime = Date.now()

    try {
      console.log('🎭 Generating poetry via server-side API...')

      // Call server-side poetry generation API
      const response = await fetch('/api/talkart/generate-poetry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responses,
          sessionId,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.warn('⚠️ Poetry generation API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        })
        throw new Error(
          `Poetry generation failed: ${response.status} ${response.statusText}`
        )
      }

      const data = await response.json()

      if (!data.poem) {
        throw new Error('No poetry content received from API')
      }

      console.log(
        '✅ Poetry generated successfully:',
        data.poem.substring(0, 50) + '...'
      )

      return {
        poem: data.poem,
        metadata: {
          createdAt: new Date(data.metadata.createdAt),
          sessionId,
          generationTime: Date.now() - startTime,
          axis: data.metadata.axis,
          style: data.metadata.style,
        },
      }
    } catch (error) {
      console.error('❌ Poetry generation error:', error)

      // Fallback to a contextual template-based poem as safety net
      const axisData = this.analyzeMultilayerResponses(responses)
      const fallbackPoem = this.generateFallbackPoetry(axisData)

      console.log('🔄 Using fallback poetry generation')

      return {
        poem: fallbackPoem,
        metadata: {
          createdAt: new Date(),
          sessionId,
          generationTime: Date.now() - startTime,
          axis: axisData,
          style: 'free_verse',
        },
      }
    }
  }

  // Fallback poetry generation (template-based but contextual)
  private generateFallbackPoetry(
    axisData: ReturnType<typeof this.analyzeMultilayerResponses>
  ): string {
    // Simple but contextual fallback based on the axis data
    const templates = {
      composition: {
        祭りの正面から: '賑やかな人波の中',
        橋の上から見下ろして: '高き場所より眺めて',
        屋台の裏路地から静かに: '静かな小径から',
      },
      mood: {
        ワクワクして心が躍った: '胸躍る夏の夜',
        切なく懐かしい気持ちになった: '懐かしき夏の調べ',
        静かで温かい気持ちに包まれた: '温もりに包まれて',
      },
    }

    // Create a contextual fallback poem
    const compositionLine =
      templates.composition[
        axisData.composition as keyof typeof templates.composition
      ] || '夏祭りの夜'
    const moodLine =
      templates.mood[axisData.mood as keyof typeof templates.mood] ||
      '心に響く想い'

    return `${compositionLine}
${axisData.elements}
${axisData.objects}の
美しい光景に
${moodLine}
この瞬間を
心に刻もう`
  }

  // Validate poetry content
  public validatePoetry(poem: string): boolean {
    return !!poem && poem.length > 10 && poem.length < 1000
  }
}
