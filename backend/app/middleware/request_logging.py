"""Middleware - journalise les requêtes API dans system_logs."""

from __future__ import annotations

import time
from typing import Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.database import SessionLocal
from app.utils.administration_events import record_system_log

SKIP_PATHS = {"/health", "/", "/docs", "/openapi.json", "/redoc"}


def _level_for_status(status_code: int) -> str:
    if status_code >= 500:
        return "ERROR"
    if status_code >= 400:
        return "WARNING"
    return "INFO"


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - start) * 1000, 2)

        path = request.url.path
        if not path.startswith("/api/v1") or path in SKIP_PATHS:
            return response
        if path.startswith("/api/v1/administration/logs"):
            return response

        db = SessionLocal()
        try:
            record_system_log(
                db,
                level=_level_for_status(response.status_code),
                source="api",
                action=f"{request.method} {path}",
                message=f"{request.method} {path} → {response.status_code} ({duration_ms} ms)",
                ip_address=request.client.host if request.client else None,
                method=request.method,
                path=path,
                status_code=response.status_code,
                extra={"duration_ms": duration_ms},
            )
            db.commit()
        except Exception:
            db.rollback()
        finally:
            db.close()

        return response
