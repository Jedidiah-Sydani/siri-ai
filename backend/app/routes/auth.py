from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas import AuthResponse, ChangePasswordRequest, LoginRequest
from app.services.auth import authenticate, change_password, get_authenticated_user, issue_token
from app.services.data_store import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=AuthResponse, response_model_by_alias=True)
def login(request: LoginRequest) -> AuthResponse:
    if not authenticate(request.email, request.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    return AuthResponse(token=issue_token(), user=get_current_user())


@router.post("/change-password")
def update_password(
    request: ChangePasswordRequest,
    _current_user=Depends(get_authenticated_user),
) -> dict[str, str]:
    change_password(request.old_password, request.new_password, request.confirm_password)
    return {"status": "ok"}
