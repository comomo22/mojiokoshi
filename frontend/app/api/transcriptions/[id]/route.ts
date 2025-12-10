import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET: 詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 詳細取得
    const { data: transcription, error: dbError } = await supabase
      .from('transcriptions')
      .select('*')
      .eq('id', id)
      .single()

    if (dbError || !transcription) {
      return NextResponse.json(
        { error: 'Transcription not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(transcription)
  } catch (error) {
    console.error('Fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transcription' },
      { status: 500 }
    )
  }
}

// DELETE: 削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 削除
    const { error: dbError } = await supabase
      .from('transcriptions')
      .delete()
      .eq('id', id)

    if (dbError) {
      console.error('Delete error:', dbError)
      return NextResponse.json(
        { error: 'Failed to delete transcription' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete transcription' },
      { status: 500 }
    )
  }
}
