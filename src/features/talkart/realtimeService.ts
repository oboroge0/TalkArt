import { StoredArtwork } from './artStorage'

export interface RealtimeEvent {
  type: 'connected' | 'new_artwork' | 'recent' | 'ping'
  artwork?: StoredArtwork
  artworks?: StoredArtwork[]
}

export class RealtimeGalleryService {
  private eventSource: EventSource | null = null
  private listeners: Set<(event: RealtimeEvent) => void> = new Set()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private isConnecting = false
  private enabled = true

  constructor() {
    // Check if SSE is supported
    if (typeof window !== 'undefined' && typeof EventSource !== 'undefined') {
      this.enabled = true
    } else {
      this.enabled = false
      console.warn('Server-Sent Events not supported')
    }
  }

  connect() {
    if (!this.enabled || this.isConnecting || this.eventSource) return

    this.isConnecting = true

    try {
      this.eventSource = new EventSource('/api/talkart/stream')

      this.eventSource.onopen = () => {
        console.log('SSE connection opened')
        this.reconnectAttempts = 0
        this.isConnecting = false
      }

      this.eventSource.onmessage = (event) => {
        try {
          const data: RealtimeEvent = JSON.parse(event.data)
          this.notifyListeners(data)
        } catch (error) {
          console.error('Failed to parse SSE message:', error)
        }
      }

      this.eventSource.onerror = (error) => {
        console.error('SSE error:', error)
        this.isConnecting = false

        if (this.eventSource?.readyState === EventSource.CLOSED) {
          this.handleReconnect()
        }
      }
    } catch (error) {
      console.error('Failed to create EventSource:', error)
      this.isConnecting = false
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      this.enabled = false
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    console.log(
      `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`
    )

    setTimeout(() => {
      this.disconnect()
      this.connect()
    }, delay)
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
    this.isConnecting = false
  }

  subscribe(callback: (event: RealtimeEvent) => void): () => void {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }

  private notifyListeners(event: RealtimeEvent) {
    this.listeners.forEach((listener) => {
      try {
        listener(event)
      } catch (error) {
        console.error('Listener error:', error)
      }
    })
  }

  // Notify server about new artwork
  async notifyNewArtwork(artwork: StoredArtwork) {
    try {
      const response = await fetch('/api/talkart/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(artwork),
      })

      if (!response.ok) {
        throw new Error(`Failed to notify: ${response.statusText}`)
      }

      const result = await response.json()
      console.log(`Notified ${result.clients} clients about new artwork`)
    } catch (error) {
      console.error('Failed to notify new artwork:', error)
    }
  }

  isConnected(): boolean {
    if (typeof EventSource === 'undefined') {
      return false
    }
    return this.eventSource?.readyState === EventSource.OPEN
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
export const realtimeGalleryService = new RealtimeGalleryService()
