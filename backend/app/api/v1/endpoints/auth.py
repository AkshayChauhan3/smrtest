from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.auth import LoginRequest, RefreshRequest, RegisterRequest, TokenResponse, UserOut
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)) -> UserOut:
    auth_service = AuthService(db)
    try:
        user = await auth_service.register(
            email=payload.email,
            full_name=payload.full_name,
            password=payload.password,
            role=payload.role,
        )
        return UserOut(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            role=user.role,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    auth_service = AuthService(db)
    try:
        access_token, refresh_token = await auth_service.login(
            email=payload.email,
            password=payload.password,
        )
        return TokenResponse(access_token=access_token, refresh_token=refresh_token)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.post("/refresh", response_model=TokenResponse)
async def refresh(payload: RefreshRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    from app.core.security import decode_token, create_access_token
    from jose import JWTError
    try:
        payload_data = decode_token(payload.refresh_token)
        if payload_data.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
        user_id = payload_data.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid subject")
        new_access = create_access_token(user_id)
        return TokenResponse(access_token=new_access, refresh_token=payload.refresh_token)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
