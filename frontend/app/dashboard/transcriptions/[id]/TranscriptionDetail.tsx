'use client'

import { useState } from 'react'

type Segment = {
  start: number
  end: number
  text: string
}

type Transcription = {
  id: string
  title: string
  original_filename: string
  text: string
  segments: Segment[] | null
  duration_seconds: number | null
  language: string | null
  created_at: string
}

type Props = {
  transcription: Transcription
}

export default function TranscriptionDetail({ transcription }: Props) {
  const [copied, setCopied] = useState(false)
  const [showSegments, setShowSegments] = useState(false)

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

  const formatTimestamp = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(transcription.text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([transcription.text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${transcription.title}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* メタ情報 */}
      <div className="bg-card rounded-xl shadow p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-text-muted">ファイル名</p>
            <p className="font-medium text-foreground truncate">
              {transcription.original_filename}
            </p>
          </div>
          <div>
            <p className="text-sm text-text-muted">長さ</p>
            <p className="font-medium text-foreground">
              {formatDuration(transcription.duration_seconds)}
            </p>
          </div>
          <div>
            <p className="text-sm text-text-muted">言語</p>
            <p className="font-medium text-foreground uppercase">
              {transcription.language || '-'}
            </p>
          </div>
          <div>
            <p className="text-sm text-text-muted">作成日時</p>
            <p className="font-medium text-foreground">
              {formatDate(transcription.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* テキスト */}
      <div className="bg-card rounded-xl shadow">
        <div className="p-4 border-b border-divider flex justify-between items-center">
          <h2 className="text-lg font-semibold text-foreground">
            文字起こしテキスト
          </h2>
          <div className="flex gap-2">
            {transcription.segments && transcription.segments.length > 0 && (
              <button
                onClick={() => setShowSegments(!showSegments)}
                className="px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary-hover transition-colors"
              >
                {showSegments ? 'テキスト表示' : 'タイムスタンプ表示'}
              </button>
            )}
            <button
              onClick={handleCopy}
              className="px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary-hover transition-colors"
            >
              {copied ? 'コピーしました!' : 'コピー'}
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors"
            >
              ダウンロード
            </button>
          </div>
        </div>

        <div className="p-6">
          {showSegments && transcription.segments ? (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {transcription.segments.map((segment, index) => (
                <div key={index} className="flex gap-4">
                  <span className="text-sm text-text-muted font-mono flex-shrink-0 w-24">
                    {formatTimestamp(segment.start)} - {formatTimestamp(segment.end)}
                  </span>
                  <p className="text-foreground">{segment.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-secondary rounded-lg p-4 max-h-[600px] overflow-y-auto">
              <p className="whitespace-pre-wrap text-foreground leading-relaxed">
                {transcription.text}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
