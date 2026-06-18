from fastapi import APIRouter

from app.schemas import User
from app.seed_data import CURRENT_USER

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=User)
def get_current_user() -> User:
    return CURRENT_USER.model_copy(deep=True)

