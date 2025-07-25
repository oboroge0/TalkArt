import { create } from 'zustand'
import {
  GalleryState,
  GalleryItem,
  GeneratedArtwork,
} from '@/features/talkart/types'

interface GalleryStore extends GalleryState {
  // アクション
  addArtwork: (artwork: GeneratedArtwork) => void
  setItems: (items: GalleryItem[]) => void
  setLoading: (loading: boolean) => void
  refreshGallery: () => Promise<void>
  clearGallery: () => void
}

const generateRandomPosition = () => ({
  x: Math.random() * 80 + 10, // 10-90%の範囲
  y: Math.random() * 70 + 15, // 15-85%の範囲
  rotation: (Math.random() - 0.5) * 30, // -15度から+15度
  scale: 0.9 + Math.random() * 0.2, // 0.9-1.1の範囲
})

export const useGalleryStore = create<GalleryStore>((set, get) => ({
  items: [],
  totalCount: 0,
  isLoading: false,
  lastUpdated: new Date(),

  addArtwork: (artwork: GeneratedArtwork) => {
    const { items } = get()
    const newItem: GalleryItem = {
      id: `gallery_${artwork.id}`,
      artwork,
      position: generateRandomPosition(),
      displayOrder: items.length,
    }

    set({
      items: [newItem, ...items],
      totalCount: items.length + 1,
      lastUpdated: new Date(),
    })
  },

  setItems: (items: GalleryItem[]) => {
    set({
      items,
      totalCount: items.length,
      lastUpdated: new Date(),
    })
  },

  setLoading: (loading: boolean) => {
    set({
      isLoading: loading,
    })
  },

  refreshGallery: async () => {
    const { setLoading } = get()
    setLoading(true)

    try {
      // APIからギャラリー情報を取得
      const response = await fetch('/api/talkart/gallery')
      const data = await response.json()

      if (data.success && data.artworks) {
        const galleryItems: GalleryItem[] = data.artworks.map(
          (artwork: GeneratedArtwork, index: number) => ({
            id: `gallery_${artwork.id}`,
            artwork,
            position: generateRandomPosition(),
            displayOrder: index,
          })
        )

        set({
          items: galleryItems,
          totalCount: galleryItems.length,
          lastUpdated: new Date(),
        })
      }
    } catch (error) {
      console.error('Failed to refresh gallery:', error)
    } finally {
      setLoading(false)
    }
  },

  clearGallery: () => {
    set({
      items: [],
      totalCount: 0,
      lastUpdated: new Date(),
    })
  },
}))
