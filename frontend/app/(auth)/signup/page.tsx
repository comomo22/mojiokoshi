'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signup } from './actions'

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [successEmail, setSuccessEmail] = useState<string | null>(null)

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setError(null)

    const result = await signup(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else if (result?.success) {
      setSuccessEmail(result.email || '')
    }
  }

  if (successEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <div className="w-full max-w-md p-8 bg-card rounded-2xl shadow-lg text-center">
          <h1 className="text-3xl font-bold mb-4 text-foreground">メールを確認してください</h1>
          <p className="text-text-muted mb-6">
            {successEmail} に確認メールを送信しました。<br />
            メール内のリンクをクリックして登録を完了してください。
          </p>
          <Link href="/login" className="text-accent hover:underline">
            ログインページへ
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary">
      <div className="w-full max-w-md p-8 bg-card rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-8 text-foreground">新規登録</h1>

        {error && (
          <div className="mb-4 p-3 bg-error-bg border border-error text-error rounded">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              メールアドレス
            </label>
            <input
              type="email"
              name="email"
              autoComplete="email"
              className="w-full px-4 py-3 bg-input border border-input-border rounded-lg focus:ring-2 focus:ring-input-ring focus:border-border-focus text-foreground placeholder:text-text-placeholder outline-none transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              パスワード
            </label>
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              className="w-full px-4 py-3 bg-input border border-input-border rounded-lg focus:ring-2 focus:ring-input-ring focus:border-border-focus text-foreground placeholder:text-text-placeholder outline-none transition-colors"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              パスワード（確認）
            </label>
            <input
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              className="w-full px-4 py-3 bg-input border border-input-border rounded-lg focus:ring-2 focus:ring-input-ring focus:border-border-focus text-foreground placeholder:text-text-placeholder outline-none transition-colors"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover disabled:opacity-50 font-semibold transition-colors"
          >
            {loading ? '登録中...' : '新規登録'}
          </button>
        </form>

        <p className="mt-6 text-center text-text-muted">
          すでにアカウントをお持ちの方は{' '}
          <Link href="/login" className="text-accent hover:underline">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  )
}
