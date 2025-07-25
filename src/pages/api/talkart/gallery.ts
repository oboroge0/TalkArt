import type { NextApiRequest, NextApiResponse } from 'next'
import { ApiResponse, GeneratedArtwork } from '@/features/talkart/types'

// メモリ内ストレージ（本番環境ではデータベースを使用）
let galleryItems: GeneratedArtwork[] = []

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    ApiResponse<{ artworks: GeneratedArtwork[]; total: number }>
  >
) {
  switch (req.method) {
    case 'GET':
      return handleGetGallery(req, res)
    case 'POST':
      return handleAddToGallery(req, res)
    default:
      return res.status(405).json({
        success: false,
        error: 'Method not allowed',
        timestamp: new Date(),
      })
  }
}

// ギャラリーアイテムを取得
async function handleGetGallery(
  req: NextApiRequest,
  res: NextApiResponse<
    ApiResponse<{ artworks: GeneratedArtwork[]; total: number }>
  >
) {
  try {
    const { limit = 50, offset = 0 } = req.query

    const limitNum = parseInt(limit as string, 10)
    const offsetNum = parseInt(offset as string, 10)

    // 最新のものから取得
    const sortedItems = [...galleryItems].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )

    const paginatedItems = sortedItems.slice(
      offsetNum,
      offsetNum + limitNum
    )

    return res.status(200).json({
      success: true,
      data: {
        artworks: paginatedItems,
        total: galleryItems.length,
      },
      timestamp: new Date(),
    })
  } catch (error) {
    console.error('Gallery fetch error:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch gallery items',
      timestamp: new Date(),
    })
  }
}

// ギャラリーに追加
async function handleAddToGallery(
  req: NextApiRequest,
  res: NextApiResponse<
    ApiResponse<{ artworks: GeneratedArtwork[]; total: number }>
  >
) {
  try {
    const artwork = req.body as GeneratedArtwork

    if (!artwork || !artwork.id || !artwork.imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'Invalid artwork data',
        timestamp: new Date(),
      })
    }

    // 重複チェック
    const exists = galleryItems.some((item) => item.id === artwork.id)
    if (!exists) {
      // createdAtが文字列で来た場合の対応
      if (typeof artwork.createdAt === 'string') {
        artwork.createdAt = new Date(artwork.createdAt)
      }
      
      galleryItems.push(artwork)

      // メモリ制限（最新100件のみ保持）
      if (galleryItems.length > 100) {
        galleryItems = galleryItems
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 100)
      }
    }

    return res.status(201).json({
      success: true,
      data: {
        artworks: galleryItems.slice(0, 10), // 最新10件を返す
        total: galleryItems.length,
      },
      timestamp: new Date(),
    })
  } catch (error) {
    console.error('Gallery add error:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to add artwork to gallery',
      timestamp: new Date(),
    })
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}