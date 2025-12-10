import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

// Vercel Serverless Function の設定
export const maxDuration = 60 // 60秒タイムアウト（Proプラン）
export const dynamic = 'force-dynamic'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// 許可するファイルタイプ
const ALLOWED_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'video/mp4',
  'video/webm',
  'audio/webm',
]

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB

// POST: 文字起こし実行
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // FormDataからファイルを取得
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const title = formData.get('title') as string || 'Untitled'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // ファイルバリデーション
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size must be less than 25MB' },
        { status: 400 }
      )
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: MP3, WAV, M4A, MP4, WebM' },
        { status: 400 }
      )
    }

    // ファイルをBufferに変換
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // OpenAI用のファイルオブジェクトを作成
    const openaiFile = new File([buffer], file.name, { type: file.type })

    // OpenAI Whisper API で文字起こし
    const transcription = await openai.audio.transcriptions.create({
      file: openaiFile,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    })

    // セグメントデータを整形
    const segments = transcription.segments?.map(seg => ({
      start: seg.start,
      end: seg.end,
      text: seg.text,
    })) || []

    // Supabaseに保存
    const { data: savedTranscription, error: dbError } = await supabase
      .from('transcriptions')
      .insert({
        user_id: user.id,
        title: title,
        original_filename: file.name,
        text: transcription.text,
        segments: segments,
        duration_seconds: transcription.duration,
        language: transcription.language,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save transcription' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      id: savedTranscription.id,
      text: transcription.text,
      segments: segments,
      duration_seconds: transcription.duration,
      language: transcription.language,
    })
  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Transcription failed' },
      { status: 500 }
    )
  }
}

// GET: 履歴一覧取得
export async function GET() {
  try {
    const supabase = await createClient()

    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 履歴取得
    const { data: transcriptions, error: dbError } = await supabase
      .from('transcriptions')
      .select('id, title, original_filename, duration_seconds, language, created_at')
      .order('created_at', { ascending: false })
      .limit(50)

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to fetch transcriptions' },
        { status: 500 }
      )
    }

    return NextResponse.json(transcriptions)
  } catch (error) {
    console.error('Fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transcriptions' },
      { status: 500 }
    )
  }
}
