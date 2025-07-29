// API Route for TalkArt image generation
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { prompt, style, sessionId } = req.body

    // Validate request
    if (!prompt || !sessionId) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Check for API configuration
    const apiKey =
      process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_ART_API_KEY
    const apiEndpoint = process.env.NEXT_PUBLIC_ART_API_ENDPOINT || 'dalle3'

    if (!apiKey || !apiEndpoint) {
      // Return demo response if no API configured
      console.log('Art generation request:', { prompt, style })

      return res.status(200).json({
        imageUrl: '/images/placeholder-artwork.jpg',
        prompt,
        metadata: {
          createdAt: new Date().toISOString(),
          sessionId,
          generationTime: 2000,
          style: style || 'watercolor',
          demo: true,
        },
      })
    }

    // Check if using DALL-E 3
    if (apiEndpoint === 'dalle3') {
      // Use OpenAI DALL-E 3 API
      const response = await fetch(
        'https://api.openai.com/v1/images/generations',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: prompt,
            n: 1,
            size: '1024x1024',
            quality: 'standard',
            style: 'vivid',
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(
          `DALL-E 3 error: ${error.error?.message || response.statusText}`
        )
      }

      const data = await response.json()

      return res.status(200).json({
        imageUrl: data.data[0].url,
        prompt: data.data[0].revised_prompt || prompt,
        metadata: {
          createdAt: new Date().toISOString(),
          sessionId,
          generationTime: Date.now(),
          style: style || 'watercolor',
          model: 'dall-e-3',
        },
      })
    } else {
      // Call other image generation API
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          prompt,
          negative_prompt: 'low quality, blurry, distorted',
          width: 512,
          height: 512,
          num_inference_steps: 30,
          guidance_scale: 7.5,
          style_preset: style || 'watercolor',
        }),
      })

      if (!response.ok) {
        throw new Error(`Generation API error: ${response.statusText}`)
      }

      const data = await response.json()

      return res.status(200).json({
        imageUrl: data.images[0].url,
        prompt,
        metadata: {
          createdAt: new Date().toISOString(),
          sessionId,
          generationTime: Date.now(),
          style: style || 'watercolor',
        },
      })
    }
  } catch (error: any) {
    console.error('Art generation error:', error)
    return res.status(500).json({
      error: 'Failed to generate artwork',
      message: error.message,
    })
  }
}
