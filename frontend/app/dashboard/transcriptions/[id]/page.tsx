import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import TranscriptionDetail from './TranscriptionDetail'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ id: string }>
}

export default async function TranscriptionPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  const { data: transcription, error } = await supabase
    .from('transcriptions')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !transcription) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              ← ダッシュボード
            </Link>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white truncate max-w-md">
              {transcription.title}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <TranscriptionDetail transcription={transcription} />
      </main>
    </div>
  )
}
