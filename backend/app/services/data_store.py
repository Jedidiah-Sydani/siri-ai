import json
from copy import deepcopy
from pathlib import Path

from app.config import ROOT_DIR
from app.schemas import Project, ProjectSummary, User


USER_PATH = ROOT_DIR / "storage" / "users" / "current.json"
PROJECTS_PATH = ROOT_DIR / "storage" / "projects" / "records.json"


def _read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def get_current_user() -> User:
    return User.model_validate(_read_json(USER_PATH))


def get_projects() -> list[Project]:
    return [Project.model_validate(project) for project in _read_json(PROJECTS_PATH)]


def get_project(project_id: str) -> Project | None:
    return next((deepcopy(project) for project in get_projects() if project.id == project_id), None)


def get_project_summaries() -> list[ProjectSummary]:
    stage_labels = {
        "idea": "Ideation",
        "search": "Search",
        "screening": "Screening",
        "retrieval": "Retrieval",
        "review": "Review",
    }
    stage_ids = tuple(stage_labels)

    summaries = []
    for project in get_projects():
        selected = [article for article in project.articles if article.selected]
        reviewed = [
            article
            for article in selected
            if article.review_decision in {"Included", "Maybe", "Excluded"}
        ]
        terms = {source.search_term.strip() for source in project.sources if source.search_term.strip()}

        if reviewed:
            stage_id = "review"
        elif any(article.full_text_status == "Pulled" for article in selected):
            stage_id = "retrieval"
        elif selected:
            stage_id = "screening"
        elif project.articles or terms:
            stage_id = "search"
        else:
            stage_id = "idea"

        stage_number = stage_ids.index(stage_id) + 1
        fully_reviewed = bool(selected) and len(reviewed) == len(selected)
        status = (
            "Archived"
            if project.archived
            else "Ideation"
            if stage_id == "idea"
            else "Complete"
            if stage_id == "review" and fully_reviewed
            else "In progress"
        )

        summaries.append(
            ProjectSummary(
                id=project.id,
                title=project.title,
                theme=project.theme,
                researchLead=project.research_lead,
                framework=project.framework,
                geography=project.geography,
                updatedAt=project.updated_at,
                stageId=stage_id,
                stageLabel=stage_labels[stage_id],
                stageNumber=stage_number,
                progress=max(1, round(stage_number / len(stage_ids) * 100)),
                status=status,
                collaborators=project.collaborators,
                archived=project.archived,
            )
        )

    return summaries
