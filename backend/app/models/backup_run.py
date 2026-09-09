from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, BigInteger, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class BackupRun(Base):
    """Métadonnées d'une sauvegarde PostgreSQL."""

    __tablename__ = "backup_runs"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(BigInteger, nullable=True)
    backup_type = Column(String(20), nullable=False, default="manual")
    status = Column(String(20), nullable=False, default="pending", index=True)
    triggered_by_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    finished_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    triggered_by = relationship("User", foreign_keys=[triggered_by_id])
