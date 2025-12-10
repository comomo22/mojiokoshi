import openai
from typing import BinaryIO, Optional
from app.core.config import settings


class WhisperClient:
    """OpenAI Whisper API client for transcription."""

    def __init__(self):
        self.client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

    def transcribe(
        self,
        audio_file: BinaryIO,
        filename: str,
        language: Optional[str] = None,
        response_format: str = "verbose_json"
    ) -> dict:
        """
        Transcribe audio file using OpenAI Whisper API.

        Args:
            audio_file: File-like object containing audio data
            filename: Original filename (needed for API)
            language: Language code (ja, en, etc.) or None for auto-detect
            response_format: json, text, srt, verbose_json, vtt

        Returns:
            Transcription result with text and metadata
        """
        # OpenAI APIは file-like object と filename を期待
        transcription = self.client.audio.transcriptions.create(
            model="whisper-1",
            file=(filename, audio_file),
            language=language,
            response_format=response_format
        )

        # verbose_json の場合は詳細情報を含むオブジェクトが返る
        if response_format == "verbose_json":
            return {
                "text": transcription.text,
                "language": transcription.language,
                "duration": transcription.duration,
                "segments": [
                    {
                        "start": seg.start,
                        "end": seg.end,
                        "text": seg.text
                    }
                    for seg in (transcription.segments or [])
                ]
            }

        # text形式の場合
        return {"text": transcription if isinstance(transcription, str) else transcription.text}


# シングルトンインスタンス
whisper_client = WhisperClient()


def get_whisper_client() -> WhisperClient:
    """Dependency to get Whisper client."""
    return whisper_client
