# SIRI Research Backend

This service will own the application domain and data:

- Authentication, sessions, and authorization
- Users and project memberships
- Research projects and workflow stages
- Search strategies and imported articles
- Selection, retrieval, and review decisions
- Comments, collaboration, and activity history
- Calls to research sources and the existing AI orchestrator

The initial read API serves the signed-in user and the existing research project data:

```text
GET /api/health
GET /api/users/me
GET /api/projects
GET /api/projects/{project_id}
POST /api/search
```

The collection route returns list summaries only. The item route returns the full
idea, sources, search terms, articles, selections, and review data.

The data currently lives in `app/seed_data.py`. This gives the frontend a real API
boundary while database-backed create and update operations are developed.

All responses currently include a three-second artificial delay so the frontend
loading states remain visible during development.

## Literature Search

`POST /api/search` accepts a source and manual search terms. It returns normalized
article records the frontend can merge into the open project. The frontend does
not send a result limit; the backend pages or batches behind the scenes until the
source API stops returning results or the source's own retrieval ceiling is
reached.

Supported sources:

- PubMed: NCBI E-utilities, no credentials required for the basic call.
  ESearch can return the first 10,000 PubMed records for a query through the API,
  and EFetch is batched in groups of 200.
- Semantic Scholar: Graph API paper search. Basic calls can work without a key,
  but `SEMANTIC_SCHOLAR_API_KEY` is supported for higher rate limits. Results are
  paged in groups of 100.
- Google Scholar: implemented through Google Programmable Search, which requires
  `GOOGLE_CSE_API_KEY` and `GOOGLE_CSE_ID`. Without those variables, the endpoint
  returns a configuration error instead of scraping Scholar. Custom Search pages
  10 results at a time and exposes up to 100 results for a query.
