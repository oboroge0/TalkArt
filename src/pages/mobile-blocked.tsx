import { Meta } from '@/components/meta'

const MobileBlockedPage = () => {
  return (
    <>
      <Meta />
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-purple-700 flex items-center justify-center p-4">
        {/* Background effect */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-yellow-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-pink-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 text-center max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-6xl mb-4">📱</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              モバイルアクセス制限
            </h1>
            <p className="text-gray-600 mb-6">
              TalkArtの生成機能とギャラリーはデスクトップ専用です。
            </p>
            <p className="text-sm text-gray-500">
              個別の作品をダウンロードする場合は、QRコードから直接アクセスしてください。
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default MobileBlockedPage