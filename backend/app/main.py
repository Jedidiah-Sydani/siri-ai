import asyncio

from fastapi import FastAPI
from fastapi import Request
from starlette.responses import Response

from app.config import load_root_env
from app.routes.auth import router as auth_router
from app.routes.projects import router as projects_router
from app.routes.search import router as search_router
from app.routes.users import router as users_router

load_root_env()

app = FastAPI(title="SIRI Research API", version="0.1.0")
app.state.request_delay_seconds = 3
app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(projects_router, prefix="/api")
app.include_router(search_router, prefix="/api")


@app.middleware("http")
async def delay_responses(request: Request, call_next) -> Response:
    await asyncio.sleep(request.app.state.request_delay_seconds)
    return await call_next(request)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
