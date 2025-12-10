import magic
from fastapi import UploadFile, HTTPException
from typing import Set

# 許可する拡張子
ALLOWED_EXTENSIONS: Set[str] = {"mp3", "mp4", "wav", "m4a", "webm", "mpeg", "mpga", "oga", "ogg"}

# 許可するMIMEタイプ
ALLOWED_MIME_TYPES: Set[str] = {
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/wave",
    "audio/mp4",
    "audio/m4a",
    "audio/x-m4a",
    "video/mp4",
    "video/webm",
    "audio/webm",
    "audio/ogg",
    "audio/vorbis",
    "application/ogg"
}

# 最大ファイルサイズ（25MB - OpenAI制限）
MAX_FILE_SIZE = 25 * 1024 * 1024


class FileService:
    """Service for file validation and processing."""

    def validate_audio_file(self, file: UploadFile) -> None:
        """
        Validate uploaded audio file.

        Raises:
            HTTPException: If validation fails
        """
        # 1. ファイル名チェック
        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="ファイル名が必要です"
            )

        # 2. 拡張子チェック
        ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"非対応のファイル形式です。対応形式: {', '.join(ALLOWED_EXTENSIONS)}"
            )

        # 3. サイズチェック
        if file.size and file.size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"ファイルサイズが大きすぎます（最大25MB）。現在: {file.size / 1024 / 1024:.1f}MB"
            )

    def validate_file_content(self, file_content: bytes) -> None:
        """
        Validate file content using magic numbers.

        Raises:
            HTTPException: If validation fails
        """
        # MIMEタイプをマジックナンバーから検出
        mime_type = magic.from_buffer(file_content[:2048], mime=True)

        if mime_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"不正なファイル形式です。検出されたタイプ: {mime_type}"
            )

    def sanitize_filename(self, filename: str) -> str:
        """
        Sanitize filename to prevent path traversal attacks.

        Args:
            filename: Original filename

        Returns:
            Sanitized filename
        """
        import re

        # パス区切り文字を除去
        filename = filename.replace("/", "_").replace("\\", "_")

        # 危険な文字を除去
        filename = re.sub(r'[<>:"|?*\x00-\x1f]', '_', filename)

        # 先頭のドットを除去（隠しファイル防止）
        filename = filename.lstrip('.')

        # 空になった場合はデフォルト名
        if not filename:
            filename = "uploaded_audio"

        return filename


# シングルトンインスタンス
file_service = FileService()


def get_file_service() -> FileService:
    """Dependency to get file service."""
    return file_service
