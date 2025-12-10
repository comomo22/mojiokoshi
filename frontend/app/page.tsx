import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <main className="flex flex-col items-center gap-8 p-8 max-w-2xl">
        <h1 className="text-6xl font-bold text-center text-foreground">
          Whisper Web
        </h1>
        <p className="text-xl text-center text-text-secondary">
          AI駆動の音声文字起こしサービス
        </p>
        <p className="text-center text-text-muted">
          高精度な音声認識技術で、あなたの音声を素早くテキストに変換します
        </p>
        <div className="flex gap-4 mt-8">
          <Link
            href="/login"
            className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors font-semibold"
          >
            ログイン
          </Link>
          <Link
            href="/signup"
            className="px-8 py-3 bg-background text-foreground border-2 border-border rounded-lg hover:bg-secondary transition-colors font-semibold"
          >
            新規登録
          </Link>
        </div>
      </main>
    </div>
  );
}
