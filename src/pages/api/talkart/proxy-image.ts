import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { imageUrl } = req.body

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' })
    }

    // Fetch the image from the URL
    const response = await fetch(imageUrl)

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type') || 'image/png'
    const buffer = await response.arrayBuffer()

    // Return the image as base64
    const base64 = Buffer.from(buffer).toString('base64')
    const dataUrl = `data:${contentType};base64,${base64}`

    res.status(200).json({
      dataUrl,
      contentType,
      size: buffer.byteLength,
    })
  } catch (error: any) {
    console.error('Image proxy error:', error)
    res.status(500).json({
      error: 'Failed to proxy image',
      message: error.message,
    })
  }
}

// Increase body size limit for large images
export const config = {
  api: {
    responseLimit: '10mb',
  },
}
