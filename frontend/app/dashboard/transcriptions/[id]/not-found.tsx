import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4 text-foreground">404</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          文字起こしが見つかりません
        </h1>
        <p className="text-text-muted mb-6">
          指定された文字起こしは存在しないか、削除された可能性があります。
        </p>
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors"
        >
          ダッシュボードに戻る
        </Link>
      </div>
    </div>
  )
}
