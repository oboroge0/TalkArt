// TalkArt Art Generation Service
import { ConversationResponse } from './questionFlowManager'
import { PoetryGenerator, GeneratedPoetry } from './poetryGenerator'
import { ArtworkComposer } from '@/utils/artworkComposer'

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
  poetry?: GeneratedPoetry // New: AI-generated poetry for exhibition
  compositeImageUrl?: string // New: Final composed image with poetry and logo
  metadata: {
    createdAt: Date
    sessionId: string
    generationTime: number
    style: string
    themes: string[]
    questionMode?: 'classic' | 'multilayer' // Track which system was used
    axisData?: {
      // For multilayer questions
      composition: string
      elements: string
      objects: string
      mood: string
    }
    hasComposite?: boolean // Track if composite was created
  }
}

export class ArtGenerator {
  private config: ArtGenerationConfig
  private poetryGenerator: PoetryGenerator

  constructor(config: ArtGenerationConfig = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.NEXT_PUBLIC_ART_API_KEY,
      apiEndpoint:
        config.apiEndpoint || process.env.NEXT_PUBLIC_ART_API_ENDPOINT,
      model: config.model || 'stable-diffusion-xl',
      timeout: config.timeout || 30000,
    }

    // Initialize poetry generator for AI exhibition
    this.poetryGenerator = new PoetryGenerator({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    })
  }

  // Analyze responses to determine question system type
  private determineQuestionMode(
    responses: ConversationResponse[]
  ): 'classic' | 'multilayer' {
    // Check if any response has axis information (multilayer system)
    return responses.some((response) => response.axis)
      ? 'multilayer'
      : 'classic'
  }

  // Extract axis data from multilayer responses
  private extractAxisData(responses: ConversationResponse[]) {
    const axisData = {
      composition: '',
      elements: '',
      objects: '',
      mood: '',
    }

    responses.forEach((response) => {
      if (response.axis && response.selectedValue) {
        axisData[response.axis] = response.selectedValue
      }
    })

    return axisData
  }

  // Create prompt from multilayer responses (new 4-axis system)
  private createMultilayerPrompt(responses: ConversationResponse[]): ArtPrompt {
    const axisData = this.extractAxisData(responses)
    const elements: string[] = []
    const themes: string[] = ['夏祭り', 'Japanese summer festival']
    let mood = 'nostalgic and warm'

    // Map axis values to prompt elements
    const compositionMap = {
      front_view: {
        elements: ['frontal perspective of festival', 'central composition'],
        description: 'viewed from the front of the festival',
      },
      bridge_view: {
        elements: [
          "elevated bird's eye perspective",
          'panoramic festival view',
        ],
        description: 'viewed from above, looking down from a bridge',
      },
      backstreet_view: {
        elements: ['quiet side street perspective', 'intimate festival corner'],
        description: 'viewed from a quiet backstreet corner',
      },
    }

    const elementsMap = {
      with_friends: {
        elements: ['group of friends', 'joyful social gathering'],
        mood: 'vibrant and energetic',
      },
      with_family: {
        elements: ['family gathering', 'warm family scene'],
        mood: 'warm and heartfelt',
      },
      alone: {
        elements: ['solitary figure', 'contemplative solitude'],
        mood: 'serene and contemplative',
      },
    }

    const objectsMap = {
      fireworks_yukata: {
        elements: [
          'spectacular fireworks in night sky',
          'people in beautiful yukata',
        ],
        themes: ['花火', 'fireworks', 'yukata'],
      },
      goldfish_scooping: {
        elements: [
          'festival food stalls',
          'goldfish scooping game',
          'paper lanterns',
        ],
        themes: ['屋台', 'goldfish scooping', 'food stalls'],
      },
      festival_music: {
        elements: [
          'taiko drums',
          'traditional festival musicians',
          'mikoshi parade',
        ],
        themes: ['お囃子', 'traditional music', 'festival sounds'],
      },
    }

    const moodMap = {
      excited: {
        mood: 'vibrant and exciting',
        elements: ['bright colors', 'dynamic energy', 'celebratory atmosphere'],
      },
      nostalgic: {
        mood: 'nostalgic and bittersweet',
        elements: ['soft golden lighting', 'dreamy atmosphere', 'wistful mood'],
      },
      peaceful: {
        mood: 'serene and peaceful',
        elements: ['gentle lighting', 'calm atmosphere', 'tranquil mood'],
      },
    }

    // Build elements and mood from axis data
    const composition =
      compositionMap[axisData.composition as keyof typeof compositionMap]
    const elementData =
      elementsMap[axisData.elements as keyof typeof elementsMap]
    const objectData = objectsMap[axisData.objects as keyof typeof objectsMap]
    const moodData = moodMap[axisData.mood as keyof typeof moodMap]

    if (composition) elements.push(...composition.elements)
    if (elementData) {
      elements.push(...elementData.elements)
      mood = elementData.mood
    }
    if (objectData) {
      elements.push(...objectData.elements)
      themes.push(...objectData.themes)
    }
    if (moodData) {
      mood = moodData.mood
      elements.push(...moodData.elements)
    }

    // Build the final prompt for DALL-E 3 with multilayer context
    const basePrompt = `A beautiful vertical portrait watercolor painting in traditional Japanese art style depicting a summer festival (夏祭り) scene. 
      The scene is ${composition?.description || 'beautifully composed'} with ${elements.join(', ')}. 
      The composition fills the entire vertical frame from top to bottom, creating depth and filling the tall canvas completely. 
      The atmosphere is ${mood}, with soft brush strokes and delicate color transitions typical of Japanese watercolor art. 
      Warm summer evening lighting with paper lanterns glowing softly throughout the scene. 
      Style: Traditional Japanese watercolor painting with subtle gradients and ethereal quality, composed for vertical portrait format.`

    return {
      basePrompt,
      style: 'watercolor Japanese art',
      themes,
      elements,
      mood,
    }
  }

  // Create prompt from classic responses (backward compatibility)
  private createClassicPrompt(responses: ConversationResponse[]): ArtPrompt {
    const elements: string[] = []
    const themes: string[] = ['夏祭り', 'Japanese summer festival']
    let mood = 'nostalgic and warm'

    // Original classic logic (preserved for backward compatibility)
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
    const basePrompt = `A beautiful vertical portrait watercolor painting in traditional Japanese art style depicting a summer festival (夏祭り) scene. 
      The composition fills the entire vertical frame from top to bottom with ${elements.join(', ')}. 
      The scene extends vertically showing festival activities from foreground to background, creating depth and filling the tall canvas completely. 
      The atmosphere is ${mood}, with soft brush strokes and delicate color transitions typical of Japanese watercolor art. 
      Warm summer evening lighting with paper lanterns glowing softly throughout the scene. 
      Style: Traditional Japanese watercolor painting with subtle gradients and ethereal quality, composed for vertical portrait format.`

    return {
      basePrompt,
      style: 'watercolor Japanese art',
      themes,
      elements,
      mood,
    }
  }

  // Convert conversation responses to art prompt (supports both systems)
  public createPromptFromResponses(
    responses: ConversationResponse[]
  ): ArtPrompt {
    const questionMode = this.determineQuestionMode(responses)

    console.log(`🎨 Creating prompt using ${questionMode} question system`)

    return questionMode === 'multilayer'
      ? this.createMultilayerPrompt(responses)
      : this.createClassicPrompt(responses)
  }

  // Generate artwork using AI service with poetry integration
  public async generateArtwork(
    responses: ConversationResponse[],
    sessionId: string
  ): Promise<GeneratedArtwork> {
    const startTime = Date.now()
    const artPrompt = this.createPromptFromResponses(responses)
    const questionMode = this.determineQuestionMode(responses)

    try {
      console.log(`🎨 Generating artwork with ${questionMode} system`)

      // Generate poetry in parallel with artwork for AI exhibition
      const poetryPromise = this.poetryGenerator
        .generatePoetry(responses, sessionId)
        .catch((error) => {
          console.warn(
            '⚠️ Poetry generation failed, continuing without:',
            error
          )
          return null
        })

      // Generate artwork using DALL-E 3
      const artworkPromise = fetch('/api/talkart/generate', {
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

      // Wait for both processes
      const [artworkResponse, poetry] = await Promise.all([
        artworkPromise,
        poetryPromise,
      ])

      if (!artworkResponse.ok) {
        throw new Error(`Art generation failed: ${artworkResponse.statusText}`)
      }

      const artworkData = await artworkResponse.json()

      // Prepare metadata with question mode and axis data
      const metadata = {
        createdAt: new Date(),
        sessionId,
        generationTime: Date.now() - startTime,
        style: artPrompt.style,
        themes: artPrompt.themes,
        questionMode,
      }

      // Add axis data for multilayer questions
      if (questionMode === 'multilayer') {
        ;(metadata as any).axisData = this.extractAxisData(responses)
      }

      const artwork: GeneratedArtwork = {
        imageUrl: artworkData.imageUrl,
        prompt: artPrompt.basePrompt,
        metadata,
      }

      // Add poetry if generated successfully (for AI exhibition)
      if (poetry) {
        artwork.poetry = poetry
        console.log('✅ Generated artwork with AI poetry for exhibition')

        // Create composite image with poetry embedded
        try {
          console.log('🎨 Starting artwork composition process...')
          const compositeResult = await ArtworkComposer.composeArtwork({
            imageUrl: artworkData.imageUrl,
            poetry: poetry.poem,
            logoUrl: '/images/logo.png', // Add logo to composite
            sessionId,
          })

          // Verify composition was actually successful (data URL vs original URL)
          const isActualComposite =
            compositeResult.compositeImageUrl.startsWith('data:image/')

          if (isActualComposite) {
            artwork.compositeImageUrl = compositeResult.compositeImageUrl
            artwork.metadata.hasComposite = true
            console.log(
              '✅ Successfully created composite artwork with embedded poetry'
            )
          } else {
            console.warn(
              '⚠️ Composition returned original URL, marking as failed'
            )
            artwork.metadata.hasComposite = false
          }
        } catch (compositeError) {
          console.error(
            '❌ Failed to create composite artwork:',
            compositeError
          )
          artwork.metadata.hasComposite = false
        }
      } else {
        console.log('⚠️ Generated artwork without poetry (fallback)')
        artwork.metadata.hasComposite = false
      }

      return artwork
    } catch (error) {
      console.error('❌ Art generation error:', error)
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
