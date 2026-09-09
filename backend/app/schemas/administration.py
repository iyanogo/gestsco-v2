from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class SystemLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    level: str
    source: str
    action: Optional[str] = None
    message: str
    user_id: Optional[int] = None
    user_email: Optional[str] = None
    ip_address: Optional[str] = None
    method: Optional[str] = None
    path: Optional[str] = None
    status_code: Optional[int] = None
    extra: Optional[dict[str, Any]] = None
    created_at: datetime


class SystemLogSummary(BaseModel):
    total: int
    info: int
    warning: int
    error: int
    success: int


class AuditEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    action: str
    entity_type: str
    entity_id: str
    user_id: Optional[int] = None
    user_email: Optional[str] = None
    old_values: Optional[dict[str, Any]] = None
    new_values: Optional[dict[str, Any]] = None
    ip_address: Optional[str] = None
    details: Optional[str] = None
    created_at: datetime


class BackupRunRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    filename: str
    file_size_bytes: Optional[int] = None
    backup_type: str
    status: str
    triggered_by_id: Optional[int] = None
    started_at: datetime
    finished_at: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime


class RbacMatrixRowRead(BaseModel):
    module: str
    module_label: str
    action: str
    action_label: str
    roles: list[str]


class RbacMatrixRowUpdate(BaseModel):
    module: str
    action: str
    roles: list[str]


class RbacMatrixUpdateRequest(BaseModel):
    rows: list[RbacMatrixRowUpdate]


class PermissionsSummaryRead(BaseModel):
    total_users: int
    active_count: int
    inactive_count: int
    superuser_count: int
    by_role: dict[str, int]


class BackupRestoreRequest(BaseModel):
    confirm_phrase: str


class RetentionPurgeRequest(BaseModel):
    older_than_days: int = Field(default=90, ge=1, le=3650)
    confirm_phrase: str


class PurgeResultRead(BaseModel):
    deleted_count: int
    older_than_days: int
    message: str
