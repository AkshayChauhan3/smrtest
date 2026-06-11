from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, create_refresh_token, hash_password, verify_password
from app.models.user import User


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def register(self, email: str, full_name: str, password: str, role: str) -> User:
        # Prevent duplicate users by email.
        existing = await self.db.execute(select(User).where(User.email == email))
        if existing.scalar_one_or_none() is not None:
            raise ValueError("User with this email already exists")

        user = User(
            email=email,
            full_name=full_name,
            hashed_password=hash_password(password),
            role=role,
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def login(self, email: str, password: str) -> tuple[str, str]:
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if user is None or not verify_password(password, user.hashed_password):
            raise ValueError("Invalid credentials")

        access_token = create_access_token(str(user.id))
        refresh_token = create_refresh_token(str(user.id))
        return access_token, refresh_token