import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.config import settings
from app.core.database import SessionLocal, get_db
from app.api.v1.api import api_router
from app.middleware.request_logging import RequestLoggingMiddleware
from app.services.administration_maintenance_service import AdministrationMaintenanceService


async def _maintenance_loop() -> None:
    interval = max(settings.ADMIN_MAINTENANCE_INTERVAL_HOURS, 1) * 3600
    while True:
        await asyncio.sleep(interval)
        db = SessionLocal()
        try:
            AdministrationMaintenanceService.run_all(db)
        except Exception:  # noqa: BLE001 - ne pas arrêter le serveur
            pass
        finally:
            db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = None
    if settings.ADMIN_MAINTENANCE_ENABLED:
        task = asyncio.create_task(_maintenance_loop())
    yield
    if task is not None:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass


app = FastAPI(
    title="GestSco API",
    description="API pour la gestion des établissements d'enseignement supérieur",
    version="1.0.0",
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestLoggingMiddleware)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health", tags=["Health"])
async def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Bienvenue sur l'API GestSco",
        "docs": "/docs",
        "health": "/health",
    }
