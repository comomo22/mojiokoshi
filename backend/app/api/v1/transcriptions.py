from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from typing import Optional
from app.core.security import get_current_user
from app.services.file_service import get_file_service, FileService
from app.services.transcription_service import TranscriptionService
from app.infrastructure.openai_client import get_whisper_client

router = APIRouter(prefix="/transcriptions", tags=["transcriptions"])


def get_transcription_service():
    """Dependency to get transcription service."""
    return TranscriptionService(whisper_client=get_whisper_client())


@router.post("")
async def create_transcription(
    file: UploadFile = File(...),
    language: Optional[str] = Form(None),
    title: Optional[str] = Form(None),
    current_user=Depends(get_current_user),
    file_service: FileService = Depends(get_file_service),
    transcription_service: TranscriptionService = Depends(get_transcription_service)
):
    """
    Create a new transcription from uploaded audio file.

    - **file**: Audio file (mp3, mp4, wav, m4a, webm, etc.)
    - **language**: Language code (ja, en, etc.) or None for auto-detect
    - **title**: Custom title or None to use filename
    """
    # ファイル検証（拡張子・サイズ）
    file_service.validate_audio_file(file)

    # ファイル内容を読み込み
    content = await file.read()

    # ファイル内容検証（マジックナンバー）
    file_service.validate_file_content(content)

    # ファイル名をサニタイズ
    safe_filename = file_service.sanitize_filename(file.filename or "audio")

    # ファイルポインタをリセット
    await file.seek(0)

    try:
        # 文字起こし実行
        result = await transcription_service.transcribe_and_save(
            audio_file=file.file,
            filename=safe_filename,
            user_id=str(current_user.id),
            language=language,
            title=title
        )

        return result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"文字起こしに失敗しました: {str(e)}"
        )


@router.get("")
async def list_transcriptions(
    page: int = 1,
    per_page: int = 20,
    current_user=Depends(get_current_user),
    transcription_service: TranscriptionService = Depends(get_transcription_service)
):
    """Get paginated list of user's transcriptions."""
    return await transcription_service.get_user_transcriptions(
        user_id=str(current_user.id),
        page=page,
        per_page=per_page
    )


@router.get("/{transcription_id}")
async def get_transcription(
    transcription_id: str,
    current_user=Depends(get_current_user),
    transcription_service: TranscriptionService = Depends(get_transcription_service)
):
    """Get a single transcription by ID."""
    result = await transcription_service.get_transcription(
        transcription_id=transcription_id,
        user_id=str(current_user.id)
    )

    if not result:
        raise HTTPException(status_code=404, detail="文字起こしが見つかりません")

    return result


@router.delete("/{transcription_id}")
async def delete_transcription(
    transcription_id: str,
    current_user=Depends(get_current_user),
    transcription_service: TranscriptionService = Depends(get_transcription_service)
):
    """Delete a transcription."""
    success = await transcription_service.delete_transcription(
        transcription_id=transcription_id,
        user_id=str(current_user.id)
    )

    if not success:
        raise HTTPException(status_code=404, detail="文字起こしが見つかりません")

    return {"message": "削除しました"}
