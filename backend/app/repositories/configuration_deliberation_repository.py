"""
Repository pour la gestion des configurations de délibération.
"""

from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.configuration_deliberation import ConfigurationDeliberation
from app.repositories.base_repository import BaseRepository


class ConfigurationDeliberationRepository(BaseRepository[ConfigurationDeliberation]):
    """Repository pour les opérations CRUD sur les configurations de délibération."""
    
    def __init__(self, db: Session):
        super().__init__(ConfigurationDeliberation, db)
    
    def get_by_annee(self, annee_id: int) -> List[ConfigurationDeliberation]:
        """Récupère toutes les configurations d'une année."""
        return self.db.query(ConfigurationDeliberation).filter(
            ConfigurationDeliberation.annee_academique_id == annee_id
        ).all()
    
    def get_globale(self, annee_id: int) -> Optional[ConfigurationDeliberation]:
        """Récupère la configuration globale d'une année."""
        return self.db.query(ConfigurationDeliberation).filter(
            ConfigurationDeliberation.annee_academique_id == annee_id,
            ConfigurationDeliberation.niveau_id == None
        ).first()
    
    def get_by_niveau(
        self,
        annee_id: int,
        niveau_id: int
    ) -> Optional[ConfigurationDeliberation]:
        """Récupère la configuration d'un niveau pour une année."""
        return self.db.query(ConfigurationDeliberation).filter(
            ConfigurationDeliberation.annee_academique_id == annee_id,
            ConfigurationDeliberation.niveau_id == niveau_id
        ).first()
    
    def get_applicable(
        self,
        annee_id: int,
        niveau_id: int
    ) -> Optional[ConfigurationDeliberation]:
        """
        Récupère la configuration applicable (spécifique ou globale).
        Priorité à la config spécifique au niveau.
        """
        config = self.get_by_niveau(annee_id, niveau_id)
        if config:
            return config
        return self.get_globale(annee_id)
    
    def dupliquer_vers_niveaux(
        self,
        config_source_id: int,
        niveau_ids: List[int]
    ) -> List[ConfigurationDeliberation]:
        """Duplique une configuration vers plusieurs niveaux."""
        source = self.get_by_id(config_source_id)
        if not source:
            return []
        
        configs_creees = []
        for niveau_id in niveau_ids:
            # Vérifier si une config existe déjà
            existante = self.get_by_niveau(source.annee_academique_id, niveau_id)
            if existante:
                continue
            
            nouvelle = ConfigurationDeliberation(
                annee_academique_id=source.annee_academique_id,
                niveau_id=niveau_id,
                periodicite=source.periodicite,
                compensation_semestres=source.compensation_semestres,
                note_eliminatoire=source.note_eliminatoire,
                nombre_matieres_dette_max=source.nombre_matieres_dette_max,
                moyenne_validation=source.moyenne_validation,
                moyenne_passage_conditionnel=source.moyenne_passage_conditionnel,
                credits_min_passage=source.credits_min_passage,
                taux_presence_min=source.taux_presence_min,
                autoriser_rattrapage=source.autoriser_rattrapage,
                nombre_sessions_max=source.nombre_sessions_max,
                regles_specifiques=source.regles_specifiques
            )
            self.db.add(nouvelle)
            configs_creees.append(nouvelle)
        
        self.db.commit()
        return configs_creees
