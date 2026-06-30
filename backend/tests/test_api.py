from fastapi.testclient import TestClient

from app.config import ROOT_DIR
from app.main import app
from app.schemas import Article


app.state.request_delay_seconds = 0
client = TestClient(app)


def auth_headers() -> dict[str, str]:
    response = client.post(
        "/api/auth/login",
        json={
            "email": "admin@gmail.com",
            "password": "admin",
        },
    )
    token = response.json()["token"]
    return {"Authorization": f"Bearer {token}"}


def test_health_check() -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_current_user() -> None:
    response = client.get("/api/users/me", headers=auth_headers())

    assert response.status_code == 200
    assert response.json() == {
        "name": "Dr. Joy Aifuobhokhan",
        "initials": "JA",
        "department": "Sydani Institute for Research and Innovation",
    }


def test_project_collection_uses_frontend_contract() -> None:
    response = client.get("/api/projects", headers=auth_headers())

    assert response.status_code == 200
    projects = response.json()
    assert len(projects) == 6
    assert projects[0]["id"] == "paper-1"
    assert projects[0]["updatedAt"] == "Just now"
    assert projects[0]["stageId"] == "search"
    assert projects[0]["stageLabel"] == "Search"
    assert projects[0]["stageNumber"] == 2
    assert projects[0]["status"] == "In progress"
    assert projects[0]["researchLead"] == "Dr. Joy Aifuobhokhan"
    assert projects[0]["framework"] == "PICO"
    assert "sources" not in projects[0]
    assert "articles" not in projects[0]
    assert "researchQuestion" not in projects[0]


def test_project_detail() -> None:
    response = client.get("/api/projects/paper-4", headers=auth_headers())

    assert response.status_code == 200
    project = response.json()
    assert project["title"] == "School-based adolescent mental health screening models"
    assert project["researchLead"] == "Ngozi Eze"
    assert project["framework"] == "PCC"
    assert project["frameworkFields"] == {
        "population": "Adolescents in school settings",
        "concept": "School-based mental health screening models",
        "context": "West African education and health systems",
    }
    assert project["articles"] == []
    assert project["sources"][0]["searchTerm"]


def test_missing_project_returns_404() -> None:
    response = client.get("/api/projects/missing", headers=auth_headers())

    assert response.status_code == 404
    assert response.json() == {"detail": "Project not found"}


def test_search_route_returns_normalized_articles(monkeypatch) -> None:
    async def fake_search(source_id: str, source_name: str, search_term: str):
        assert source_id == "pubmed"
        assert source_name == "PubMed"
        assert search_term == "malaria"
        return [
            Article(
                id="pubmed-1",
                source="PubMed",
                title="Malaria uptake study",
                author="Bello F",
                sourceUrl="https://doi.org/10.1186/test",
                doi="10.1186/test",
                year="2024",
                journal="BMC Health Services Research",
                abstract="A test abstract.",
                fullTextStatus="Not pulled",
                selected=False,
                reviewDecision="Unreviewed",
            )
        ]

    monkeypatch.setattr("app.routes.search.search_literature_source", fake_search)

    response = client.post(
        "/api/search",
        headers=auth_headers(),
        json={
            "sourceId": "pubmed",
            "sourceName": "PubMed",
            "searchTerm": "malaria",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["sourceId"] == "pubmed"
    assert payload["articles"][0]["title"] == "Malaria uptake study"
    assert payload["articles"][0]["fullTextStatus"] == "Not pulled"


def test_generate_search_term_route(monkeypatch) -> None:
    async def fake_generate(request):
        assert request.source_id == "pubmed"
        assert request.source_name == "PubMed"
        assert request.research_question == "What affects uptake?"
        return '("malaria chemoprevention" OR SMC) AND uptake AND Nigeria'

    monkeypatch.setattr("app.routes.search.generate_source_search_term", fake_generate)

    response = client.post(
        "/api/search/terms",
        headers=auth_headers(),
        json={
            "sourceId": "pubmed",
            "sourceName": "PubMed",
            "title": "SMC uptake",
            "theme": "Malaria",
            "framework": "PICO",
            "frameworkFields": {
                "population": "Children eligible for SMC",
                "intervention": "SMC delivery",
                "comparison": "Standard delivery",
                "outcome": "Uptake",
            },
            "geography": "Nigeria",
            "researchQuestion": "What affects uptake?",
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "sourceId": "pubmed",
        "sourceName": "PubMed",
        "searchTerm": '("malaria chemoprevention" OR SMC) AND uptake AND Nigeria',
    }


def test_transcription_workflow_uses_backend_storage(tmp_path, monkeypatch) -> None:
    from app.services import transcriptions

    storage_dir = tmp_path / "transcriptions"
    monkeypatch.setattr(transcriptions, "STORAGE_DIR", storage_dir)
    monkeypatch.setattr(transcriptions, "METADATA_PATH", storage_dir / "records.json")

    upload_response = client.post(
        "/api/transcriptions",
        headers=auth_headers(),
        data={"title": "Interview one"},
        files={"file": ("interview.mp3", b"fake audio", "audio/mpeg")},
    )

    assert upload_response.status_code == 200
    job = upload_response.json()
    assert job["title"] == "Interview one"
    assert job["fileName"] == "interview.mp3"
    assert job["hasOriginalAudio"] is True
    assert job["hasCleanedAudio"] is False

    clean_response = client.post(f"/api/transcriptions/{job['id']}/clean", headers=auth_headers())
    assert clean_response.status_code == 200
    assert clean_response.json()["hasCleanedAudio"] is True

    transcribe_response = client.post(
        f"/api/transcriptions/{job['id']}/transcribe",
        headers=auth_headers(),
        json={"language": "auto"},
    )
    assert transcribe_response.status_code == 200
    assert transcribe_response.json()["detectedLanguage"] == "English + Hausa"
    assert transcribe_response.json()["transcript"]

    translate_response = client.post(
        f"/api/transcriptions/{job['id']}/translate",
        headers=auth_headers(),
        json={"sourceLanguage": "English + Hausa", "targetLanguage": "english"},
    )
    assert translate_response.status_code == 200
    assert translate_response.json()["translation"].startswith("[English + Hausa to English translation]")

    audio_response = client.get(
        f"/api/transcriptions/{job['id']}/audio/original",
        headers=auth_headers(),
    )
    assert audio_response.status_code == 200
    assert audio_response.content == b"fake audio"


def test_seed_transcriptions_reference_sample_audio(tmp_path, monkeypatch) -> None:
    from app.services import transcriptions

    storage_dir = tmp_path / "transcriptions"
    storage_dir.mkdir()
    metadata_path = storage_dir / "records.json"
    metadata_path.write_text(
        (ROOT_DIR / "storage" / "transcriptions" / "records.json").read_text(encoding="utf-8"),
        encoding="utf-8",
    )
    monkeypatch.setattr(transcriptions, "STORAGE_DIR", storage_dir)
    monkeypatch.setattr(transcriptions, "METADATA_PATH", metadata_path)

    response = client.get("/api/transcriptions", headers=auth_headers())

    assert response.status_code == 200
    recordings = response.json()
    assert recordings[0]["fileName"] == "Niger Audio SHEO.m4a"
    assert recordings[0]["duration"] == "28:10"
    assert recordings[0]["hasOriginalAudio"] is True
    assert recordings[1]["fileName"] == "CSOs LSN LRN ENG.mp3"
    assert recordings[1]["duration"] == "14:51"
    assert recordings[1]["hasOriginalAudio"] is True


def test_protected_routes_require_login() -> None:
    response = client.get("/api/projects")

    assert response.status_code == 401


def test_login_rejects_invalid_credentials() -> None:
    response = client.post(
        "/api/auth/login",
        json={
            "email": "admin@gmail.com",
            "password": "wrong-password",
        },
    )

    assert response.status_code == 401


def test_change_password_requires_matching_new_passwords() -> None:
    response = client.post(
        "/api/auth/change-password",
        headers=auth_headers(),
        json={
            "oldPassword": "admin",
            "newPassword": "new-password-1",
            "confirmPassword": "new-password-2",
        },
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "New passwords do not match."}
