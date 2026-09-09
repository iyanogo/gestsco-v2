"""
Repository pour la gestion des configurations de délibération.
"""

from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.configuration_deliberation import ConfigurationDeliberation
from app.repositories.base_repository import BaseRepository
from app.schemas.configuration_deliberation import (
    ConfigurationDeliberationCreate,
    ConfigurationDeliberationUpdate,
)


class ConfigurationDeliberationRepository(
    BaseRepository[
        ConfigurationDeliberation,
        ConfigurationDeliberationCreate,
        ConfigurationDeliberationUpdate,
    ]
):
    """Repository pour les opérations CRUD sur les configurations de délibération."""

    def __init__(self):
        super().__init__(ConfigurationDeliberation)

    def get_by_annee(
        self,
        db: Session,
        annee_id: int,
        niveau_id: Optional[int] = None,
    ) -> List[ConfigurationDeliberation]:
        """Récupère les configurations d'une année, avec filtre niveau optionnel."""
        query = db.query(self.model).filter(
            self.model.annee_academique_id == annee_id
        )
        if niveau_id is not None:
            query = query.filter(self.model.niveau_id == niveau_id)
        return query.order_by(self.model.niveau_id.nullsfirst()).all()

    def get_globale(
        self, db: Session, annee_id: int
    ) -> Optional[ConfigurationDeliberation]:
        """Récupère la configuration globale d'une année."""
        return (
            db.query(self.model)
            .filter(
                self.model.annee_academique_id == annee_id,
                self.model.niveau_id.is_(None),
            )
            .first()
        )

    def get_by_niveau(
        self, db: Session, annee_id: int, niveau_id: int
    ) -> Optional[ConfigurationDeliberation]:
        """Récupère la configuration d'un niveau pour une année."""
        return (
            db.query(self.model)
            .filter(
                self.model.annee_academique_id == annee_id,
                self.model.niveau_id == niveau_id,
            )
            .first()
        )

    def get_applicable(
        self, db: Session, annee_id: int, niveau_id: int
    ) -> Optional[ConfigurationDeliberation]:
        """Récupère la configuration applicable (spécifique ou globale)."""
        config = self.get_by_niveau(db, annee_id, niveau_id)
        if config:
            return config
        return self.get_globale(db, annee_id)

    def find_by_annee_niveau(
        self,
        db: Session,
        annee_id: int,
        niveau_id: Optional[int],
    ) -> Optional[ConfigurationDeliberation]:
        """Trouve une configuration pour une année et un niveau (None = globale)."""
        query = db.query(self.model).filter(
            self.model.annee_academique_id == annee_id
        )
        if niveau_id is None:
            query = query.filter(self.model.niveau_id.is_(None))
        else:
            query = query.filter(self.model.niveau_id == niveau_id)
        return query.first()


configuration_deliberation_repository = ConfigurationDeliberationRepository()
