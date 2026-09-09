from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class TemplateDocument(Base):
    __tablename__ = "templates_document"

    id = Column(Integer, primary_key=True, index=True)
    etablissement_id = Column(Integer, ForeignKey("etablissement.id"), nullable=True)
    code = Column(String(50), unique=True, nullable=False)  # BULLETIN, ATTESTATION, RELEVE, FACTURE, RECU, etc.
    libelle = Column(String(255), nullable=False)
    type_document = Column(String(50), nullable=False)  # bulletin, attestation, certificat, facture, recu, autre
    description = Column(Text, nullable=True)
    template_html = Column(Text, nullable=False)  # template HTML avec variables
    template_css = Column(Text, nullable=True)
    variables_disponibles = Column(Text, nullable=True)  # JSON array des variables utilisables
    format_papier = Column(String(20), nullable=False, default="A4")  # A4, Letter
    orientation = Column(String(20), nullable=False, default="portrait")  # portrait, landscape
    marges = Column(String(100), nullable=True)  # JSON: {top, right, bottom, left}
    en_tete_html = Column("entete_html", Text, nullable=True)
    pied_page_html = Column(Text, nullable=True)
    est_systeme_defaut = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    etablissement = relationship("Etablissement")

    def __repr__(self):
        return f"<TemplateDocument {self.code}: {self.libelle}>"
