from datetime import datetime, timedelta
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import FileResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_superuser
from app.models.user import User
from app.repositories.audit_event_repository import AuditEventRepository
from app.repositories.system_log_repository import SystemLogRepository
from app.schemas.administration import (
    AuditEventRead,
    BackupRestoreRequest,
    BackupRunRead,
    PermissionsSummaryRead,
    PurgeResultRead,
    RbacMatrixRowRead,
    RbacMatrixUpdateRequest,
    RetentionPurgeRequest,
    SystemLogRead,
    SystemLogSummary,
)
from app.services.backup_service import BackupService
from app.utils.administration_events import audit_and_commit
from app.utils.rbac_matrix import get_rbac_matrix_rows

router = APIRouter()

RESTORE_CONFIRM = "RESTAURER"
PURGE_CONFIRM = "PURGER"


def _parse_datetime(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


@router.get("/logs/summary", response_model=SystemLogSummary)
async def logs_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
) -> Any:
    return SystemLogRepository.summary(db)


@router.get("/logs", response_model=list[SystemLogRead])
async def list_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
    level: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    user_email: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = Query(100, le=500),
) -> Any:
    return SystemLogRepository.list_filtered(
        db,
        level=level,
        source=source,
        user_email=user_email,
        search=search,
        date_from=_parse_datetime(date_from),
        date_to=_parse_datetime(date_to),
        skip=skip,
        limit=limit,
    )


@router.get("/audit", response_model=list[AuditEventRead])
async def list_audit_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
    action: Optional[str] = Query(None),
    entity_type: Optional[str] = Query(None),
    user_email: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = Query(100, le=500),
) -> Any:
    return AuditEventRepository.list_filtered(
        db,
        action=action,
        entity_type=entity_type,
        user_email=user_email,
        search=search,
        date_from=_parse_datetime(date_from),
        date_to=_parse_datetime(date_to),
        skip=skip,
        limit=limit,
    )


@router.get("/backups", response_model=list[BackupRunRead])
async def list_backups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
    skip: int = 0,
    limit: int = Query(50, le=100),
) -> Any:
    return BackupService.list_backups(db, skip=skip, limit=limit)


@router.post("/backups", response_model=BackupRunRead, status_code=status.HTTP_201_CREATED)
async def create_backup(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
) -> Any:
    return BackupService.create_manual_backup(db, current_user)


@router.post("/logs/purge", response_model=PurgeResultRead)
async def purge_logs(
    body: RetentionPurgeRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
) -> Any:
    if body.confirm_phrase != PURGE_CONFIRM:
        raise HTTPException(status_code=400, detail=f"Confirmez avec le mot '{PURGE_CONFIRM}'")
    cutoff = datetime.utcnow() - timedelta(days=body.older_than_days)
    deleted = SystemLogRepository.delete_older_than(db, cutoff)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="delete",
        entity_type="system_log",
        entity_id="purge",
        new_values={"deleted_count": deleted, "older_than_days": body.older_than_days},
        details="retention_purge",
    )
    return PurgeResultRead(
        deleted_count=deleted,
        older_than_days=body.older_than_days,
        message=f"{deleted} entrée(s) de log supprimée(s).",
    )


@router.post("/audit/purge", response_model=PurgeResultRead)
async def purge_audit_events(
    body: RetentionPurgeRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
) -> Any:
    if body.confirm_phrase != PURGE_CONFIRM:
        raise HTTPException(status_code=400, detail=f"Confirmez avec le mot '{PURGE_CONFIRM}'")
    cutoff = datetime.utcnow() - timedelta(days=body.older_than_days)
    deleted = AuditEventRepository.delete_older_than(db, cutoff)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="delete",
        entity_type="audit_event",
        entity_id="purge",
        new_values={"deleted_count": deleted, "older_than_days": body.older_than_days},
        details="retention_purge",
    )
    return PurgeResultRead(
        deleted_count=deleted,
        older_than_days=body.older_than_days,
        message=f"{deleted} événement(s) d'audit supprimé(s).",
    )


@router.post("/backups/{backup_id}/restore", response_model=BackupRunRead)
async def restore_backup(
    backup_id: int,
    body: BackupRestoreRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
) -> Any:
    if body.confirm_phrase != RESTORE_CONFIRM:
        raise HTTPException(status_code=400, detail=f"Confirmez avec le mot '{RESTORE_CONFIRM}'")
    try:
        run = BackupService.restore_backup(db, backup_id, current_user)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="backup",
        entity_id=backup_id,
        new_values={"status": run.status, "filename": run.filename},
        details="restore",
    )
    if run.status == "failed":
        raise HTTPException(status_code=503, detail=run.error_message or "Restauration échouée")
    return run


@router.get("/backups/{backup_id}/download")
async def download_backup(
    backup_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
) -> FileResponse:
    result = BackupService.get_backup_file(db, backup_id)
    if not result:
        raise HTTPException(status_code=404, detail="Sauvegarde introuvable ou incomplète")
    run, path = result
    return FileResponse(
        path=str(path),
        filename=run.filename,
        media_type="application/sql",
    )


@router.get("/permissions/matrix", response_model=list[RbacMatrixRowRead])
async def permissions_matrix(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
) -> Any:
    return get_rbac_matrix_rows(db)


@router.put("/permissions/matrix", response_model=list[RbacMatrixRowRead])
async def update_permissions_matrix(
    body: RbacMatrixUpdateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
) -> Any:
    from app.repositories.rbac_permission_repository import RbacPermissionRepository

    old_rows = get_rbac_matrix_rows(db)
    try:
        RbacPermissionRepository.replace_matrix(
            db,
            [row.model_dump() for row in body.rows],
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    new_rows = get_rbac_matrix_rows(db, seed_if_empty=False)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="rbac_permission",
        entity_id="matrix",
        old_values={"row_count": len(old_rows)},
        new_values={"row_count": len(new_rows)},
        details="matrix_update",
    )
    return new_rows


@router.get("/permissions/summary", response_model=PermissionsSummaryRead)
async def permissions_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
) -> Any:
    total = db.query(func.count(User.id)).scalar() or 0
    active_count = db.query(func.count(User.id)).filter(User.is_active.is_(True)).scalar() or 0
    superuser_count = (
        db.query(func.count(User.id)).filter(User.is_superuser.is_(True)).scalar() or 0
    )
    role_rows = db.query(User.role, func.count(User.id)).group_by(User.role).all()
    by_role = {role: count for role, count in role_rows}
    return PermissionsSummaryRead(
        total_users=total,
        active_count=active_count,
        inactive_count=total - active_count,
        superuser_count=superuser_count,
        by_role=by_role,
    )
