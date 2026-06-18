import pytest
from fastapi import HTTPException

from app.schemas import GenerateSearchTermRequest
from app.services.search_term_generation import (
    build_search_term_messages,
    generate_source_search_term,
    parse_search_term_response,
)


class FakeOpenAIClient:
    def __init__(self, content: str) -> None:
        self.content = content
        self.messages = None
        self.response_format = None

    async def chat_completion(self, **kwargs):
        self.messages = kwargs["messages"]
        self.response_format = kwargs["response_format"]
        return self.content


def make_request() -> GenerateSearchTermRequest:
    return GenerateSearchTermRequest(
        sourceId="pubmed",
        sourceName="PubMed",
        title="Community health worker retention",
        theme="Health workforce",
        framework="PICO",
        geography="Nigeria",
        researchQuestion="What factors influence retention?",
    )


def test_build_search_term_messages_include_project_context() -> None:
    messages = build_search_term_messages(make_request())

    assert messages[0]["role"] == "system"
    assert "Boolean search string" in messages[0]["content"]
    assert "Community health worker retention" in messages[1]["content"]
    assert "What factors influence retention?" in messages[1]["content"]


def test_parse_search_term_response() -> None:
    assert parse_search_term_response('{"searchTerm": "malaria AND Nigeria"}') == "malaria AND Nigeria"


def test_parse_search_term_response_rejects_invalid_json() -> None:
    with pytest.raises(HTTPException) as exc:
        parse_search_term_response("malaria AND Nigeria")

    assert exc.value.status_code == 502


@pytest.mark.anyio
async def test_generate_source_search_term_uses_json_chat_completion() -> None:
    client = FakeOpenAIClient('{"searchTerm": "retention AND Nigeria"}')

    result = await generate_source_search_term(make_request(), client=client)

    assert result == "retention AND Nigeria"
    assert client.response_format == {"type": "json_object"}
    assert client.messages is not None
