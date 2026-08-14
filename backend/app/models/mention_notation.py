from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Numeric, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base


class MentionNotation(Base):
    __tablename__ = "mentions_notation"
    __table_args__ = (
        UniqueConstraint('bareme_id', 'code', name='uq_mention_bareme_code'),
    )

    id = Column(Integer, primary_key=True, index=True)
    bareme_id = Column(Integer, ForeignKey("baremes_notation.id"), nullable=False)
    code = Column(String(50), nullable=False)
    libelle = Column(String(255), nullable=False)
    note_min = Column(Numeric(5, 2), nullable=False)
    note_max = Column(Numeric(5, 2), nullable=False)
    couleur = Column(String(7), nullable=True)  # code couleur hex
    ordre = Column(Integer, nullable=False, default=0)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relations
    bareme = relationship("BaremeNotation", back_populates="mentions")

    def __repr__(self):
        return f"<MentionNotation {self.code}: {self.libelle} ({self.note_min}-{self.note_max})>"
