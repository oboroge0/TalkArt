import React from 'react'
import { ExperienceFlowManager } from '@/features/talkart/flow/ExperienceFlowManager'
import { GeneratedArtwork } from '@/features/talkart/types'

const TalkArtPage: React.FC = () => {
  const handleExperienceComplete = (artwork: GeneratedArtwork) => {
    console.log('Experience completed with artwork:', artwork)
    // 完了時の追加処理（アナリティクス等）
  }

  const handleExperienceError = (error: string) => {
    console.error('Experience error:', error)
    // エラー時の追加処理（ログ送信等）
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <ExperienceFlowManager
        onComplete={handleExperienceComplete}
        onError={handleExperienceError}
      />
    </div>
  )
}


export default TalkArtPage
