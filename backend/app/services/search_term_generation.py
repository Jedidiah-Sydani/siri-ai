import json

from fastapi import HTTPException

from app.schemas import GenerateSearchTermRequest
from app.services.openai_client import OpenAIChatClient, get_openai_chat_client


def build_search_term_messages(request: GenerateSearchTermRequest) -> list[dict[str, str]]:
    return [
        {
            "role": "system",
            "content": (
                "You are an expert medical research librarian. Generate one database-ready "
                "Boolean search string for the requested literature source. Combine synonyms "
                "with OR, combine concepts with AND, use quotes for exact phrases, and return "
                'only JSON in this shape: {"searchTerm": "..."}'
            ),
        },
        {
            "role": "user",
            "content": (
                f"Source: {request.source_name}\n"
                f"Research question: {request.research_question}"
                f"Working title: {request.title}\n"
                f"Theme: {request.theme}\n"
                f"Geography: {request.geography}\n"
                f"Framework: {request.framework}\n"
            ),
        },
    ]


def parse_search_term_response(content: str) -> str:
    try:
        payload = json.loads(content)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail="OpenAI returned invalid search term JSON.") from exc

    search_term = payload.get("searchTerm")
    if not isinstance(search_term, str) or not search_term.strip():
        raise HTTPException(status_code=502, detail="OpenAI did not return a search term.")

    return search_term.strip()


async def generate_source_search_term(
    request: GenerateSearchTermRequest,
    *,
    client: OpenAIChatClient | None = None,
) -> str:
    openai_client = client or get_openai_chat_client()
    content = await openai_client.chat_completion(
        messages=build_search_term_messages(request),
        response_format={"type": "json_object"},
    )
    return parse_search_term_response(content)
