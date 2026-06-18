import os
import re
from html import unescape
from xml.etree import ElementTree

import httpx
from fastapi import HTTPException

from app.schemas import Article


NCBI_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
SCOPUS_SEARCH_URL = "https://api.elsevier.com/content/search/scopus"
GOOGLE_CUSTOM_SEARCH_URL = "https://www.googleapis.com/customsearch/v1"
DEFAULT_TIMEOUT = 20
PUBMED_MAX_RECORDS = 10_000
PUBMED_FETCH_BATCH_SIZE = 200
SCOPUS_PAGE_SIZE = 25
SCOPUS_MAX_RECORDS = 5_000
GOOGLE_PAGE_SIZE = 10
GOOGLE_MAX_RECORDS = 100


def clean_search_term(search_term: str) -> str:
    return search_term.strip()


def article_id(source_id: str, key: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "-", key.lower()).strip("-")
    return f"{source_id}-{cleaned[:80] or 'record'}"


def publication_year(value: str | int | None) -> str:
    if value is None:
        return ""
    match = re.search(r"(19|20)\d{2}", str(value))
    return match.group(0) if match else ""


def dedupe_articles(articles: list[Article]) -> list[Article]:
    seen = set()
    unique_articles = []

    for article in articles:
        key = (article.doi or article.title).strip().lower()
        if not key or key in seen:
            continue
        seen.add(key)
        unique_articles.append(article)

    return unique_articles


def first_text(element: ElementTree.Element, path: str) -> str:
    found = element.find(path)
    return "".join(found.itertext()).strip() if found is not None else ""


def pubmed_authors_from_xml(element: ElementTree.Element) -> str:
    authors = []
    for author_element in element.findall(".//AuthorList/Author"):
        collective_name = first_text(author_element, "CollectiveName")
        if collective_name:
            authors.append(collective_name)
            continue

        last_name = first_text(author_element, "LastName")
        initials = first_text(author_element, "Initials")
        if last_name:
            authors.append(f"{last_name} {initials}".strip())

    return "; ".join(authors[:3])


def pubmed_article_from_xml(element: ElementTree.Element, source_name: str) -> Article:
    pmid = first_text(element, ".//PMID")
    title = unescape(first_text(element, ".//ArticleTitle"))
    journal = unescape(first_text(element, ".//Journal/Title"))
    year = (
        first_text(element, ".//JournalIssue/PubDate/Year")
        or publication_year(first_text(element, ".//PubDate/MedlineDate"))
    )
    abstract_parts = [
        " ".join(part.itertext()).strip()
        for part in element.findall(".//Abstract/AbstractText")
    ]
    doi = ""
    for article_id_element in element.findall(".//ArticleId"):
        if article_id_element.attrib.get("IdType") == "doi":
            doi = (article_id_element.text or "").strip()
            break

    key = doi or pmid or title
    source_url = f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/" if pmid else ""
    return Article(
        id=article_id("pubmed", key),
        source=source_name,
        title=title or "Untitled PubMed record",
        author=pubmed_authors_from_xml(element),
        sourceUrl=source_url,
        doi=doi,
        year=year,
        journal=journal,
        abstract=" ".join(abstract_parts),
        fullTextStatus="Not pulled",
        selected=False,
        reviewDecision="Unreviewed",
    )


async def search_pubmed(
    client: httpx.AsyncClient,
    source_name: str,
    search_term: str,
) -> list[Article]:
    query = clean_search_term(search_term)
    if not query:
        return []

    search_response = await client.get(
        f"{NCBI_BASE_URL}/esearch.fcgi",
        params={
            "db": "pubmed",
            "term": query,
            "retmode": "json",
            "retmax": PUBMED_MAX_RECORDS,
            "sort": "relevance",
        },
    )
    search_response.raise_for_status()
    ids = search_response.json().get("esearchresult", {}).get("idlist", [])
    if not ids:
        return []

    articles = []
    for start in range(0, len(ids), PUBMED_FETCH_BATCH_SIZE):
        batch_ids = ids[start : start + PUBMED_FETCH_BATCH_SIZE]
        fetch_response = await client.get(
            f"{NCBI_BASE_URL}/efetch.fcgi",
            params={
                "db": "pubmed",
                "id": ",".join(batch_ids),
                "retmode": "xml",
            },
        )
        fetch_response.raise_for_status()
        root = ElementTree.fromstring(fetch_response.text)
        articles.extend(
            pubmed_article_from_xml(article_element, source_name)
            for article_element in root.findall(".//PubmedArticle")
        )

    return dedupe_articles(articles)


def scopus_article_from_payload(payload: dict, source_name: str) -> Article:
    doi = payload.get("prism:doi") or ""
    title = payload.get("dc:title") or "Untitled Scopus record"
    author = payload.get("dc:creator") or payload.get("authname") or ""
    links = payload.get("link") or []
    source_url = ""
    for link in links:
        if link.get("@ref") in {"scopus", "self"} and link.get("@href"):
            source_url = link["@href"]
            break
    key = doi or payload.get("dc:identifier") or payload.get("eid") or title

    return Article(
        id=article_id("scopus", key),
        source=source_name,
        title=title,
        author=author,
        sourceUrl=source_url,
        doi=doi,
        year=publication_year(payload.get("prism:coverDate")),
        journal=payload.get("prism:publicationName") or "",
        abstract=payload.get("dc:description") or "",
        fullTextStatus="Not pulled",
        selected=False,
        reviewDecision="Unreviewed",
    )


async def search_scopus(
    client: httpx.AsyncClient,
    source_name: str,
    search_term: str,
) -> list[Article]:
    api_key = os.getenv("SCOPUS_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="Scopus search requires SCOPUS_API_KEY.",
        )

    query = clean_search_term(search_term)
    if not query:
        return []

    articles = []
    headers = {
        "Accept": "application/json",
        "X-ELS-APIKey": api_key,
    }

    for start in range(0, SCOPUS_MAX_RECORDS, SCOPUS_PAGE_SIZE):
        response = await client.get(
            SCOPUS_SEARCH_URL,
            headers=headers,
            params={
                "query": query,
                "count": SCOPUS_PAGE_SIZE,
                "start": start,
                "field": "dc:identifier,eid,dc:title,dc:creator,authname,prism:doi,prism:coverDate,prism:publicationName,dc:description,link",
            },
        )
        response.raise_for_status()
        search_results = response.json().get("search-results", {})
        page = search_results.get("entry", [])
        articles.extend(scopus_article_from_payload(item, source_name) for item in page)

        total_results = int(search_results.get("opensearch:totalResults", 0) or 0)
        if not page or start + len(page) >= total_results:
            break

    return dedupe_articles(articles)


def google_article_from_payload(payload: dict, source_name: str) -> Article:
    title = payload.get("title") or "Untitled Google result"
    link = payload.get("link") or ""
    snippet = payload.get("snippet") or ""
    metatags = (payload.get("pagemap") or {}).get("metatags") or []
    author = ""
    if metatags:
        metadata = metatags[0]
        author = (
            metadata.get("citation_author")
            or metadata.get("dc.creator")
            or metadata.get("article:author")
            or ""
        )

    return Article(
        id=article_id("scholar", link or title),
        source=source_name,
        title=title,
        author=author,
        sourceUrl=link,
        doi="",
        year=publication_year(snippet),
        journal="",
        abstract=snippet,
        fullTextStatus="Not pulled",
        selected=False,
        reviewDecision="Unreviewed",
    )


async def search_google_custom_search(
    client: httpx.AsyncClient,
    source_name: str,
    search_term: str,
) -> list[Article]:
    api_key = os.getenv("GOOGLE_CSE_API_KEY", "").strip()
    search_engine_id = os.getenv("GOOGLE_CSE_ID", "").strip()
    if not api_key or not search_engine_id:
        raise HTTPException(
            status_code=503,
            detail=(
                "Google Scholar search requires GOOGLE_CSE_API_KEY and "
                "GOOGLE_CSE_ID. Google Scholar does not provide a public "
                "Scholar-specific API."
            ),
        )

    query = clean_search_term(search_term)
    if not query:
        return []

    articles = []
    for start in range(1, GOOGLE_MAX_RECORDS + 1, GOOGLE_PAGE_SIZE):
        response = await client.get(
            GOOGLE_CUSTOM_SEARCH_URL,
            params={
                "key": api_key,
                "cx": search_engine_id,
                "q": query,
                "num": GOOGLE_PAGE_SIZE,
                "start": start,
            },
        )
        response.raise_for_status()
        payload = response.json()
        page = payload.get("items", [])
        articles.extend(google_article_from_payload(item, source_name) for item in page)

        if not page or "nextPage" not in payload.get("queries", {}):
            break

    return dedupe_articles(articles)


async def search_literature_source(
    source_id: str,
    source_name: str,
    search_term: str,
) -> list[Article]:
    try:
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            if source_id == "pubmed":
                return await search_pubmed(client, source_name, search_term)
            if source_id == "scopus":
                return await search_scopus(client, source_name, search_term)
            if source_id == "scholar":
                return await search_google_custom_search(client, source_name, search_term)
    except HTTPException:
        raise
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 429:
            raise HTTPException(
                status_code=429,
                detail=f"{source_name} rate limit reached.",
            ) from exc
        raise HTTPException(
            status_code=502,
            detail=f"{source_name} returned status {exc.response.status_code}.",
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Unable to reach {source_name}.",
        ) from exc

    raise HTTPException(status_code=400, detail="Unsupported search source.")
