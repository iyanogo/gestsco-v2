"""
Modèle SQLAlchemy pour les réservations de salles
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Date, Time, ForeignKey, Index
from sqlalchemy.orm import relationship

from app.core.database import Base


class ReservationSalle(Base):
    """Modèle représentant une réservation de salle"""
    
    __tablename__ = "reservations_salles"

    id = Column(Integer, primary_key=True, index=True)
    numero_reservation = Column(String(50), unique=True, nullable=False, index=True)  # généré automatiquement
    salle_id = Column(Integer, ForeignKey("salles.id"), nullable=False)
    demandeur_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date_reservation = Column(Date, nullable=False)
    heure_debut = Column(Time, nullable=False)
    heure_fin = Column(Time, nullable=False)
    motif = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    nombre_participants = Column(Integer, nullable=True)
    equipements_requis = Column(Text, nullable=True)  # JSON
    statut = Column(String(50), nullable=False, default="en_attente")  # en_attente, approuvee, refusee, annulee
    approuve_par = Column(Integer, ForeignKey("users.id"), nullable=True)
    date_approbation = Column(DateTime, nullable=True)
    motif_refus = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    salle = relationship("Salle", back_populates="reservations")
    demandeur = relationship("User", foreign_keys=[demandeur_id])
    approbateur = relationship("User", foreign_keys=[approuve_par])

    # Index pour recherches fréquentes
    __table_args__ = (
        Index('ix_reservations_salle_date_statut', 'salle_id', 'date_reservation', 'statut'),
    )

    def __repr__(self):
        return f"<ReservationSalle(id={self.id}, numero='{self.numero_reservation}', date='{self.date_reservation}', statut='{self.statut}')>"
