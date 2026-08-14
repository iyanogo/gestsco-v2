"""
Repository pour les opérations sur les années scolaires
"""

from sqlalchemy.orm import Session

from app.models.annee_scolaire import Annee
from app.schemas.annee_scolaire import AnneeCreate, AnneeUpdate
from app.repositories.base_repository import BaseRepository


class AnneeRepository(BaseRepository[Annee, AnneeCreate, AnneeUpdate]):
    """Repository pour les opérations sur les années scolaires."""

    def __init__(self):
        super().__init__(Annee)

    def get_active(self, db: Session) -> Annee | None:
        """Récupère l'année scolaire active (statut=True)."""
        return (
            db.query(Annee)
            .filter(Annee.statut == True)
            .first()
        )

    def set_active(self, db: Session, id: int) -> Annee | None:
        """Définit une année scolaire comme active et désactive les autres."""
        db.query(Annee).update({Annee.statut: False})
        annee = db.query(Annee).filter(Annee.id == id).first()
        if annee:
            annee.statut = True
            db.commit()
            db.refresh(annee)
        return annee

    def get_all_ordered(self, db: Session) -> list[Annee]:
        """Liste toutes les années scolaires triées par code décroissant."""
        return (
            db.query(Annee)
            .order_by(Annee.code.desc())
            .all()
        )


annee_repository = AnneeRepository()
