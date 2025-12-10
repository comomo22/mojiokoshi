-- Whisper Web Database Schema
-- Issue #4: Supabase設定・DB設計

-- ============================================
-- transcriptions テーブル
-- ============================================
-- ユーザーの文字起こし結果を保存

CREATE TABLE IF NOT EXISTS transcriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- ファイル情報
  title VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_size_bytes BIGINT,

  -- 文字起こし結果
  text TEXT NOT NULL,
  segments JSONB,  -- タイムスタンプ付きセグメント [{start, end, text}, ...]

  -- メタデータ
  duration_seconds FLOAT,
  language VARCHAR(10),
  model VARCHAR(50) DEFAULT 'whisper-1',

  -- ストレージ
  storage_path VARCHAR(500),  -- Supabase Storageのパス

  -- タイムスタンプ
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- インデックス
-- ============================================

-- ユーザーIDでの検索を高速化
CREATE INDEX IF NOT EXISTS idx_transcriptions_user_id
  ON transcriptions(user_id);

-- 作成日時での並び替えを高速化
CREATE INDEX IF NOT EXISTS idx_transcriptions_created_at
  ON transcriptions(created_at DESC);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- RLSを有効化
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみ参照可能
CREATE POLICY "Users can view own transcriptions"
  ON transcriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- ユーザーは自分のデータのみ作成可能
CREATE POLICY "Users can insert own transcriptions"
  ON transcriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分のデータのみ更新可能
CREATE POLICY "Users can update own transcriptions"
  ON transcriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- ユーザーは自分のデータのみ削除可能
CREATE POLICY "Users can delete own transcriptions"
  ON transcriptions
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- updated_at 自動更新トリガー
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transcriptions_updated_at
  BEFORE UPDATE ON transcriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Storage バケット設定
-- ============================================
-- Note: これはSupabaseダッシュボードまたはAPIで設定

-- transcriptions バケットを作成（公開: false）
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('transcriptions', 'transcriptions', false);

-- Storage RLSポリシー
-- ユーザーは自分のフォルダにのみアップロード可能
-- パス形式: {user_id}/{transcription_id}/{filename}
