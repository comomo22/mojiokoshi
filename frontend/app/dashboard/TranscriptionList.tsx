'use client'

import Link from 'next/link'

type Transcription = {
  id: string
  title: string
  original_filename: string
  duration_seconds: number | null
  language: string | null
  created_at: string
}

type Props = {
  transcriptions: Transcription[]
}

export default function TranscriptionList({ transcriptions }: Props) {
  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '-'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (transcriptions.length === 0) {
    return (
      <div className="bg-card rounded-xl shadow p-8 text-center">
        <div className="text-6xl mb-4">📝</div>
        <p className="text-text-muted">
          まだ文字起こしがありません。<br />
          「新規文字起こし」ボタンから始めましょう。
        </p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl shadow overflow-hidden">
      <div className="divide-y divide-divider">
        {transcriptions.map((t) => (
          <Link
            key={t.id}
            href={`/dashboard/transcriptions/${t.id}`}
            className="block p-6 hover:bg-secondary transition-colors"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-foreground truncate">
                  {t.title}
                </h3>
                <p className="text-sm text-text-muted mt-1">
                  {t.original_filename}
                </p>
              </div>
              <div className="text-right ml-4 flex-shrink-0">
                <div className="text-sm text-text-muted">
                  {formatDate(t.created_at)}
                </div>
                <div className="flex gap-3 mt-1 text-xs text-text-placeholder">
                  {t.duration_seconds && (
                    <span>{formatDuration(t.duration_seconds)}</span>
                  )}
                  {t.language && (
                    <span className="uppercase">{t.language}</span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
