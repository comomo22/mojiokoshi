import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          文字起こしが見つかりません
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          指定された文字起こしは存在しないか、削除された可能性があります。
        </p>
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          ダッシュボードに戻る
        </Link>
      </div>
    </div>
  )
}
