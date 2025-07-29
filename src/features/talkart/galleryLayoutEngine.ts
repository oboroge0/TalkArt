// TalkArt Gallery Random Layout Engine
// Creates a handmade bulletin board effect with random positioning and rotation

export interface LayoutPosition {
  x: number
  y: number
  rotation: number
  scale: number
  zIndex: number
  decorationType: 'tape' | 'pin' | 'both'
  tapeRotation?: number
}

export class GalleryLayoutEngine {
  private usedPositions: Array<{
    x: number
    y: number
    width: number
    height: number
  }> = []
  private readonly MIN_SPACING = 20 // Minimum pixels between items
  private readonly ROTATION_RANGE = { min: -15, max: 15 } // Degrees
  private readonly SCALE_RANGE = { min: 0.95, max: 1.05 }

  constructor(
    private containerWidth: number,
    private containerHeight: number,
    private itemWidth: number = 200,
    private itemHeight: number = 200
  ) {}

  // Generate a random position for a new gallery item
  public generatePosition(index: number): LayoutPosition {
    let attempts = 0
    let position: LayoutPosition | null = null

    // Try to find a non-overlapping position
    while (attempts < 50 && !position) {
      const candidate = this.createRandomPosition(index)
      if (this.isValidPosition(candidate)) {
        position = candidate
        this.recordPosition(candidate)
      }
      attempts++
    }

    // If no valid position found, use a fallback grid position
    if (!position) {
      position = this.getFallbackPosition(index)
      this.recordPosition(position)
    }

    return position
  }

  // Create a random position candidate
  private createRandomPosition(index: number): LayoutPosition {
    // Create zones to ensure better distribution
    const zones = this.getZones()
    const zone = zones[index % zones.length]

    // Random position within the zone
    const x = zone.x + Math.random() * zone.width
    const y = zone.y + Math.random() * zone.height

    // Random rotation for handmade effect
    const rotation =
      this.ROTATION_RANGE.min +
      Math.random() * (this.ROTATION_RANGE.max - this.ROTATION_RANGE.min)

    // Slight scale variation
    const scale =
      this.SCALE_RANGE.min +
      Math.random() * (this.SCALE_RANGE.max - this.SCALE_RANGE.min)

    // Z-index based on position (items at bottom appear on top)
    const zIndex = Math.floor(y / 10) + Math.floor(Math.random() * 5)

    // Random decoration type
    const decorationTypes: Array<'tape' | 'pin' | 'both'> = [
      'tape',
      'pin',
      'both',
    ]
    const decorationType =
      decorationTypes[Math.floor(Math.random() * decorationTypes.length)]

    // Additional tape rotation if using tape
    const tapeRotation =
      decorationType !== 'pin' ? -45 + Math.random() * 90 : undefined

    return {
      x,
      y,
      rotation,
      scale,
      zIndex,
      decorationType,
      tapeRotation,
    }
  }

  // Check if position is valid (not overlapping too much)
  private isValidPosition(position: LayoutPosition): boolean {
    const scaledWidth = this.itemWidth * position.scale
    const scaledHeight = this.itemHeight * position.scale

    for (const used of this.usedPositions) {
      const distance = Math.sqrt(
        Math.pow(position.x - used.x, 2) + Math.pow(position.y - used.y, 2)
      )

      // Allow some overlap for natural look
      const minDistance = ((scaledWidth + used.width) / 2) * 0.7

      if (distance < minDistance) {
        return false
      }
    }

    // Check boundaries
    const halfWidth = scaledWidth / 2
    const halfHeight = scaledHeight / 2

    return (
      position.x - halfWidth >= 0 &&
      position.x + halfWidth <= this.containerWidth &&
      position.y - halfHeight >= 0 &&
      position.y + halfHeight <= this.containerHeight
    )
  }

  // Record used position
  private recordPosition(position: LayoutPosition): void {
    const scaledWidth = this.itemWidth * position.scale
    const scaledHeight = this.itemHeight * position.scale

    this.usedPositions.push({
      x: position.x,
      y: position.y,
      width: scaledWidth,
      height: scaledHeight,
    })
  }

  // Get zones for better distribution
  private getZones(): Array<{
    x: number
    y: number
    width: number
    height: number
  }> {
    const cols = Math.max(3, Math.floor(this.containerWidth / this.itemWidth))
    const rows = Math.max(3, Math.floor(this.containerHeight / this.itemHeight))
    const zones: Array<{
      x: number
      y: number
      width: number
      height: number
    }> = []

    const zoneWidth = this.containerWidth / cols
    const zoneHeight = this.containerHeight / rows

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        zones.push({
          x: col * zoneWidth,
          y: row * zoneHeight,
          width: zoneWidth,
          height: zoneHeight,
        })
      }
    }

    // Shuffle zones for randomness
    return zones.sort(() => Math.random() - 0.5)
  }

  // Fallback grid position if random positioning fails
  private getFallbackPosition(index: number): LayoutPosition {
    const cols = Math.floor(
      this.containerWidth / (this.itemWidth + this.MIN_SPACING)
    )
    const row = Math.floor(index / cols)
    const col = index % cols

    const x = col * (this.itemWidth + this.MIN_SPACING) + this.itemWidth / 2
    const y = row * (this.itemHeight + this.MIN_SPACING) + this.itemHeight / 2

    return {
      x,
      y,
      rotation:
        this.ROTATION_RANGE.min +
        Math.random() * (this.ROTATION_RANGE.max - this.ROTATION_RANGE.min),
      scale: 1,
      zIndex: index,
      decorationType: 'tape',
      tapeRotation: -45 + Math.random() * 90,
    }
  }

  // Reset used positions (for recalculation)
  public reset(): void {
    this.usedPositions = []
  }

  // Update container dimensions
  public updateDimensions(width: number, height: number): void {
    this.containerWidth = width
    this.containerHeight = height
    this.reset()
  }
}

// Helper function to create spring physics for paper flutter effect
export function createPaperFlutterAnimation(
  baseRotation: number,
  intensity: number = 1
): string {
  const keyframes = `
    @keyframes paperFlutter {
      0%, 100% { 
        transform: rotate(${baseRotation}deg) scale(1); 
      }
      25% { 
        transform: rotate(${baseRotation + 2 * intensity}deg) scale(1.02); 
      }
      50% { 
        transform: rotate(${baseRotation - 3 * intensity}deg) scale(0.98); 
      }
      75% { 
        transform: rotate(${baseRotation + 1 * intensity}deg) scale(1.01); 
      }
    }
  `
  return keyframes
}
