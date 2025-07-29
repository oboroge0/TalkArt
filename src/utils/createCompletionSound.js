// Simple completion sound generator
// This creates a basic chime sound as a placeholder

const fs = require('fs')
const path = require('path')

// Create a simple sine wave for the completion sound
function createSineWave(frequency, duration, sampleRate = 44100) {
  const samples = duration * sampleRate
  const data = new Float32Array(samples)

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate
    // Create a fade in/out envelope
    const envelope = Math.sin((Math.PI * t) / duration) * (1 - t / duration)
    // Generate sine wave with envelope
    data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3
  }

  return data
}

// Create a simple bell-like sound by combining frequencies
function createBellSound() {
  const fundamental = 523.25 // C5
  const harmonics = [
    { freq: fundamental, amp: 1.0 },
    { freq: fundamental * 2, amp: 0.5 },
    { freq: fundamental * 3, amp: 0.3 },
    { freq: fundamental * 4.2, amp: 0.2 }, // Inharmonic for bell-like quality
  ]

  const duration = 1.5
  const sampleRate = 44100
  const samples = duration * sampleRate
  const data = new Float32Array(samples)

  // Combine harmonics
  harmonics.forEach((harmonic) => {
    const wave = createSineWave(harmonic.freq, duration, sampleRate)
    for (let i = 0; i < samples; i++) {
      data[i] += wave[i] * harmonic.amp
    }
  })

  // Normalize
  const max = Math.max(...data.map(Math.abs))
  for (let i = 0; i < samples; i++) {
    data[i] /= max
  }

  return { data, sampleRate, duration }
}

// Note: This is a placeholder for documentation
// In production, use a proper audio file
console.log(`
Placeholder sound generator for TalkArt completion sound.

To create the actual completion.mp3 file:

1. Record or download a suitable completion sound:
   - Wind chimes
   - Japanese bell (suzu)
   - Festival chime
   - Success sound

2. Edit the audio:
   - Duration: 1-2 seconds
   - Format: MP3
   - Bitrate: 128kbps (for web optimization)
   - Add fade in/out if needed

3. Save as: public/sounds/completion.mp3

Free sound resources:
- https://freesound.org/search/?q=wind+chime
- https://freesound.org/search/?q=bell+completion
- https://zapsplat.com/sound-effect-category/bells/
`)

// Create directory if it doesn't exist
const soundsDir = path.join(__dirname, '../../public/sounds')
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true })
  console.log('Created sounds directory')
}
