from fastapi.testclient import TestClient

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
