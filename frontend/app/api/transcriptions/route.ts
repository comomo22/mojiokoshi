import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI, { toFile } from 'openai'

// Vercel Serverless Function の設定（Fluid Compute有効時: Hobbyプラン最大300秒）
export const maxDuration = 120 // 120秒タイムアウト
export const dynamic = 'force-dynamic'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB

// POST: 文字起こし実行
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Auth error in POST:', { authError, hasUser: !!user })
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.log('Auth success in POST:', { userId: user.id })

    // JSONボディから情報を取得
    const body = await request.json()
    const { storage_path, title, original_filename, file_size_bytes } = body

    if (!storage_path) {
      return NextResponse.json(
        { error: 'No storage_path provided' },
        { status: 400 }
      )
    }

    // storage_pathがユーザーのものか確認
    if (!storage_path.startsWith(`${user.id}/`)) {
      return NextResponse.json(
        { error: 'Unauthorized access to file' },
        { status: 403 }
      )
    }

    // ファイルサイズチェック
    if (file_size_bytes && file_size_bytes > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size must be less than 25MB' },
        { status: 400 }
      )
    }

    // Supabase Storageからファイルをダウンロード
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('transcriptions')
      .download(storage_path)

    if (downloadError || !fileData) {
      console.error('Storage download error:', downloadError)
      return NextResponse.json(
        { error: 'Failed to download file from storage' },
        { status: 500 }
      )
    }

    // BlobをBufferに変換
    const arrayBuffer = await fileData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // ファイル名を取得（パスの最後の部分）
    const filename = storage_path.split('/').pop() || 'audio.mp3'
    const openaiFile = await toFile(buffer, filename)

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

    // Supabaseに保存（storage_pathを含める）
    const { data: savedTranscription, error: dbError } = await supabase
      .from('transcriptions')
      .insert({
        user_id: user.id,
        title: title || 'Untitled',
        original_filename: original_filename || filename,
        file_size_bytes: file_size_bytes || buffer.length,
        text: transcription.text,
        segments: segments,
        duration_seconds: transcription.duration,
        language: transcription.language,
        storage_path: storage_path,
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
    console.error('Transcription error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
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
