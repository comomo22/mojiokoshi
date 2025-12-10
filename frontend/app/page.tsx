import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <main className="flex flex-col items-center gap-8 p-8 max-w-2xl">
        <h1 className="text-6xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Whisper Web
        </h1>
        <p className="text-xl text-center text-gray-600 dark:text-gray-300">
          AI駆動の音声文字起こしサービス
        </p>
        <p className="text-center text-gray-500 dark:text-gray-400">
          高精度な音声認識技術で、あなたの音声を素早くテキストに変換します
        </p>
        <div className="flex gap-4 mt-8">
          <Link
            href="/login"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            ログイン
          </Link>
          <Link
            href="/signup"
            className="px-8 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
          >
            新規登録
          </Link>
        </div>
      </main>
    </div>
  );
}
