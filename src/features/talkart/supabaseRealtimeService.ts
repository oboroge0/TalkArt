import { TalkArtArtwork, supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface SupabaseRealtimeEvent {
  type: 'new_artwork' | 'update_artwork' | 'delete_artwork'
  artwork?: TalkArtArtwork
}

export class SupabaseRealtimeGalleryService {
  private channel: RealtimeChannel | null = null
  private listeners: Set<(event: SupabaseRealtimeEvent) => void> = new Set()
  private enabled = true

  constructor() {
    // Check if Supabase is available
    if (!supabase) {
      this.enabled = false
      console.warn('Supabase client not initialized, realtime features disabled')
    }
  }

  connect() {
    if (!this.enabled || !supabase || this.channel) return

    try {
      // Subscribe to changes in the talkart_artworks table
      this.channel = supabase
        .channel('gallery_changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'talkart_artworks'
          },
          (payload) => {
            console.log('New artwork created:', payload.new)
            this.notifyListeners({
              type: 'new_artwork',
              artwork: payload.new as TalkArtArtwork
            })
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'talkart_artworks'
          },
          (payload) => {
            console.log('Artwork updated:', payload.new)
            this.notifyListeners({
              type: 'update_artwork',
              artwork: payload.new as TalkArtArtwork
            })
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'talkart_artworks'
          },
          (payload) => {
            console.log('Artwork deleted:', payload.old)
            this.notifyListeners({
              type: 'delete_artwork',
              artwork: payload.old as TalkArtArtwork
            })
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Connected to Supabase realtime')
          }
        })
    } catch (error) {
      console.error('Failed to connect to realtime:', error)
    }
  }

  disconnect() {
    if (this.channel && supabase) {
      supabase.removeChannel(this.channel)
      this.channel = null
      console.log('Disconnected from Supabase realtime')
    }
  }

  subscribe(listener: (event: SupabaseRealtimeEvent) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners(event: SupabaseRealtimeEvent) {
    this.listeners.forEach((listener) => {
      try {
        listener(event)
      } catch (error) {
        console.error('Listener error:', error)
      }
    })
  }

  isConnected(): boolean {
    return this.channel !== null
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
    if (!enabled) {
      this.disconnect()
    } else {
      this.connect()
    }
  }
}

// Singleton instance
export const supabaseRealtimeGalleryService = new SupabaseRealtimeGalleryService()