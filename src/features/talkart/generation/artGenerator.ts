import {
  ArtGenerationRequest,
  ArtGenerationResponse,
  ArtworkMetadata,
} from '@/features/talkart/types'

export interface ArtGeneratorConfig {
  apiKey?: string
  model?: string
  size?: string
  quality?: string
}

export class ArtGenerator {
  private config: ArtGeneratorConfig

  constructor(config?: ArtGeneratorConfig) {
    this.config = {
      model: 'dall-e-3',
      size: '1024x1024',
      quality: 'standard',
      ...config,
    }
  }

  // アート生成のメイン処理
  async generateArt(
    request: ArtGenerationRequest
  ): Promise<ArtGenerationResponse> {
    const startTime = Date.now()

    try {
      // OpenAI DALL-E APIを使用
      const imageUrl = await this.generateWithDallE(request)

      const generationTime = Date.now() - startTime

      const metadata: ArtworkMetadata = {
        generationTime,
        artStyle: 'japanese_festival_illustration',
        themes: this.extractThemes(request.conversationSummary),
        dimensions: {
          width: 1024,
          height: 1024,
        },
      }

      return {
        imageUrl,
        prompt: request.conversationSummary,
        generationTime,
        metadata,
      }
    } catch (error) {
      console.error('Art generation failed:', error)
      // フォールバック画像を返す
      return this.getFallbackArt(request)
    }
  }

  // DALL-E APIを使用した画像生成
  private async generateWithDallE(
    request: ArtGenerationRequest
  ): Promise<string> {
    const apiKey = this.config.apiKey || process.env.OPENAI_API_KEY

    if (!apiKey) {
      throw new Error('OpenAI API key is not configured')
    }

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        prompt: request.conversationSummary,
        n: 1,
        size: this.config.size,
        quality: this.config.quality,
        style: 'vivid',
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`DALL-E API error: ${error.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    return data.data[0].url
  }

  // テーマの抽出
  private extractThemes(summary: string): string[] {
    const themes: string[] = []

    // キーワードベースでテーマを抽出
    const keywords = {
      festival: ['祭り', 'まつり', 'festival'],
      food: ['かき氷', '焼きそば', 'りんご飴', '食べ物'],
      sound: ['太鼓', '風鈴', '音'],
      activity: ['金魚すくい', '花火', '浴衣'],
      emotion: ['懐かしい', '楽しい', '幸せ', '温かい'],
    }

    Object.entries(keywords).forEach(([theme, words]) => {
      if (words.some((word) => summary.includes(word))) {
        themes.push(theme)
      }
    })

    return themes
  }

  // フォールバック画像を返す
  private async getFallbackArt(
    request: ArtGenerationRequest
  ): Promise<ArtGenerationResponse> {
    // プレースホルダー画像のURL
    const placeholderUrl = `https://via.placeholder.com/1024x1024/6B46C1/FFFFFF?text=Summer+Festival+Memory`

    return {
      imageUrl: placeholderUrl,
      prompt: request.conversationSummary,
      generationTime: 0,
      metadata: {
        generationTime: 0,
        artStyle: 'placeholder',
        themes: ['fallback'],
        dimensions: {
          width: 1024,
          height: 1024,
        },
      },
    }
  }

  // 生成された画像の後処理（将来的な拡張用）
  async postProcessImage(imageUrl: string): Promise<string> {
    // 現在は何もしない
    // 将来的には画像の最適化、フィルター適用など
    return imageUrl
  }
}