"""
Modèle SQLAlchemy pour les séances de cours
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Date, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base


class Seance(Base):
    """Modèle représentant une séance de cours/TD/TP"""
    
    __tablename__ = "seances"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)  # généré automatiquement
    matiere_id = Column(Integer, ForeignKey("matiere.id"), nullable=False)
    niveau_id = Column(Integer, ForeignKey("niveau.id"), nullable=False)
    filiere_id = Column(Integer, ForeignKey("filiere.id"), nullable=True)
    enseignant_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    salle_id = Column(Integer, ForeignKey("salles.id"), nullable=True)
    creneau_id = Column(Integer, ForeignKey("creneaux_horaires.id"), nullable=False)
    type_seance = Column(String(50), nullable=False)  # cours, td, tp, examen, soutenance
    date_seance = Column(Date, nullable=False)
    jour_semaine = Column(Integer, nullable=False)  # 1=Lundi, 7=Dimanche
    semestre = Column(Integer, nullable=False)  # 1 ou 2
    annee_academique_id = Column(Integer, ForeignKey("annees_academiques.id"), nullable=False)
    duree_minutes = Column(Integer, nullable=False, default=120)
    effectif_prevu = Column(Integer, nullable=True)
    effectif_present = Column(Integer, nullable=True)
    statut = Column(String(50), nullable=False, default="planifiee")  # planifiee, confirmee, en_cours, terminee, annulee, reportee
    est_recurrente = Column(Boolean, default=False)
    recurrence_id = Column(Integer, ForeignKey("seances.id"), nullable=True)  # référence à la séance mère si récurrente
    observations = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    matiere = relationship("Matiere")
    niveau = relationship("Niveau")
    filiere = relationship("Filiere")
    enseignant = relationship("User", foreign_keys=[enseignant_id])
    salle = relationship("Salle", back_populates="seances")
    creneau = relationship("CreneauHoraire", back_populates="seances")
    annee_academique = relationship("AnneeAcademique")
    seance_mere = relationship("Seance", remote_side=[id], foreign_keys=[recurrence_id])
    presences = relationship("Presence", back_populates="seance", cascade="all, delete-orphan")

    # Index et contraintes
    __table_args__ = (
        # Contrainte unique pour éviter les conflits de salle/créneau
        UniqueConstraint('date_seance', 'creneau_id', 'salle_id', name='uq_seance_date_creneau_salle'),
        # Index pour recherches fréquentes
        Index('ix_seances_enseignant_date', 'enseignant_id', 'date_seance'),
        Index('ix_seances_niveau_date', 'niveau_id', 'date_seance'),
        Index('ix_seances_annee_semestre', 'annee_academique_id', 'semestre'),
    )

    def __repr__(self):
        return f"<Seance(id={self.id}, code='{self.code}', date='{self.date_seance}', type='{self.type_seance}')>"
