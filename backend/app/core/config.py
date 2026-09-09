from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    PROJECT_NAME: str = "GestSco API"
    API_V1_STR: str = "/api/v1"
    BACKUP_DIR: str = "backups"

    # Maintenance administration (rétention + sauvegarde planifiée)
    ADMIN_MAINTENANCE_ENABLED: bool = False
    ADMIN_MAINTENANCE_INTERVAL_HOURS: int = 24
    ADMIN_LOG_RETENTION_DAYS: int = 90
    ADMIN_AUDIT_RETENTION_DAYS: int = 365
    ADMIN_SCHEDULED_BACKUP_ENABLED: bool = False


settings = Settings()
