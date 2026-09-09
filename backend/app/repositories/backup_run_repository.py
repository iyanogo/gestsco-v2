from sqlalchemy.orm import Session

from app.models.backup_run import BackupRun


class BackupRunRepository:
    @staticmethod
    def list_all(db: Session, skip: int = 0, limit: int = 50) -> list[BackupRun]:
        return (
            db.query(BackupRun)
            .order_by(BackupRun.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_by_id(db: Session, backup_id: int) -> BackupRun | None:
        return db.query(BackupRun).filter(BackupRun.id == backup_id).first()

    @staticmethod
    def create(db: Session, backup: BackupRun) -> BackupRun:
        db.add(backup)
        db.flush()
        db.refresh(backup)
        return backup

    @staticmethod
    def update(db: Session, backup: BackupRun) -> BackupRun:
        db.add(backup)
        db.flush()
        db.refresh(backup)
        return backup
