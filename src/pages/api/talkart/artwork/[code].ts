import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseArtStorage } from '@/features/talkart/supabaseArtStorage'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { code } = req.query

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Invalid share code' })
  }

  try {
    // Try to find by share code first
    let artwork = await supabaseArtStorage.getArtworkByShareCode(code)
    
    // If not found by share code, try by ID (for backward compatibility)
    if (!artwork) {
      artwork = await supabaseArtStorage.getArtwork(code)
    }

    if (!artwork) {
      return res.status(404).json({ error: 'Artwork not found' })
    }

    res.status(200).json(artwork)
  } catch (error) {
    console.error('Error fetching artwork:', error)
    res.status(500).json({ error: 'Failed to fetch artwork' })
  }
}