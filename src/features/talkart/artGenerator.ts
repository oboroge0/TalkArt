// TalkArt Art Generation Service
import { ConversationResponse } from './questionFlowManager'

export interface ArtGenerationConfig {
  apiKey?: string
  apiEndpoint?: string
  model?: string
  timeout?: number
}

export interface ArtPrompt {
  basePrompt: string
  style: string
  themes: string[]
  elements: string[]
  mood: string
}

export interface GeneratedArtwork {
  imageUrl: string
  prompt: string
  metadata: {
    createdAt: Date
    sessionId: string
    generationTime: number
    style: string
    themes: string[]
  }
}

export class ArtGenerator {
  private config: ArtGenerationConfig

  constructor(config: ArtGenerationConfig = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.NEXT_PUBLIC_ART_API_KEY,
      apiEndpoint:
        config.apiEndpoint || process.env.NEXT_PUBLIC_ART_API_ENDPOINT,
      model: config.model || 'stable-diffusion-xl',
      timeout: config.timeout || 30000,
    }
  }

  // Convert conversation responses to art prompt
  public createPromptFromResponses(
    responses: ConversationResponse[]
  ): ArtPrompt {
    const elements: string[] = []
    const themes: string[] = ['夏祭り', 'Japanese summer festival']
    let mood = 'nostalgic and warm'

    // Analyze responses to build prompt elements
    responses.forEach((response) => {
      const answer = response.selectedAnswer.toLowerCase()

      // Question 1: Festival memory
      if (
        response.questionId === 'festival_memory' ||
        response.question.includes('印象的')
      ) {
        if (answer.includes('花火') || answer.includes('浴衣')) {
          elements.push('fireworks in night sky', 'people in yukata')
          themes.push('花火', 'fireworks')
        }
        if (answer.includes('屋台') || answer.includes('かき氷')) {
          elements.push('festival food stalls', 'shaved ice', 'lanterns')
          themes.push('屋台', 'food stalls')
        }
        if (answer.includes('お神輿') || answer.includes('太鼓')) {
          elements.push('mikoshi parade', 'taiko drums', 'traditional festival')
          themes.push('お神輿', 'traditional')
        }
      }

      // Question 2: Special moment
      if (
        response.questionId === 'favorite_moment' ||
        response.question.includes('心に残')
      ) {
        if (answer.includes('友達')) {
          elements.push('group of friends', 'joyful atmosphere')
          mood = 'joyful and energetic'
        }
        if (answer.includes('家族')) {
          elements.push('family gathering', 'warm atmosphere')
          mood = 'warm and heartfelt'
        }
        if (answer.includes('一人')) {
          elements.push('solitary figure', 'contemplative mood')
          mood = 'serene and contemplative'
        }
      }

      // Question 3: Emotion
      if (
        response.questionId === 'emotion' ||
        response.question.includes('気持ち')
      ) {
        if (answer.includes('ワクワク') || answer.includes('楽しかった')) {
          mood = 'vibrant and exciting'
          elements.push('bright colors', 'dynamic composition')
        }
        if (answer.includes('懐かしく') || answer.includes('温かかった')) {
          mood = 'nostalgic and warm'
          elements.push('soft lighting', 'warm colors')
        }
        if (answer.includes('神秘的') || answer.includes('心が震えた')) {
          mood = 'mystical and awe-inspiring'
          elements.push('ethereal lighting', 'magical atmosphere')
        }
      }
    })

    // Build the final prompt for DALL-E 3
    const basePrompt = `A beautiful watercolor painting in traditional Japanese art style depicting a summer festival (夏祭り) scene. 
      The painting includes: ${elements.join(', ')}. 
      The atmosphere is ${mood}, with soft brush strokes and delicate color transitions typical of Japanese watercolor art. 
      Warm summer evening lighting with paper lanterns glowing softly in the background. 
      Style: Traditional Japanese watercolor painting with subtle gradients and ethereal quality.`

    return {
      basePrompt,
      style: 'watercolor Japanese art',
      themes,
      elements,
      mood,
    }
  }

  // Generate artwork using AI service
  public async generateArtwork(
    responses: ConversationResponse[],
    sessionId: string
  ): Promise<GeneratedArtwork> {
    const startTime = Date.now()
    const artPrompt = this.createPromptFromResponses(responses)

    try {
      // Use Next.js API route
      const response = await fetch('/api/talkart/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: artPrompt.basePrompt,
          style: artPrompt.style,
          sessionId,
        }),
      })

      if (!response.ok) {
        throw new Error(`Art generation failed: ${response.statusText}`)
      }

      const data = await response.json()

      return {
        imageUrl: data.imageUrl,
        prompt: artPrompt.basePrompt,
        metadata: {
          createdAt: new Date(),
          sessionId,
          generationTime: Date.now() - startTime,
          style: artPrompt.style,
          themes: artPrompt.themes,
        },
      }
    } catch (error) {
      console.error('Art generation error:', error)
      throw error
    }
  }

  // Validate generated artwork
  public async validateArtwork(imageUrl: string): Promise<boolean> {
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' })
      return response.ok
    } catch {
      return false
    }
  }
}
