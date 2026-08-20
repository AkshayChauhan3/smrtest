from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "SmartRail OS"
    app_env: str = "development"
    api_v1_prefix: str = "/api/v1"
    cors_origins: list[str] = [
        "http://localhost:3000", "http://localhost:5173", "http://localhost:8080",
        "http://127.0.0.1:3000", "http://127.0.0.1:5173", "http://127.0.0.1:8080",
        "http://10.0.2.2:8000", "*"
    ]
    jwt_secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    jwt_refresh_token_expire_days: int = 7
    database_url: str = "sqlite+aiosqlite:///smartrailos_dev.db"
    # Development override: pin the simulation clock to this HH:MM time at startup.
    # Useful when running outside the 06:20-22:09 service window.
    # Set via env var DEV_SIM_TIME=09:00 or in .env, or pass --dev-time to the dev script.
    dev_sim_time: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            val_stripped = value.strip()
            if val_stripped.startswith("[") and val_stripped.endswith("]"):
                import json
                try:
                    return json.loads(val_stripped)
                except Exception:
                    pass
            return [origin.strip() for origin in val_stripped.split(",") if origin.strip()]
        return value


@lru_cache

def get_settings() -> Settings:
    return Settings()


settings = get_settings()
