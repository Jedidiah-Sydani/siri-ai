from fastapi import APIRouter, Depends

from app.schemas import User
from app.services.auth import get_authenticated_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=User)
def get_current_user(user: User = Depends(get_authenticated_user)) -> User:
    return user
