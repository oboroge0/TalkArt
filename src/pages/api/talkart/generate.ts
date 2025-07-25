import type { NextApiRequest, NextApiResponse } from 'next'
import { ArtGenerator } from '@/features/talkart/generation/artGenerator'
import { TalkArtAIAdapter } from '@/features/talkart/ai/aiAdapter'
import {
  ApiResponse,
  ArtGenerationRequest,
  ConversationResponse,
  GeneratedArtwork,
} from '@/features/talkart/types'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<GeneratedArtwork>>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date(),
    })
  }

  try {
    const { responses, sessionId } = req.body as {
      responses: ConversationResponse[]
      sessionId: string
    }

    if (!responses || !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: responses and sessionId',
        timestamp: new Date(),
      })
    }

    // AI処理：会話からプロンプトを生成
    const aiAdapter = new TalkArtAIAdapter()
    const { prompt, analysis, summary } =
      await aiAdapter.generateArtisticPrompt(responses)

    // アート生成リクエストを作成
    const artRequest: ArtGenerationRequest = {
      conversationSummary: prompt,
      style: analysis.artStyle,
    }

    // アート生成
    const generator = new ArtGenerator({
      apiKey: process.env.OPENAI_API_KEY,
    })
    const artResponse = await generator.generateArt(artRequest)

    // GeneratedArtworkオブジェクトを作成
    const artwork: GeneratedArtwork = {
      id: `art_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      imageUrl: artResponse.imageUrl,
      prompt: artResponse.prompt,
      metadata: {
        ...artResponse.metadata,
        themes: analysis.themes,
      },
      createdAt: new Date(),
      sessionId,
    }

    // 成功レスポンス
    return res.status(200).json({
      success: true,
      data: artwork,
      timestamp: new Date(),
    })
  } catch (error) {
    console.error('Art generation API error:', error)
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Internal server error during art generation',
      timestamp: new Date(),
    })
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}
