from fastapi import APIRouter, HTTPException

from app.schemas import Project, ProjectSummary
from app.seed_data import get_project, get_project_summaries

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectSummary], response_model_by_alias=True)
def list_projects() -> list[ProjectSummary]:
    return get_project_summaries()


@router.get("/{project_id}", response_model=Project, response_model_by_alias=True)
def retrieve_project(project_id: str) -> Project:
    project = get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project
