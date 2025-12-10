-- Whisper Web Storage Setup
-- Issue #4: Supabase Storage設定

-- ============================================
-- transcriptions バケットの作成
-- ============================================
-- プライベートバケットとして作成（public = false）
-- ユーザーの音声ファイルを保存

INSERT INTO storage.buckets (id, name, public)
VALUES ('transcriptions', 'transcriptions', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Storage RLS ポリシー
-- ============================================
-- パス形式: {user_id}/{transcription_id}/{filename}

-- SELECT: ユーザーは自分のファイルのみ読み取り可能
CREATE POLICY "Users can view own files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'transcriptions' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- INSERT: ユーザーは自分のフォルダのみアップロード可能
CREATE POLICY "Users can upload to own folder"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'transcriptions' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- UPDATE: ユーザーは自分のファイルのみ更新可能
CREATE POLICY "Users can update own files"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'transcriptions' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE: ユーザーは自分のファイルのみ削除可能
CREATE POLICY "Users can delete own files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'transcriptions' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
