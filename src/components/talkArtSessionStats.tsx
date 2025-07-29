import React, { useState, useEffect } from 'react'
import { talkArtSessionManager } from '@/features/talkart/sessionManager'

interface TalkArtSessionStatsProps {
  onClose: () => void
}

export const TalkArtSessionStats: React.FC<TalkArtSessionStatsProps> = ({
  onClose,
}) => {
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    timeout: 0,
    error: 0,
    averageDuration: 0,
    todayCount: 0,
    completionRate: 0,
  })

  useEffect(() => {
    const sessionStats = talkArtSessionManager.getSessionStats()
    setStats(sessionStats)
  }, [])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}分${secs}秒`
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-purple-900 rounded-2xl p-6 max-w-lg w-full animate-slideInUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-yellow-400">セッション統計</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-yellow-400 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4 text-white">
          {/* Overview Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-purple-800/50 rounded-lg p-4">
              <p className="text-sm text-white/70 mb-1">総セッション数</p>
              <p className="text-2xl font-bold text-yellow-400">
                {stats.total}
              </p>
            </div>
            <div className="bg-purple-800/50 rounded-lg p-4">
              <p className="text-sm text-white/70 mb-1">今日のセッション</p>
              <p className="text-2xl font-bold text-yellow-400">
                {stats.todayCount}
              </p>
            </div>
          </div>

          {/* Session Outcomes */}
          <div className="bg-purple-800/50 rounded-lg p-4">
            <p className="text-sm text-white/70 mb-3">セッション結果</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-green-400">完了</span>
                <span className="font-medium">{stats.completed}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-yellow-400">タイムアウト</span>
                <span className="font-medium">{stats.timeout}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-red-400">エラー</span>
                <span className="font-medium">{stats.error}</span>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-purple-800/50 rounded-lg p-4">
              <p className="text-sm text-white/70 mb-1">完了率</p>
              <p className="text-xl font-bold text-green-400">
                {stats.completionRate}%
              </p>
            </div>
            <div className="bg-purple-800/50 rounded-lg p-4">
              <p className="text-sm text-white/70 mb-1">平均所要時間</p>
              <p className="text-xl font-bold text-blue-400">
                {formatDuration(stats.averageDuration)}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                if (confirm('すべてのセッション履歴をクリアしますか？')) {
                  talkArtSessionManager.clearHistory()
                  const newStats = talkArtSessionManager.getSessionStats()
                  setStats(newStats)
                }
              }}
              className="flex-1 bg-red-500 text-white py-2 px-4 rounded-full hover:bg-red-600 transition-colors"
            >
              履歴をクリア
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-purple-700 text-white py-2 px-4 rounded-full hover:bg-purple-600 transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
