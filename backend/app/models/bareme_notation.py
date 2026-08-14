from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Numeric
from sqlalchemy.orm import relationship

from app.core.database import Base


class BaremeNotation(Base):
    __tablename__ = "baremes_notation"

    id = Column(Integer, primary_key=True, index=True)
    etablissement_id = Column(Integer, ForeignKey("etablissement.id"), nullable=True)
    cycle_id = Column(Integer, ForeignKey("cycle.id"), nullable=True)
    code = Column(String(50), unique=True, nullable=False)
    libelle = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    note_min = Column(Numeric(5, 2), nullable=False)
    note_max = Column(Numeric(5, 2), nullable=False)
    est_systeme_defaut = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    etablissement = relationship("Etablissement")
    cycle = relationship("Cycle")
    mentions = relationship("MentionNotation", back_populates="bareme", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<BaremeNotation {self.code}: {self.libelle}>"
