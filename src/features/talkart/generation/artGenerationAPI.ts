import {
  GeneratedArtwork,
  ConversationResponse,
} from '@/features/talkart/types'

interface ArtGenerationConfig {
  artStyle?: string
  colorPalette?: string
  resolution?: {
    width: number
    height: number
  }
}

interface GenerateArtworkRequest {
  sessionId: string
  responses: ConversationResponse[]
  config: ArtGenerationConfig
}

interface GenerateArtworkResponse {
  success: boolean
  artwork?: GeneratedArtwork
  error?: string
}

// アート生成APIのモック実装
export async function generateArtwork(
  request: GenerateArtworkRequest
): Promise<GenerateArtworkResponse> {
  try {
    // ここで実際のAPI呼び出しまたはAI生成ロジックを実装
    // 現在はモック実装

    await new Promise((resolve) => setTimeout(resolve, 3000)) // 3秒の遅延でシミュレート

    const mockArtwork: GeneratedArtwork = {
      id: `art_${Date.now()}`,
      sessionId: request.sessionId,
      imageUrl: `https://picsum.photos/seed/${request.sessionId}/800/800`,
      prompt: generatePromptFromResponses(request.responses),
      metadata: {
        artStyle: request.config.artStyle || 'watercolor',
        dimensions: {
          width: 800,
          height: 800,
        },
        generationTime: 3000,
        themes: extractThemesFromResponses(request.responses),
      },
      createdAt: new Date(),
    }

    return {
      success: true,
      artwork: mockArtwork,
    }
  } catch (error) {
    console.error('Art generation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// 回答からプロンプトを生成
function generatePromptFromResponses(
  responses: ConversationResponse[]
): string {
  const elements = responses.map((r) => r.selectedAnswer).join(', ')
  return `Japanese summer festival scene with ${elements}, watercolor style, nostalgic atmosphere`
}

// 回答からテーマを抽出
function extractThemesFromResponses(
  responses: ConversationResponse[]
): string[] {
  const themes: string[] = []

  responses.forEach((response) => {
    if (response.selectedAnswer.includes('花火')) themes.push('花火')
    if (response.selectedAnswer.includes('金魚')) themes.push('金魚すくい')
    if (response.selectedAnswer.includes('浴衣')) themes.push('浴衣')
    if (response.selectedAnswer.includes('屋台')) themes.push('屋台')
    if (response.selectedAnswer.includes('太鼓')) themes.push('太鼓')
  })

  return [...new Set(themes)] // 重複を削除
}
