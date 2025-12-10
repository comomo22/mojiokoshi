'use client'

import { useState } from 'react'
import Link from 'next/link'
import { login } from './actions'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setError(null)

    const result = await login(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
    // 成功時はServer Actionがredirectするのでここには到達しない
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary">
      <div className="w-full max-w-md p-8 bg-card rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-8 text-foreground">ログイン</h1>

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
              autoComplete="current-password"
              className="w-full px-4 py-3 bg-input border border-input-border rounded-lg focus:ring-2 focus:ring-input-ring focus:border-border-focus text-foreground placeholder:text-text-placeholder outline-none transition-colors"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover disabled:opacity-50 font-semibold transition-colors"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <p className="mt-6 text-center text-text-muted">
          アカウントをお持ちでない方は{' '}
          <Link href="/signup" className="text-accent hover:underline">
            新規登録
          </Link>
        </p>
      </div>
    </div>
  )
}
