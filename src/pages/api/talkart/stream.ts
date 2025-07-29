import { NextApiRequest, NextApiResponse } from 'next'
import { StoredArtwork } from '@/features/talkart/artStorage'

// In-memory storage for demo purposes
// In production, this would be replaced with a proper pub/sub system
const clients = new Set<NextApiResponse>()
const recentArtworks: StoredArtwork[] = []

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // SSE setup
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    })

    // Send initial connection message
    res.write('data: {"type":"connected"}\n\n')

    // Add client to the set
    clients.add(res)

    // Send recent artworks if any
    if (recentArtworks.length > 0) {
      res.write(
        `data: ${JSON.stringify({
          type: 'recent',
          artworks: recentArtworks.slice(-5), // Last 5 artworks
        })}\n\n`
      )
    }

    // Keep connection alive
    const keepAlive = setInterval(() => {
      res.write('data: {"type":"ping"}\n\n')
    }, 30000)

    // Clean up on disconnect
    req.on('close', () => {
      clearInterval(keepAlive)
      clients.delete(res)
    })
  } else if (req.method === 'POST') {
    // Broadcast new artwork to all connected clients
    const artwork: StoredArtwork = req.body

    if (!artwork || !artwork.id) {
      return res.status(400).json({ error: 'Invalid artwork data' })
    }

    // Store in recent artworks
    recentArtworks.push(artwork)
    if (recentArtworks.length > 20) {
      recentArtworks.shift() // Keep only last 20
    }

    // Broadcast to all connected clients
    const message = JSON.stringify({
      type: 'new_artwork',
      artwork,
    })

    clients.forEach((client) => {
      client.write(`data: ${message}\n\n`)
    })

    res.status(200).json({ success: true, clients: clients.size })
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}

// Disable body parsing for SSE
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}
