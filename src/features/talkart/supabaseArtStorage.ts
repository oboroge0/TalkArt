import {
  supabase,
  ARTWORK_BUCKET,
  TalkArtArtwork,
  getPublicUrl,
} from '@/lib/supabase'
import { GeneratedArtwork } from './artGenerator'

export class SupabaseArtStorage {
  // Convert base64 to blob
  private base64ToBlob(base64: string, mimeType: string = 'image/png'): Blob {
    const byteCharacters = atob(base64.replace(/^data:image\/\w+;base64,/, ''))
    const byteNumbers = new Array(byteCharacters.length)

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }

    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
  }

  // Upload image to Supabase Storage
  async uploadImage(
    imageUrl: string,
    sessionId: string
  ): Promise<string | null> {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return null
    }

    try {
      console.log('Uploading image from URL:', imageUrl)

      // If it's a base64 image
      if (imageUrl.startsWith('data:image')) {
        const blob = this.base64ToBlob(imageUrl)
        const fileName = `${sessionId}_${Date.now()}.png`

        const { data, error } = await supabase.storage
          .from(ARTWORK_BUCKET)
          .upload(fileName, blob, {
            contentType: 'image/png',
            cacheControl: '3600',
            upsert: false,
          })

        if (error) {
          console.error('Error uploading image:', error)
          return null
        }

        return fileName
      } else {
        // If it's a URL, fetch it first
        const response = await fetch(imageUrl)
        const blob = await response.blob()
        const fileName = `${sessionId}_${Date.now()}.png`

        const { data, error } = await supabase.storage
          .from(ARTWORK_BUCKET)
          .upload(fileName, blob, {
            contentType: 'image/png',
            cacheControl: '3600',
            upsert: false,
          })

        if (error) {
          console.error('Error uploading image:', error)
          return null
        }

        return fileName
      }
    } catch (error) {
      console.error('Failed to upload image:', error)
      return null
    }
  }

  // Save artwork to database
  async saveArtwork(artwork: GeneratedArtwork): Promise<TalkArtArtwork | null> {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return null
    }

    try {
      console.log('Starting artwork save process...')

      // Upload image first
      const imagePath = await this.uploadImage(
        artwork.imageUrl,
        artwork.metadata.sessionId
      )
      console.log('Image upload result:', imagePath)

      if (!imagePath) {
        throw new Error('Failed to upload image')
      }

      // Save to database
      const { data, error } = await supabase
        .from('talkart_artworks')
        .insert({
          session_id: artwork.metadata.sessionId,
          image_url: imagePath,
          prompt: artwork.prompt,
          responses: [],
        })
        .select()
        .single()

      if (error) {
        console.error('Error saving artwork:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Failed to save artwork:', error)
      return null
    }
  }

  // Get artwork by ID
  async getArtwork(id: string): Promise<TalkArtArtwork | null> {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return null
    }

    try {
      const { data, error } = await supabase
        .from('talkart_artworks')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching artwork:', error)
        return null
      }

      // Get full image URL
      if (data && data.image_url) {
        data.image_url = getPublicUrl(data.image_url)
      }

      return data
    } catch (error) {
      console.error('Failed to get artwork:', error)
      return null
    }
  }

  // Get artwork by share code
  async getArtworkByShareCode(
    shareCode: string
  ): Promise<TalkArtArtwork | null> {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return null
    }

    try {
      const { data, error } = await supabase
        .from('talkart_artworks')
        .select('*')
        .eq('share_code', shareCode)
        .single()

      if (error) {
        console.error('Error fetching artwork by share code:', error)
        return null
      }

      // Get full image URL
      if (data && data.image_url) {
        data.image_url = getPublicUrl(data.image_url)
      }

      // Increment view count
      await this.incrementViewCount(data.id)

      return data
    } catch (error) {
      console.error('Failed to get artwork by share code:', error)
      return null
    }
  }

  // Get recent artworks for gallery
  async getRecentArtworks(limit: number = 50): Promise<TalkArtArtwork[]> {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return []
    }

    try {
      const { data, error } = await supabase
        .from('talkart_artworks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching recent artworks:', error)
        return []
      }

      // Get full image URLs
      return (data || []).map((artwork) => ({
        ...artwork,
        image_url: artwork.image_url ? getPublicUrl(artwork.image_url) : '',
      }))
    } catch (error) {
      console.error('Failed to get recent artworks:', error)
      return []
    }
  }

  // Increment view count
  private async incrementViewCount(artworkId: string): Promise<void> {
    if (!supabase) return

    try {
      await supabase.rpc('increment_view_count', { artwork_id: artworkId })
    } catch (error) {
      console.error('Failed to increment view count:', error)
    }
  }

  // Get gallery stats
  async getGalleryStats(): Promise<{ total: number; today: number }> {
    if (!supabase) {
      return { total: 0, today: 0 }
    }

    try {
      // Get total count
      const { count: total } = await supabase
        .from('talkart_artworks')
        .select('*', { count: 'exact', head: true })

      // Get today's count
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { count: todayCount } = await supabase
        .from('talkart_artworks')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString())

      return {
        total: total || 0,
        today: todayCount || 0,
      }
    } catch (error) {
      console.error('Failed to get gallery stats:', error)
      return { total: 0, today: 0 }
    }
  }
}

// Export singleton instance
export const supabaseArtStorage = new SupabaseArtStorage()
