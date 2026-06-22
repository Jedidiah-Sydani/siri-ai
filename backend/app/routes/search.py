from fastapi import APIRouter, Depends

from app.schemas import GenerateSearchTermRequest, GenerateSearchTermResponse, SearchRequest, SearchResponse
from app.services.literature_search import search_literature_source
from app.services.auth import get_authenticated_user
from app.services.search_term_generation import generate_source_search_term

router = APIRouter(prefix="/search", tags=["search"], dependencies=[Depends(get_authenticated_user)])


@router.post("", response_model=SearchResponse, response_model_by_alias=True)
async def search_source(request: SearchRequest) -> SearchResponse:
    articles = await search_literature_source(
        request.source_id,
        request.source_name,
        request.search_term,
    )
    return SearchResponse(
        sourceId=request.source_id,
        sourceName=request.source_name,
        articles=articles,
    )


@router.post("/terms", response_model=GenerateSearchTermResponse, response_model_by_alias=True)
async def generate_search_term(request: GenerateSearchTermRequest) -> GenerateSearchTermResponse:
    search_term = await generate_source_search_term(request)
    return GenerateSearchTermResponse(
        sourceId=request.source_id,
        sourceName=request.source_name,
        searchTerm=search_term,
    )
