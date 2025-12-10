# Supabase セットアップガイド

## 1. Supabaseプロジェクト作成

1. [Supabase](https://supabase.com) にアクセス
2. 「Start your project」をクリック
3. GitHubアカウントでログイン
4. 「New project」をクリック
5. プロジェクト情報を入力:
   - **Name**: `mojiokoshi` (任意)
   - **Database Password**: 強力なパスワードを設定
   - **Region**: `Northeast Asia (Tokyo)` を推奨
6. 「Create new project」をクリック

## 2. 環境変数の取得

プロジェクト作成後、以下の情報を取得:

1. **Project Settings** > **API** に移動
2. 以下をコピー:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_KEY` (バックエンド用)

## 3. データベーススキーマの適用

### 方法A: Supabase Dashboard (推奨)

1. Supabase Dashboard > **SQL Editor** に移動
2. `schema.sql` の内容をコピー＆ペースト
3. 「Run」をクリック

### 方法B: Supabase CLI

```bash
# Supabase CLIをインストール
npm install -g supabase

# ログイン
supabase login

# リモートDBに接続
supabase link --project-ref <your-project-ref>

# マイグレーション実行
supabase db push
```

## 4. 認証設定

1. **Authentication** > **Providers** に移動
2. **Email** が有効になっていることを確認
3. **Authentication** > **URL Configuration** で:
   - **Site URL**: `http://localhost:3000` (開発時)
   - **Redirect URLs**:
     - `http://localhost:3000/auth/callback`
     - `https://your-domain.com/auth/callback` (本番時)

## 5. Storage設定

1. **Storage** に移動
2. 「New bucket」をクリック
3. 設定:
   - **Name**: `transcriptions`
   - **Public bucket**: OFF
4. 「Create bucket」をクリック

### Storageポリシー設定

1. `transcriptions` バケットをクリック
2. **Policies** タブに移動
3. 以下のポリシーを追加:

**SELECT (ダウンロード許可)**
```sql
CREATE POLICY "Users can download own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'transcriptions'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**INSERT (アップロード許可)**
```sql
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'transcriptions'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**DELETE (削除許可)**
```sql
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'transcriptions'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## 6. 環境変数の設定

### バックエンド (backend/.env)
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxxx...
SUPABASE_SERVICE_KEY=eyJxxxx...
```

### フロントエンド (frontend/.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx...
```

## 確認事項

- [ ] Supabaseプロジェクトが作成された
- [ ] `transcriptions` テーブルが作成された
- [ ] RLSポリシーが設定された
- [ ] Email認証が有効化された
- [ ] `transcriptions` Storageバケットが作成された
- [ ] 環境変数が設定された
