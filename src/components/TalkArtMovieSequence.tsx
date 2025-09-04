import React, { useState, useEffect, useRef } from 'react'

interface TalkArtMovieSequenceProps {
  isGenerating: boolean
  isGenerationComplete: boolean
  onSequenceComplete?: () => void
}

type MovieState = 'waiting' | 'playing' | 'completed' | 'cancelled'

export const TalkArtMovieSequence: React.FC<TalkArtMovieSequenceProps> = ({
  isGenerating,
  isGenerationComplete,
  onSequenceComplete,
}) => {
  const [currentMovie, setCurrentMovie] = useState<number>(0) // 0=待機, 1-5=動画番号
  const [movieState, setMovieState] = useState<MovieState>('waiting')
  const [isVisible, setIsVisible] = useState<boolean>(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 動画ファイルパスの配列
  const moviePaths = [
    '/movies/1.mp4',
    '/movies/2.mp4',
    '/movies/3.mp4',
    '/movies/4.mp4',
    '/movies/5.mp4',
  ]

  // 位置計算関数（奇数=右1/3、偶数=左2/3）
  const getMoviePosition = (movieNumber: number) => {
    const isOdd = movieNumber % 2 === 1
    return {
      right: isOdd ? '5%' : 'auto', // 右1/3位置
      left: isOdd ? 'auto' : '5%', // 左2/3位置
      top: '50%',
      transform: 'translateY(-50%)',
    }
  }

  // 2秒待機後に動画シーケンス開始
  useEffect(() => {
    if (isGenerating && movieState === 'waiting') {
      console.log('🎬 Starting movie sequence in 2 seconds...')

      timeoutRef.current = setTimeout(() => {
        if (!isGenerationComplete) {
          setCurrentMovie(1)
          setMovieState('playing')
          console.log('🎬 Starting movie 1')
        }
      }, 2000)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isGenerating, movieState, isGenerationComplete])

  // 生成完了時の動画キャンセル処理
  useEffect(() => {
    if (isGenerationComplete && movieState === 'playing') {
      console.log('🎬 Generation completed, cancelling movie sequence')
      setMovieState('cancelled')
      setIsVisible(false)
      setCurrentMovie(0)
    }
  }, [isGenerationComplete, movieState])

  // 動画再生制御
  useEffect(() => {
    if (currentMovie > 0 && currentMovie <= 5 && movieState === 'playing') {
      const video = videoRef.current
      if (!video) return

      // フェードイン開始
      setIsVisible(true)

      const handleVideoLoad = () => {
        video.play().catch((error) => {
          console.error('🎬 Video play error:', error)
          // 次の動画に進む
          handleVideoEnd()
        })
      }

      const handleVideoEnd = () => {
        console.log(`🎬 Movie ${currentMovie} ended`)

        // フェードアウト
        setIsVisible(false)

        setTimeout(() => {
          if (currentMovie < 5 && !isGenerationComplete) {
            // 次の動画へ
            setCurrentMovie(currentMovie + 1)
            console.log(`🎬 Starting movie ${currentMovie + 1}`)
          } else {
            // シーケンス完了
            setMovieState('completed')
            setCurrentMovie(0)
            console.log('🎬 Movie sequence completed')
            onSequenceComplete?.()
          }
        }, 500) // フェードアウト時間
      }

      video.addEventListener('loadeddata', handleVideoLoad)
      video.addEventListener('ended', handleVideoEnd)

      return () => {
        video.removeEventListener('loadeddata', handleVideoLoad)
        video.removeEventListener('ended', handleVideoEnd)
      }
    }
  }, [currentMovie, movieState, isGenerationComplete, onSequenceComplete])

  // 動画を表示しない条件
  if (
    !isGenerating ||
    movieState === 'waiting' ||
    movieState === 'cancelled' ||
    currentMovie === 0
  ) {
    return null
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      <video
        ref={videoRef}
        className="absolute object-cover rounded-lg shadow-2xl transition-opacity duration-500"
        style={{
          ...getMoviePosition(currentMovie),
          opacity: isVisible ? 1 : 0,
          width: '640px',
          height: '480px',
        }}
        src={moviePaths[currentMovie - 1]}
        muted
        playsInline
        preload="metadata"
      />

      {/* デバッグ表示（開発時のみ） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 bg-black/70 text-white p-2 rounded text-sm font-mono">
          🎬 Movie: {currentMovie}/5 | State: {movieState} | Visible:{' '}
          {isVisible.toString()}
        </div>
      )}
    </div>
  )
}

export default TalkArtMovieSequence
