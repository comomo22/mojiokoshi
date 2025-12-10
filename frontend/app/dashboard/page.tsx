import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import TranscriptionList from './TranscriptionList'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // 履歴取得
  const { data: transcriptions } = await supabase
    .from('transcriptions')
    .select('id, title, original_filename, duration_seconds, language, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Whisper Web</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600 dark:text-gray-400">{user.email}</span>
            <form action="/auth/signout" method="post">
              <button className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">文字起こし履歴</h2>
          <Link
            href="/dashboard/transcribe"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            + 新規文字起こし
          </Link>
        </div>

        <TranscriptionList transcriptions={transcriptions || []} />
      </main>
    </div>
  )
}
