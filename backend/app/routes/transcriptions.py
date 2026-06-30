from fastapi import APIRouter, Depends, File, Form, UploadFile
from starlette.responses import FileResponse

from app.schemas import TranscribeRequest, TranscriptionJob, TranslateRequest
from app.services.auth import get_authenticated_user
from app.services.transcriptions import (
    clean_audio,
    create_transcription,
    get_audio_path,
    list_transcriptions,
    replace_audio,
    transcribe_audio,
    translate_transcript,
)

router = APIRouter(
    prefix="/transcriptions",
    tags=["transcriptions"],
    dependencies=[Depends(get_authenticated_user)],
)


@router.get("", response_model=list[TranscriptionJob], response_model_by_alias=True)
def list_recordings() -> list[TranscriptionJob]:
    return list_transcriptions()


@router.post("", response_model=TranscriptionJob, response_model_by_alias=True)
def upload_recording(
    file: UploadFile = File(...),
    title: str | None = Form(default=None),
) -> TranscriptionJob:
    return create_transcription(file, title)


@router.post("/{job_id}/audio", response_model=TranscriptionJob, response_model_by_alias=True)
def replace_recording_audio(
    job_id: str,
    file: UploadFile = File(...),
) -> TranscriptionJob:
    return replace_audio(job_id, file)


@router.post("/{job_id}/clean", response_model=TranscriptionJob, response_model_by_alias=True)
def clean_recording_audio(job_id: str) -> TranscriptionJob:
    return clean_audio(job_id)


@router.post("/{job_id}/transcribe", response_model=TranscriptionJob, response_model_by_alias=True)
def transcribe_recording(job_id: str, request: TranscribeRequest) -> TranscriptionJob:
    return transcribe_audio(job_id, request.language)


@router.post("/{job_id}/translate", response_model=TranscriptionJob, response_model_by_alias=True)
def translate_recording(job_id: str, request: TranslateRequest) -> TranscriptionJob:
    return translate_transcript(job_id, request.source_language, request.target_language)


@router.get("/{job_id}/audio/{kind}")
def get_recording_audio(job_id: str, kind: str) -> FileResponse:
    return FileResponse(get_audio_path(job_id, kind))
