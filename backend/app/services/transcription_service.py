from typing import Optional, BinaryIO
from uuid import UUID, uuid4
from datetime import datetime
from app.infrastructure.openai_client import WhisperClient
from app.infrastructure.supabase_client import get_supabase_admin


class TranscriptionService:
    """Service for handling transcription operations."""

    def __init__(self, whisper_client: WhisperClient):
        self.whisper = whisper_client
        self.db = get_supabase_admin()

    async def transcribe_and_save(
        self,
        audio_file: BinaryIO,
        filename: str,
        user_id: str,
        language: Optional[str] = None,
        title: Optional[str] = None
    ) -> dict:
        """
        Transcribe audio and save result to database.

        Args:
            audio_file: Audio file data
            filename: Original filename
            user_id: User ID
            language: Language code or None for auto-detect
            title: Custom title or None to use filename

        Returns:
            Saved transcription record
        """
        # 1. Whisper APIで文字起こし
        result = self.whisper.transcribe(
            audio_file=audio_file,
            filename=filename,
            language=language,
            response_format="verbose_json"
        )

        # 2. タイトル設定
        if not title:
            title = filename.rsplit('.', 1)[0]  # 拡張子を除去

        # 3. DBに保存
        transcription_data = {
            "id": str(uuid4()),
            "user_id": user_id,
            "title": title,
            "original_filename": filename,
            "text": result["text"],
            "duration_seconds": result.get("duration"),
            "language": result.get("language"),
            "segments": result.get("segments"),
            "created_at": datetime.utcnow().isoformat()
        }

        response = self.db.table("transcriptions").insert(transcription_data).execute()

        return response.data[0] if response.data else transcription_data

    async def get_user_transcriptions(
        self,
        user_id: str,
        page: int = 1,
        per_page: int = 20
    ) -> dict:
        """Get paginated transcriptions for a user."""
        offset = (page - 1) * per_page

        # 総数を取得
        count_response = self.db.table("transcriptions") \
            .select("*", count="exact") \
            .eq("user_id", user_id) \
            .execute()

        # データを取得
        response = self.db.table("transcriptions") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .range(offset, offset + per_page - 1) \
            .execute()

        return {
            "items": response.data,
            "total": count_response.count or 0,
            "page": page,
            "per_page": per_page
        }

    async def get_transcription(self, transcription_id: str, user_id: str) -> Optional[dict]:
        """Get a single transcription by ID."""
        response = self.db.table("transcriptions") \
            .select("*") \
            .eq("id", transcription_id) \
            .eq("user_id", user_id) \
            .single() \
            .execute()

        return response.data

    async def delete_transcription(self, transcription_id: str, user_id: str) -> bool:
        """Delete a transcription."""
        response = self.db.table("transcriptions") \
            .delete() \
            .eq("id", transcription_id) \
            .eq("user_id", user_id) \
            .execute()

        return len(response.data) > 0 if response.data else False
