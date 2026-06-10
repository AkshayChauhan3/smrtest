from fastapi import APIRouter

from app.schemas.auth import LoginRequest, RefreshRequest, RegisterRequest, TokenResponse

router = APIRouter()


@router.post("/register", response_model=dict)
async def register(payload: RegisterRequest) -> dict[str, str]:
    return {"message": "Registration contract ready", "email": str(payload.email), "role": payload.role}


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest) -> TokenResponse:
    return TokenResponse(access_token="demo-access-token", refresh_token="demo-refresh-token")


@router.post("/refresh", response_model=TokenResponse)
async def refresh(payload: RefreshRequest) -> TokenResponse:
    return TokenResponse(access_token="demo-access-token", refresh_token=payload.refresh_token)
