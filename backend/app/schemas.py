from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ApiModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)


class User(ApiModel):
    name: str
    initials: str
    department: str


class LoginRequest(ApiModel):
    email: str
    password: str


class AuthResponse(ApiModel):
    token: str
    user: User


class ChangePasswordRequest(ApiModel):
    old_password: str = Field(alias="oldPassword")
    new_password: str = Field(alias="newPassword")
    confirm_password: str = Field(alias="confirmPassword")


class Collaborator(ApiModel):
    id: str
    name: str
    initials: str


class ResearchSource(ApiModel):
    id: str
    name: str
    enabled: bool
    result_count: int = Field(alias="resultCount")
    last_run: str = Field(alias="lastRun")
    search_term: str = Field(alias="searchTerm")


class Article(ApiModel):
    id: str
    source: str
    title: str
    author: str
    source_url: str = Field(alias="sourceUrl")
    doi: str
    year: str
    journal: str
    abstract: str
    full_text_status: Literal["Not pulled", "Pulled"] = Field(alias="fullTextStatus")
    selected: bool
    review_decision: Literal["Unreviewed", "Included", "Maybe", "Excluded"] = Field(
        alias="reviewDecision"
    )


class SearchRequest(ApiModel):
    source_id: Literal["pubmed", "scholar", "scopus", "openalex"] = Field(alias="sourceId")
    source_name: str = Field(alias="sourceName")
    search_term: str = Field(alias="searchTerm")


class SearchResponse(ApiModel):
    source_id: str = Field(alias="sourceId")
    source_name: str = Field(alias="sourceName")
    articles: list[Article]


class GenerateSearchTermRequest(ApiModel):
    source_id: Literal["pubmed", "scholar", "scopus", "openalex"] = Field(alias="sourceId")
    source_name: str = Field(alias="sourceName")
    title: str
    theme: str
    framework: str
    framework_fields: dict[str, str] = Field(alias="frameworkFields")
    geography: str
    research_question: str = Field(alias="researchQuestion")


class GenerateSearchTermResponse(ApiModel):
    source_id: str = Field(alias="sourceId")
    source_name: str = Field(alias="sourceName")
    search_term: str = Field(alias="searchTerm")


class Project(ApiModel):
    id: str
    title: str
    theme: str
    research_lead: str = Field(alias="researchLead")
    framework: str
    framework_fields: dict[str, str] = Field(alias="frameworkFields")
    geography: str
    updated_at: str = Field(alias="updatedAt")
    research_question: str = Field(alias="researchQuestion")
    sources: list[ResearchSource]
    articles: list[Article]
    collaborators: list[Collaborator] = []
    archived: bool = False


class ProjectSummary(ApiModel):
    id: str
    title: str
    theme: str
    research_lead: str = Field(alias="researchLead")
    framework: str
    geography: str
    updated_at: str = Field(alias="updatedAt")
    stage_id: Literal["idea", "search", "screening", "retrieval", "review"] = Field(
        alias="stageId"
    )
    stage_label: str = Field(alias="stageLabel")
    stage_number: int = Field(alias="stageNumber")
    progress: int
    status: Literal["Ideation", "In progress", "Complete", "Archived"]
    collaborators: list[Collaborator] = []
    archived: bool = False


class TranscriptionJob(ApiModel):
    id: str
    title: str
    file_name: str = Field(alias="fileName")
    duration: str
    status: Literal["Ready for review", "Processing", "Needs cleanup"]
    updated_at: str = Field(alias="updatedAt")
    progress: int
    detected_language: str = Field(alias="detectedLanguage")
    transcript: str
    translation: str
    has_original_audio: bool = Field(alias="hasOriginalAudio")
    has_cleaned_audio: bool = Field(alias="hasCleanedAudio")


class TranscribeRequest(ApiModel):
    language: str


class TranslateRequest(ApiModel):
    source_language: str = Field(alias="sourceLanguage")
    target_language: str = Field(alias="targetLanguage")
