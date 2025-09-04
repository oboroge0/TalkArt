// Artwork Composer - Combines image, poetry, and logo into final artwork
export interface CompositeArtworkConfig {
  imageUrl: string
  poetry?: string
  logoUrl?: string
  sessionId: string
}

export interface CompositeArtwork {
  compositeImageUrl: string
  metadata: {
    originalImageUrl: string
    hasPoetry: boolean
    hasLogo: boolean
    sessionId: string
    createdAt: Date
  }
}

export class ArtworkComposer {
  // Create composite artwork with poetry and logo
  public static async composeArtwork(
    config: CompositeArtworkConfig
  ): Promise<CompositeArtwork> {
    const startTime = Date.now()

    try {
      console.log('🎨 Starting artwork composition:', {
        hasImage: !!config.imageUrl,
        hasPoetry: !!config.poetry,
        hasLogo: !!config.logoUrl,
      })

      // Create canvas
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Failed to get canvas context')
      }

      // Load original image via proxy to avoid CORS issues
      console.log('🔄 Fetching image via proxy to avoid CORS...')
      const originalImage = await this.loadImageViaProxy(config.imageUrl)

      // Set canvas size to match image (DALL-E 3 portrait: 1024x1792)
      canvas.width = originalImage.width
      canvas.height = originalImage.height

      // Draw original image
      ctx.drawImage(originalImage, 0, 0)

      // Add poetry overlay if available
      if (config.poetry) {
        await this.addPoetryOverlay(
          ctx,
          config.poetry,
          canvas.width,
          canvas.height
        )
      }

      // Add logo if available
      if (config.logoUrl) {
        try {
          console.log('🏷️ Loading logo:', config.logoUrl)
          const logoImage = await this.loadImage(config.logoUrl)
          this.addLogoOverlay(ctx, logoImage, canvas.width, canvas.height)
          console.log('✅ Logo added successfully')
        } catch (logoError) {
          console.warn('⚠️ Failed to load logo (non-critical):', logoError)
          // Continue without logo
        }
      }

      // Convert to data URL
      const compositeImageUrl = canvas.toDataURL('image/png', 0.95)

      console.log(
        '✅ Artwork composition completed in',
        Date.now() - startTime,
        'ms'
      )

      return {
        compositeImageUrl,
        metadata: {
          originalImageUrl: config.imageUrl,
          hasPoetry: !!config.poetry,
          hasLogo: !!config.logoUrl,
          sessionId: config.sessionId,
          createdAt: new Date(),
        },
      }
    } catch (error) {
      console.error('❌ Artwork composition failed:', error)

      // Return original image as fallback
      return {
        compositeImageUrl: config.imageUrl,
        metadata: {
          originalImageUrl: config.imageUrl,
          hasPoetry: false,
          hasLogo: false,
          sessionId: config.sessionId,
          createdAt: new Date(),
        },
      }
    }
  }

  // Load image via proxy to avoid CORS issues
  private static async loadImageViaProxy(
    url: string
  ): Promise<HTMLImageElement> {
    try {
      console.log('🔄 Fetching image via proxy:', url.substring(0, 60) + '...')

      // Use existing proxy-image API
      const proxyResponse = await fetch('/api/talkart/proxy-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: url }),
      })

      if (!proxyResponse.ok) {
        throw new Error(`Proxy fetch failed: ${proxyResponse.status}`)
      }

      const { dataUrl } = await proxyResponse.json()
      console.log('✅ Image fetched via proxy, size:', dataUrl.length)

      // Load image from data URL
      return this.loadImageFromDataUrl(dataUrl)
    } catch (error) {
      console.error('❌ Proxy image load failed:', error)
      // Fallback to direct load
      console.log('🔄 Falling back to direct image load...')
      return this.loadImage(url)
    }
  }

  // Load image from data URL
  private static loadImageFromDataUrl(
    dataUrl: string
  ): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()

      img.onload = () => {
        console.log('✅ Image loaded from data URL:', {
          width: img.width,
          height: img.height,
        })
        resolve(img)
      }

      img.onerror = (error) => {
        console.error('❌ Data URL image load failed:', error)
        reject(new Error(`Failed to load image from data URL: ${error}`))
      }

      img.src = dataUrl
    })
  }

  // Load image from URL with detailed error logging (fallback method)
  private static loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => {
        console.log('✅ Direct image loaded:', {
          url: url.substring(0, 60) + '...',
          width: img.width,
          height: img.height,
        })
        resolve(img)
      }

      img.onerror = (error) => {
        console.error('❌ Direct image load failed:', {
          url: url.substring(0, 60) + '...',
          error,
          crossOrigin: img.crossOrigin,
        })
        reject(new Error(`Failed to load image: ${url} - ${error}`))
      }

      img.src = url
    })
  }

  // Add poetry overlay to canvas
  private static async addPoetryOverlay(
    ctx: CanvasRenderingContext2D,
    poetry: string,
    canvasWidth: number,
    canvasHeight: number
  ): Promise<void> {
    try {
      // Create semi-transparent overlay at top-left for poetry
      const overlayHeight = Math.min(canvasHeight * 0.15, 120) // 15% of height or max 120px for 3 lines
      const overlayY = 20 // Top margin
      const overlayX = 20 // Left margin
      const overlayWidth = canvasWidth * 0.67 - 40 // 2/3 of width minus margins

      // Background gradient for top-left box
      const gradient = ctx.createLinearGradient(
        overlayX,
        overlayY,
        overlayX,
        overlayY + overlayHeight
      )
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)')
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)')

      ctx.fillStyle = gradient
      ctx.fillRect(overlayX, overlayY, overlayWidth, overlayHeight)

      // Poetry text styling (left-aligned)
      const fontSize = Math.max(16, canvasWidth * 0.025) // Responsive font size
      ctx.font = `${fontSize}px 'Noto Sans JP', '游明朝', 'Yu Mincho', serif`
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'

      // Add text shadow for better readability
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
      ctx.shadowBlur = 4
      ctx.shadowOffsetX = 1
      ctx.shadowOffsetY = 1

      // Split poetry into lines and draw (limit to 3 lines for display)
      const lines = poetry
        .split('\n')
        .filter((line) => line.trim())
        .slice(0, 3) // Max 3 lines
      const lineHeight = fontSize * 1.4
      const totalTextHeight = lines.length * lineHeight
      const textPadding = 15
      const startY = overlayY + (overlayHeight - totalTextHeight) / 2
      const startX = overlayX + textPadding

      lines.forEach((line, index) => {
        const y = startY + index * lineHeight
        ctx.fillText(line.trim(), startX, y)
      })

      // Reset shadow
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0

      // Add decorative elements
      this.addPoetryDecorations(
        ctx,
        overlayX,
        overlayY,
        overlayWidth,
        overlayHeight
      )
    } catch (error) {
      console.warn('⚠️ Failed to add poetry overlay:', error)
    }
  }

  // Add decorative elements around poetry box
  private static addPoetryDecorations(
    ctx: CanvasRenderingContext2D,
    overlayX: number,
    overlayY: number,
    overlayWidth: number,
    overlayHeight: number
  ): void {
    try {
      // Decorative border for the poetry box
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.lineWidth = 2

      // Rounded rectangle border
      const borderRadius = 8
      ctx.beginPath()
      ctx.roundRect(
        overlayX,
        overlayY,
        overlayWidth,
        overlayHeight,
        borderRadius
      )
      ctx.stroke()

      // Small accent dots at corners
      const dotSize = 3
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'

      // Top left dot
      ctx.beginPath()
      ctx.arc(overlayX + 10, overlayY + 10, dotSize, 0, 2 * Math.PI)
      ctx.fill()

      // Top right dot
      ctx.beginPath()
      ctx.arc(
        overlayX + overlayWidth - 10,
        overlayY + 10,
        dotSize,
        0,
        2 * Math.PI
      )
      ctx.fill()
    } catch (error) {
      console.warn('⚠️ Failed to add poetry decorations:', error)
    }
  }

  // Add logo overlay to canvas
  private static addLogoOverlay(
    ctx: CanvasRenderingContext2D,
    logoImage: HTMLImageElement,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    try {
      // Logo size (20% of canvas width)
      const logoDisplayWidth = canvasWidth * 0.2
      const logoAspectRatio = logoImage.height / logoImage.width
      const logoDisplayHeight = logoDisplayWidth * logoAspectRatio

      // Position: bottom-right corner with margin
      const logoX = canvasWidth - logoDisplayWidth - 20
      const logoY = canvasHeight - logoDisplayHeight - 20

      // Set logo opacity
      ctx.save()
      ctx.globalAlpha = 0.85

      // Draw logo
      ctx.drawImage(
        logoImage,
        logoX,
        logoY,
        logoDisplayWidth,
        logoDisplayHeight
      )

      ctx.restore()

      console.log('✅ Logo overlay added successfully')
    } catch (error) {
      console.warn('⚠️ Failed to add logo overlay:', error)
    }
  }
}
