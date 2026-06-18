# SIRI Research Workspace

Internal research workflow application for the Sydani Institute for Research and Innovation.

## Structure

```text
frontend/  React and Vite user interface
backend/   Research application API
```

The web application owns presentation and browser interactions. The API will own authentication, users, projects, workflow state, articles, comments, permissions, persistence, and communication with external research sources and the existing AI service.

## Web application

Start the API in one terminal:

```bash
npm run dev:api
```

Then start the Vite application in another:

```bash
npm install
npm run dev
```

Vite proxies `/api` requests to `http://127.0.0.1:8000`.

```bash
npm run dev:web
```

## API

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

After that one-time setup, `npm run dev:api` and `npm run test:api` can be run
from the repository root without activating the environment.

The first API boundary exposes the signed-in user, lightweight project summaries,
and full project details:

```text
GET /api/health
GET /api/users/me
GET /api/projects
GET /api/projects/{project_id}
POST /api/search
```

`GET /api/projects` only returns fields required by the home-page list. Opening a
project requests its current full detail from `GET /api/projects/{project_id}`.

Project edits remain in React state until create and update routes are added.

Search currently supports PubMed through NCBI E-utilities and Semantic Scholar
through the Semantic Scholar Graph API. Google Scholar does not provide a public
Scholar-specific API, so the Google tab uses Google Programmable Search when
`GOOGLE_CSE_API_KEY` and `GOOGLE_CSE_ID` are configured.

The frontend does not send a search result limit. The backend fetches all records
available within each source API's own retrieval rules and batches the calls when
the source requires pagination.

Run all frontend and backend tests from the repository root:

```bash
npm test
```
