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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
              ← 戻る
            </Link>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">新規文字起こし</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {!result ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8">
            {/* ドラッグ＆ドロップエリア */}
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="space-y-4">
                  <div className="text-6xl">🎵</div>
                  <p className="text-lg font-medium text-gray-800 dark:text-white">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    onClick={() => setFile(null)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    ファイルを削除
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-6xl">📁</div>
                  <p className="text-lg text-gray-600 dark:text-gray-300">
                    ファイルをドラッグ＆ドロップ
                  </p>
                  <p className="text-sm text-gray-500">または</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    ファイルを選択
                  </button>
                  <p className="text-xs text-gray-400 mt-4">
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
              <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {/* 進行状況 */}
            {uploading && (
              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>文字起こし中...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  ファイルサイズによって数十秒〜数分かかります
                </p>
              </div>
            )}

            {/* 送信ボタン */}
            <button
              onClick={handleSubmit}
              disabled={!file || uploading}
              className="mt-6 w-full py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
            >
              {uploading ? '処理中...' : '文字起こしを開始'}
            </button>
          </div>
        ) : (
          /* 結果表示 */
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                文字起こし結果
              </h2>
              <div className="flex gap-4 mt-2 text-sm text-gray-500">
                {result.duration && <span>長さ: {formatDuration(result.duration)}</span>}
                {result.language && <span>言語: {result.language}</span>}
              </div>
            </div>

            <div className="p-6">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
                <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed">
                  {result.text}
                </p>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => navigator.clipboard.writeText(result.text)}
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  コピー
                </button>
                <button
                  onClick={() => {
                    setResult(null)
                    setFile(null)
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  新しい文字起こし
                </button>
                <Link
                  href="/dashboard"
                  className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
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
