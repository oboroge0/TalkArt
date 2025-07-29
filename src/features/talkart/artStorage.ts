// TalkArt Artwork Storage Service
import { GeneratedArtwork } from './artGenerator'

export interface StoredArtwork extends GeneratedArtwork {
  id: string
  downloadUrl?: string
  thumbnailUrl?: string
  likes?: number
  featured?: boolean
}

export class ArtStorage {
  private readonly STORAGE_KEY = 'talkart_gallery'
  private readonly MAX_STORAGE_ITEMS = 100

  // Save artwork to local storage
  public async saveArtwork(artwork: GeneratedArtwork): Promise<StoredArtwork> {
    const storedArtwork: StoredArtwork = {
      ...artwork,
      id: this.generateId(),
      likes: 0,
      featured: false,
    }

    try {
      const gallery = this.getGallery()
      gallery.unshift(storedArtwork)

      // Keep only the latest MAX_STORAGE_ITEMS
      if (gallery.length > this.MAX_STORAGE_ITEMS) {
        gallery.splice(this.MAX_STORAGE_ITEMS)
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(gallery))
      return storedArtwork
    } catch (error) {
      console.error('Failed to save artwork:', error)
      throw error
    }
  }

  // Get all artworks from storage
  public getGallery(): StoredArtwork[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to load gallery:', error)
      return []
    }
  }

  // Get recent artworks
  public getRecentArtworks(limit: number = 20): StoredArtwork[] {
    const gallery = this.getGallery()
    return gallery.slice(0, limit)
  }

  // Get featured artworks
  public getFeaturedArtworks(): StoredArtwork[] {
    const gallery = this.getGallery()
    return gallery.filter((artwork) => artwork.featured)
  }

  // Update artwork (likes, featured status, etc.)
  public updateArtwork(id: string, updates: Partial<StoredArtwork>): boolean {
    try {
      const gallery = this.getGallery()
      const index = gallery.findIndex((artwork) => artwork.id === id)

      if (index === -1) return false

      gallery[index] = { ...gallery[index], ...updates }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(gallery))
      return true
    } catch (error) {
      console.error('Failed to update artwork:', error)
      return false
    }
  }

  // Delete artwork
  public deleteArtwork(id: string): boolean {
    try {
      const gallery = this.getGallery()
      const filtered = gallery.filter((artwork) => artwork.id !== id)

      if (filtered.length === gallery.length) return false

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered))
      return true
    } catch (error) {
      console.error('Failed to delete artwork:', error)
      return false
    }
  }

  // Clear all artworks
  public clearGallery(): void {
    localStorage.removeItem(this.STORAGE_KEY)
  }

  // Get gallery statistics
  public getGalleryStats() {
    const gallery = this.getGallery()
    const today = new Date().toDateString()

    const todayCount = gallery.filter(
      (artwork) => new Date(artwork.metadata.createdAt).toDateString() === today
    ).length

    return {
      total: gallery.length,
      today: todayCount,
      featured: gallery.filter((a) => a.featured).length,
      totalLikes: gallery.reduce((sum, a) => sum + (a.likes || 0), 0),
    }
  }

  // Export gallery data
  public exportGallery(): string {
    const gallery = this.getGallery()
    return JSON.stringify(gallery, null, 2)
  }

  // Import gallery data
  public importGallery(data: string): boolean {
    try {
      const gallery = JSON.parse(data)
      if (!Array.isArray(gallery)) return false

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(gallery))
      return true
    } catch (error) {
      console.error('Failed to import gallery:', error)
      return false
    }
  }

  // Generate unique ID
  private generateId(): string {
    return `artwork_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
