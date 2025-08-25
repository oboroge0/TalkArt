// Logo composition utility for TalkArt images
export class LogoComposer {
  private static logoCache: HTMLImageElement | null = null

  // Load logo image (cached)
  private static async loadLogo(): Promise<HTMLImageElement> {
    if (this.logoCache) {
      console.log('📦 Using cached logo')
      return this.logoCache
    }

    console.log('🔄 Loading logo from /images/logo.png')
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        console.log(
          '✅ Logo loaded successfully:',
          img.width + 'x' + img.height
        )
        this.logoCache = img
        resolve(img)
      }
      img.onerror = (error) => {
        console.error('❌ Failed to load logo:', error)
        reject(error)
      }
      img.src = '/images/logo.png'
    })
  }

  // Compose logo onto generated image
  public static async addLogoToImage(imageUrl: string): Promise<string> {
    try {
      console.log('🎨 Starting logo composition for:', imageUrl)

      // Load both images
      console.log('📥 Loading original image and logo...')
      const [originalImage, logoImage] = await Promise.all([
        this.loadImageFromUrl(imageUrl),
        this.loadLogo(),
      ])

      console.log('✅ Images loaded successfully:', {
        originalSize: `${originalImage.width}x${originalImage.height}`,
        logoSize: `${logoImage.width}x${logoImage.height}`,
      })

      // Create canvas
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas context not available')

      // Set canvas size to match original image
      canvas.width = originalImage.width
      canvas.height = originalImage.height

      // Draw original image
      ctx.drawImage(originalImage, 0, 0)

      // Calculate logo size (8% of image width, maintain aspect ratio)
      const logoDisplayWidth = canvas.width * 0.08
      const logoAspectRatio = logoImage.height / logoImage.width
      const logoDisplayHeight = logoDisplayWidth * logoAspectRatio

      // Position: bottom-right with 20px margin
      const logoX = canvas.width - logoDisplayWidth - 20
      const logoY = canvas.height - logoDisplayHeight - 20

      // Add subtle shadow for better visibility
      ctx.save()
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
      ctx.shadowBlur = 4
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2

      // Set logo opacity (85% for subtle effect)
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

      // Convert to base64
      const composedImageUrl = canvas.toDataURL('image/png', 0.95)
      console.log('🎉 Logo composition completed successfully!')
      console.log('📊 Final image size:', composedImageUrl.length, 'characters')

      return composedImageUrl
    } catch (error) {
      console.error('❌ Failed to add logo to image:', error)
      console.log('🔄 Returning original image as fallback')
      // Return original image if logo composition fails
      return imageUrl
    }
  }

  // Load image from URL (with proxy support for external URLs)
  private static async loadImageFromUrl(
    url: string
  ): Promise<HTMLImageElement> {
    // If it's an external URL (DALL-E), fetch via proxy first
    if (url.startsWith('http') && !url.startsWith(window.location.origin)) {
      console.log('🌐 External URL detected, fetching via proxy...')

      try {
        const response = await fetch('/api/talkart/proxy-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: url }),
        })

        if (!response.ok) {
          throw new Error(`Proxy fetch failed: ${response.statusText}`)
        }

        const data = await response.json()
        console.log('✅ Image fetched via proxy, size:', data.size, 'bytes')

        return this.loadImageDirectly(data.dataUrl)
      } catch (error) {
        console.error('❌ Proxy fetch failed:', error)
        throw error
      }
    }

    // For local URLs, load directly
    return this.loadImageDirectly(url)
  }

  // Load image directly from URL
  private static loadImageDirectly(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = url
    })
  }

  // Check if logo is available
  public static async isLogoAvailable(): Promise<boolean> {
    try {
      await this.loadLogo()
      return true
    } catch {
      return false
    }
  }
}
