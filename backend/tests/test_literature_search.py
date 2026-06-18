import httpx
import pytest
from fastapi import HTTPException

from app.services.literature_search import (
    search_google_custom_search,
    search_literature_source,
    search_pubmed,
    search_scopus,
)


@pytest.mark.anyio
async def test_pubmed_search_maps_efetch_records() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path.endswith("/esearch.fcgi"):
            return httpx.Response(
                200,
                json={"esearchresult": {"idlist": ["123"]}},
            )
        return httpx.Response(
            200,
            text="""
            <PubmedArticleSet>
              <PubmedArticle>
                <MedlineCitation>
                  <PMID>123</PMID>
                    <Article>
                      <ArticleTitle>Community health worker retention</ArticleTitle>
                      <AuthorList>
                        <Author><LastName>Bello</LastName><Initials>F</Initials></Author>
                        <Author><LastName>Okeke</LastName><Initials>A</Initials></Author>
                      </AuthorList>
                      <Journal>
                      <Title>BMC Health Services Research</Title>
                      <JournalIssue><PubDate><Year>2024</Year></PubDate></JournalIssue>
                    </Journal>
                    <Abstract><AbstractText>Retention abstract.</AbstractText></Abstract>
                  </Article>
                </MedlineCitation>
                <PubmedData>
                  <ArticleIdList>
                    <ArticleId IdType="doi">10.1186/example</ArticleId>
                  </ArticleIdList>
                </PubmedData>
              </PubmedArticle>
            </PubmedArticleSet>
            """,
        )

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        articles = await search_pubmed(client, "PubMed", "health workers")

    assert len(articles) == 1
    assert articles[0].title == "Community health worker retention"
    assert articles[0].author == "Bello F; Okeke A"
    assert articles[0].doi == "10.1186/example"
    assert articles[0].year == "2024"
    assert articles[0].source == "PubMed"


@pytest.mark.anyio
async def test_pubmed_search_fetches_results_in_batches() -> None:
    calls = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(request)
        if request.url.path.endswith("/esearch.fcgi"):
            return httpx.Response(
                200,
                json={"esearchresult": {"idlist": [str(index) for index in range(1, 202)]}},
            )
        ids = request.url.params["id"].split(",")
        articles = "".join(
            f"""
            <PubmedArticle>
              <MedlineCitation>
                <PMID>{pmid}</PMID>
                <Article><ArticleTitle>Article {pmid}</ArticleTitle></Article>
              </MedlineCitation>
            </PubmedArticle>
            """
            for pmid in ids
        )
        return httpx.Response(200, text=f"<PubmedArticleSet>{articles}</PubmedArticleSet>")

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        articles = await search_pubmed(client, "PubMed", "health workers")

    fetch_calls = [call for call in calls if call.url.path.endswith("/efetch.fcgi")]
    assert len(articles) == 201
    assert len(fetch_calls) == 2
    assert len(fetch_calls[0].url.params["id"].split(",")) == 200
    assert len(fetch_calls[1].url.params["id"].split(",")) == 1


@pytest.mark.anyio
async def test_scopus_search_maps_records(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SCOPUS_API_KEY", "test-key")

    async with httpx.AsyncClient(
        transport=httpx.MockTransport(
            lambda request: httpx.Response(
                200,
                json={
                    "search-results": {
                        "opensearch:totalResults": "1",
                        "entry": [
                            {
                                "eid": "2-s2.0-abc",
                                "dc:title": "School screening models",
                                "dc:creator": "Eze N",
                                "prism:coverDate": "2023-04-17",
                                "prism:publicationName": "BMC Psychiatry",
                                "dc:description": "A study abstract.",
                                "prism:doi": "10.1186/scopus",
                            }
                        ],
                    }
                },
            )
        )
    ) as client:
        articles = await search_scopus(client, "Scopus", "screening")

    assert len(articles) == 1
    assert articles[0].title == "School screening models"
    assert articles[0].author == "Eze N"
    assert articles[0].journal == "BMC Psychiatry"
    assert articles[0].doi == "10.1186/scopus"


@pytest.mark.anyio
async def test_scopus_search_requires_configuration(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("SCOPUS_API_KEY", raising=False)

    async with httpx.AsyncClient(transport=httpx.MockTransport(lambda request: httpx.Response(200))) as client:
        with pytest.raises(HTTPException) as exc:
            await search_scopus(client, "Scopus", "malaria")

    assert exc.value.status_code == 503
    assert "SCOPUS_API_KEY" in exc.value.detail


@pytest.mark.anyio
async def test_google_search_requires_configuration(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("GOOGLE_CSE_API_KEY", raising=False)
    monkeypatch.delenv("GOOGLE_CSE_ID", raising=False)

    async with httpx.AsyncClient(transport=httpx.MockTransport(lambda request: httpx.Response(200))) as client:
        with pytest.raises(HTTPException) as exc:
            await search_google_custom_search(client, "Google Scholar", "malaria")

    assert exc.value.status_code == 503
    assert "GOOGLE_CSE_API_KEY" in exc.value.detail


@pytest.mark.anyio
async def test_source_rate_limits_are_reported(monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_scopus_search(*args, **kwargs):
        request = httpx.Request("GET", "https://example.test")
        response = httpx.Response(429, request=request)
        raise httpx.HTTPStatusError("rate limited", request=request, response=response)

    monkeypatch.setattr(
        "app.services.literature_search.search_scopus",
        fake_scopus_search,
    )

    with pytest.raises(HTTPException) as exc:
        await search_literature_source("scopus", "Scopus", "malaria")

    assert exc.value.status_code == 429
    assert "rate limit" in exc.value.detail
