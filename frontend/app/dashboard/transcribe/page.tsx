'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type TranscriptionResult = {
  text: string
  segments?: { start: number; end: number; text: string }[]
  duration?: number
  language?: string
}

export default function TranscribePage() {
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<TranscriptionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const allowedTypes = [
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave',
    'audio/x-wav', 'audio/mp4', 'audio/m4a', 'audio/x-m4a',
    'video/mp4', 'video/webm', 'audio/webm'
  ]

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && validateFile(droppedFile)) {
      setFile(droppedFile)
      setError(null)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile)
      setError(null)
    }
  }

  const validateFile = (file: File): boolean => {
    // 25MB制限（OpenAI Whisper API制限）
    if (file.size > 25 * 1024 * 1024) {
      setError('ファイルサイズは25MB以下にしてください')
      return false
    }

    if (!allowedTypes.includes(file.type)) {
      setError('対応形式: MP3, WAV, M4A, MP4, WebM')
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!file) return

    setUploading(true)
    setProgress(0)
    setError(null)
    setResult(null)

    try {
      const supabase = createClient()

      // 認証ユーザーを取得
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('ログインが必要です')
      }

      setProgress(10)

      // 一時的なIDを生成（後でDBのIDに置き換え可能）
      const tempId = crypto.randomUUID()
      const storagePath = `${user.id}/${tempId}/${file.name}`

      // Supabase Storageにアップロード
      const { error: uploadError } = await supabase.storage
        .from('transcriptions')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw new Error(`アップロードエラー: ${uploadError.message}`)
      }

      setProgress(40)

      // API Routeにstorage_pathを送信
      const response = await fetch('/api/transcriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storage_path: storagePath,
          title: file.name.replace(/\.[^/.]+$/, ''),
          original_filename: file.name,
          file_size_bytes: file.size,
        }),
      })

      setProgress(70)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 401) {
          throw new Error('ログインが必要です')
        }
        throw new Error(errorData.error || '文字起こしに失敗しました')
      }

      const data = await response.json()
      setProgress(100)
      setResult({
        text: data.text,
        segments: data.segments,
        duration: data.duration_seconds,
        language: data.language,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました')
    } finally {
      setUploading(false)
    }
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-secondary">
      <header className="bg-card shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-text-muted hover:text-foreground transition-colors">
              ← 戻る
            </Link>
            <h1 className="text-2xl font-bold text-foreground">新規文字起こし</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {!result ? (
          <div className="bg-card rounded-xl shadow p-8">
            {/* ドラッグ＆ドロップエリア */}
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                dragActive
                  ? 'border-border-focus bg-secondary'
                  : 'border-border'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="space-y-4">
                  <div className="text-6xl">🎵</div>
                  <p className="text-lg font-medium text-foreground">{file.name}</p>
                  <p className="text-sm text-text-muted">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    onClick={() => setFile(null)}
                    className="text-error hover:opacity-70 text-sm transition-opacity"
                  >
                    ファイルを削除
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-6xl">📁</div>
                  <p className="text-lg text-text-secondary">
                    ファイルをドラッグ＆ドロップ
                  </p>
                  <p className="text-sm text-text-muted">または</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors"
                  >
                    ファイルを選択
                  </button>
                  <p className="text-xs text-text-placeholder mt-4">
                    対応形式: MP3, WAV, M4A, MP4, WebM（最大25MB）
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp3,.wav,.m4a,.mp4,.webm,audio/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {error && (
              <div className="mt-4 p-4 bg-error-bg border border-error text-error rounded-lg">
                {error}
              </div>
            )}

            {/* 進行状況 */}
            {uploading && (
              <div className="mt-6">
                <div className="flex justify-between text-sm text-text-muted mb-2">
                  <span>文字起こし中...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-accent h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-text-muted mt-2">
                  ファイルサイズによって数十秒〜数分かかります
                </p>
              </div>
            )}

            {/* 送信ボタン */}
            <button
              onClick={handleSubmit}
              disabled={!file || uploading}
              className="mt-6 w-full py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg transition-colors"
            >
              {uploading ? '処理中...' : '文字起こしを開始'}
            </button>
          </div>
        ) : (
          /* 結果表示 */
          <div className="bg-card rounded-xl shadow">
            <div className="p-6 border-b border-divider">
              <h2 className="text-xl font-semibold text-foreground">
                文字起こし結果
              </h2>
              <div className="flex gap-4 mt-2 text-sm text-text-muted">
                {result.duration && <span>長さ: {formatDuration(result.duration)}</span>}
                {result.language && <span>言語: {result.language}</span>}
              </div>
            </div>

            <div className="p-6">
              <div className="bg-secondary rounded-lg p-4 max-h-96 overflow-y-auto">
                <p className="whitespace-pre-wrap text-foreground leading-relaxed">
                  {result.text}
                </p>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => navigator.clipboard.writeText(result.text)}
                  className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary-hover transition-colors"
                >
                  コピー
                </button>
                <button
                  onClick={() => {
                    setResult(null)
                    setFile(null)
                  }}
                  className="px-6 py-2 bg-accent text-accent-foreground rounded-lg hover:opacity-80 transition-opacity"
                >
                  新しい文字起こし
                </button>
                <Link
                  href="/dashboard"
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors"
                >
                  ダッシュボードへ
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
