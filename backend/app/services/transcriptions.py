import json
import shutil
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile

from app.config import ROOT_DIR
from app.schemas import TranscriptionJob


STORAGE_DIR = ROOT_DIR / "storage" / "transcriptions"
METADATA_PATH = STORAGE_DIR / "records.json"

LANGUAGE_LABELS = {
    "auto": "English + Hausa",
    "english": "English",
    "hausa": "Hausa",
    "yoruba": "Yoruba",
    "igbo": "Igbo",
    "french": "French",
}


def _ensure_storage() -> None:
    STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    if not METADATA_PATH.exists():
        _write_records([])


def _read_records() -> list[dict]:
    _ensure_storage()
    return json.loads(METADATA_PATH.read_text(encoding="utf-8"))


def _write_records(records: list[dict]) -> None:
    STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    METADATA_PATH.write_text(json.dumps(records, indent=2), encoding="utf-8")


def _serialize(record: dict) -> TranscriptionJob:
    return TranscriptionJob(
        id=record["id"],
        title=record["title"],
        fileName=record["fileName"],
        duration=record["duration"],
        status=record["status"],
        updatedAt=record["updatedAt"],
        progress=record["progress"],
        detectedLanguage=record["detectedLanguage"],
        transcript=record["transcript"],
        translation=record["translation"],
        hasOriginalAudio=bool(record.get("originalPath")),
        hasCleanedAudio=bool(record.get("cleanedPath")),
    )


def _find_record(records: list[dict], job_id: str) -> dict:
    for record in records:
        if record["id"] == job_id:
            return record
    raise HTTPException(status_code=404, detail="Transcription recording not found")


def _safe_suffix(filename: str) -> str:
    suffix = Path(filename).suffix.lower()
    return suffix if suffix else ".audio"


def _record_dir(job_id: str) -> Path:
    path = STORAGE_DIR / job_id
    path.mkdir(parents=True, exist_ok=True)
    return path


def _write_upload(job_id: str, upload: UploadFile, name: str) -> Path:
    destination = _record_dir(job_id) / f"{name}{_safe_suffix(upload.filename or '')}"
    with destination.open("wb") as output:
        shutil.copyfileobj(upload.file, output)
    return destination


def _relative_path(path: Path) -> str:
    try:
        return str(path.relative_to(ROOT_DIR))
    except ValueError:
        return str(path)


def list_transcriptions() -> list[TranscriptionJob]:
    return [_serialize(record) for record in _read_records()]


def create_transcription(upload: UploadFile, title: str | None) -> TranscriptionJob:
    job_id = f"audio-{uuid.uuid4().hex[:12]}"
    original_path = _write_upload(job_id, upload, "original")
    fallback_title = Path(upload.filename or "Untitled recording").stem.replace("-", " ").replace("_", " ")
    record = {
        "id": job_id,
        "title": title.strip() if title and title.strip() else fallback_title,
        "fileName": upload.filename or "recording.audio",
        "duration": "Pending",
        "status": "Needs cleanup",
        "updatedAt": "Just now",
        "progress": 0,
        "detectedLanguage": "Not detected",
        "transcript": "",
        "translation": "",
        "originalPath": _relative_path(original_path),
        "cleanedPath": None,
    }
    records = _read_records()
    records.insert(0, record)
    _write_records(records)
    return _serialize(record)


def replace_audio(job_id: str, upload: UploadFile) -> TranscriptionJob:
    records = _read_records()
    record = _find_record(records, job_id)
    original_path = _write_upload(job_id, upload, "original")
    record.update(
        {
            "fileName": upload.filename or record["fileName"],
            "duration": "Pending",
            "status": "Needs cleanup",
            "updatedAt": "Just now",
            "progress": 0,
            "detectedLanguage": "Not detected",
            "transcript": "",
            "translation": "",
            "originalPath": _relative_path(original_path),
            "cleanedPath": None,
        }
    )
    _write_records(records)
    return _serialize(record)


def clean_audio(job_id: str) -> TranscriptionJob:
    records = _read_records()
    record = _find_record(records, job_id)
    if not record.get("originalPath"):
        raise HTTPException(status_code=400, detail="Upload audio before cleaning.")

    original_path = Path(record["originalPath"])
    if not original_path.is_absolute():
        original_path = ROOT_DIR / original_path
    cleaned_path = _record_dir(job_id) / f"cleaned{original_path.suffix}"
    shutil.copyfile(original_path, cleaned_path)
    record.update(
        {
            "status": "Processing",
            "updatedAt": "Just now",
            "progress": max(record["progress"], 35),
            "cleanedPath": _relative_path(cleaned_path),
        }
    )
    _write_records(records)
    return _serialize(record)


def transcribe_audio(job_id: str, language: str) -> TranscriptionJob:
    records = _read_records()
    record = _find_record(records, job_id)
    if not record.get("originalPath"):
        raise HTTPException(status_code=400, detail="Upload audio before transcription.")

    detected_language = LANGUAGE_LABELS.get(language, LANGUAGE_LABELS["auto"])
    record.update(
        {
            "status": "Ready for review",
            "updatedAt": "Just now",
            "progress": 80,
            "detectedLanguage": detected_language,
            "transcript": record["transcript"]
            or f"Interviewer: Please summarize the discussion in {record['fileName']}.\n\nParticipant: This locally stored recording is ready for review. The final transcription will be generated by the transcription service once it is connected.",
        }
    )
    _write_records(records)
    return _serialize(record)


def translate_transcript(job_id: str, source_language: str, target_language: str) -> TranscriptionJob:
    records = _read_records()
    record = _find_record(records, job_id)
    source_label = LANGUAGE_LABELS.get(source_language, source_language)
    target_label = LANGUAGE_LABELS.get(target_language, target_language)
    record.update(
        {
            "updatedAt": "Just now",
            "translation": f"[{source_label} to {target_label} translation]\n\n{record['transcript']}"
            if record["transcript"]
            else "Transcribe the audio before translating it.",
        }
    )
    _write_records(records)
    return _serialize(record)


def get_audio_path(job_id: str, kind: str) -> Path:
    records = _read_records()
    record = _find_record(records, job_id)
    key = "cleanedPath" if kind == "cleaned" else "originalPath"
    stored_path = record.get(key)
    if not stored_path:
        raise HTTPException(status_code=404, detail="Audio file not available")
    path = Path(stored_path)
    if not path.is_absolute():
        path = ROOT_DIR / path
    if not path.exists():
        raise HTTPException(status_code=404, detail="Audio file not available")
    return path
