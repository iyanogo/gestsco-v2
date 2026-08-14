"""
Repository pour la gestion des délibérations
"""

from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.models.deliberation import Deliberation
from app.models.resultat_semestre import ResultatSemestre
from app.models.resultat_annuel import ResultatAnnuel
from app.models.inscription import Inscription
from app.schemas.deliberation import DeliberationCreate, DeliberationUpdate
from app.repositories.base_repository import BaseRepository
from app.utils.calcul_notes import calculer_taux_reussite


class DeliberationRepository(BaseRepository[Deliberation, DeliberationCreate, DeliberationUpdate]):
    """Repository pour les opérations CRUD sur les délibérations."""

    def __init__(self):
        super().__init__(Deliberation)

    def get_by_session(
        self,
        db: Session,
        session_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> list[Deliberation]:
        """
        Liste les délibérations d'une session.
        
        Args:
            db: Session de base de données
            session_id: ID de la session
            skip: Nombre d'éléments à ignorer
            limit: Nombre maximum d'éléments
            
        Returns:
            Liste des délibérations
        """
        return db.query(Deliberation).filter(
            Deliberation.session_id == session_id
        ).offset(skip).limit(limit).all()

    def get_by_niveau_filiere(
        self,
        db: Session,
        niveau_id: int,
        filiere_id: int,
        session_id: Optional[int] = None
    ) -> list[Deliberation]:
        """
        Liste les délibérations d'un niveau et filière.
        
        Args:
            db: Session de base de données
            niveau_id: ID du niveau
            filiere_id: ID de la filière
            session_id: ID de la session (optionnel)
            
        Returns:
            Liste des délibérations
        """
        query = db.query(Deliberation).filter(
            Deliberation.niveau_id == niveau_id,
            Deliberation.filiere_id == filiere_id
        )
        
        if session_id:
            query = query.filter(Deliberation.session_id == session_id)
        
        return query.order_by(Deliberation.date_deliberation.desc()).all()

    def get_by_statut(
        self,
        db: Session,
        statut: str,
        skip: int = 0,
        limit: int = 100
    ) -> list[Deliberation]:
        """
        Liste les délibérations par statut.
        
        Args:
            db: Session de base de données
            statut: Statut recherché
            skip: Nombre d'éléments à ignorer
            limit: Nombre maximum d'éléments
            
        Returns:
            Liste des délibérations
        """
        return db.query(Deliberation).filter(
            Deliberation.statut == statut
        ).offset(skip).limit(limit).all()

    def creer_deliberation(
        self,
        db: Session,
        session_id: int,
        niveau_id: int,
        filiere_id: int,
        type_deliberation: str,
        semestre: Optional[int] = None,
        president_id: Optional[int] = None
    ) -> Deliberation:
        """
        Crée une nouvelle délibération avec calcul automatique des statistiques.
        
        Args:
            db: Session de base de données
            session_id: ID de la session
            niveau_id: ID du niveau
            filiere_id: ID de la filière
            type_deliberation: Type (semestrielle, annuelle)
            semestre: Numéro du semestre (pour délibération semestrielle)
            president_id: ID du président du jury
            
        Returns:
            La délibération créée
        """
        now = datetime.utcnow()
        
        # Calculer les statistiques
        stats = self._calculer_statistiques(
            db, session_id, niveau_id, filiere_id, type_deliberation, semestre
        )
        
        deliberation = Deliberation(
            session_id=session_id,
            niveau_id=niveau_id,
            filiere_id=filiere_id,
            date_deliberation=now,
            type_deliberation=type_deliberation,
            semestre=semestre,
            president_jury=president_id,
            nombre_etudiants=stats["nombre_etudiants"],
            nombre_admis=stats["nombre_admis"],
            nombre_ajournes=stats["nombre_ajournes"],
            nombre_redoublants=stats.get("nombre_redoublants", 0),
            taux_reussite=stats["taux_reussite"],
            statut="en_cours",
            publiee=False,
            created_at=now,
            updated_at=now
        )
        
        db.add(deliberation)
        db.commit()
        db.refresh(deliberation)
        return deliberation

    def _calculer_statistiques(
        self,
        db: Session,
        session_id: int,
        niveau_id: int,
        filiere_id: int,
        type_deliberation: str,
        semestre: Optional[int] = None
    ) -> dict:
        """
        Calcule les statistiques pour une délibération.
        """
        if type_deliberation == "semestrielle" and semestre:
            # Statistiques semestrielles
            resultats = db.query(ResultatSemestre).join(Inscription).filter(
                ResultatSemestre.session_id == session_id,
                ResultatSemestre.semestre == semestre,
                Inscription.niveau_id == niveau_id,
                Inscription.filiere_id == filiere_id
            ).all()
            
            nombre_etudiants = len(resultats)
            nombre_admis = len([r for r in resultats if r.decision in ("admis", "admis_avec_dette")])
            nombre_ajournes = len([r for r in resultats if r.decision == "ajourne"])
            
        else:
            # Statistiques annuelles
            resultats = db.query(ResultatAnnuel).join(Inscription).filter(
                Inscription.niveau_id == niveau_id,
                Inscription.filiere_id == filiere_id
            ).all()
            
            nombre_etudiants = len(resultats)
            nombre_admis = len([r for r in resultats if r.decision == "admis"])
            nombre_ajournes = len([r for r in resultats if r.decision in ("ajourne", "rattrapage")])
        
        taux_reussite = calculer_taux_reussite(nombre_admis, nombre_etudiants)
        
        return {
            "nombre_etudiants": nombre_etudiants,
            "nombre_admis": nombre_admis,
            "nombre_ajournes": nombre_ajournes,
            "nombre_redoublants": len([r for r in resultats if hasattr(r, 'decision') and r.decision == "redouble"]),
            "taux_reussite": taux_reussite
        }

    def terminer_deliberation(self, db: Session, id: int) -> Optional[Deliberation]:
        """
        Termine une délibération.
        
        Args:
            db: Session de base de données
            id: ID de la délibération
            
        Returns:
            La délibération mise à jour ou None
        """
        db_obj = self.get_by_id(db, id)
        if not db_obj:
            return None
        
        db_obj.statut = "terminee"
        db_obj.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def valider_deliberation(
        self,
        db: Session,
        id: int,
        user_id: int
    ) -> Optional[Deliberation]:
        """
        Valide une délibération.
        
        Args:
            db: Session de base de données
            id: ID de la délibération
            user_id: ID du validateur
            
        Returns:
            La délibération mise à jour ou None
        """
        db_obj = self.get_by_id(db, id)
        if not db_obj:
            return None
        
        now = datetime.utcnow()
        db_obj.statut = "validee"
        db_obj.validee_par = user_id
        db_obj.date_validation = now
        db_obj.updated_at = now
        
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def publier_deliberation(self, db: Session, id: int) -> Optional[Deliberation]:
        """
        Publie une délibération.
        
        Args:
            db: Session de base de données
            id: ID de la délibération
            
        Returns:
            La délibération mise à jour ou None
        """
        db_obj = self.get_by_id(db, id)
        if not db_obj:
            return None
        
        now = datetime.utcnow()
        db_obj.statut = "publiee"
        db_obj.publiee = True
        db_obj.date_publication = now
        db_obj.updated_at = now
        
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_statistiques(self, db: Session, id: int) -> dict:
        """
        Recalcule les statistiques d'une délibération.
        
        Args:
            db: Session de base de données
            id: ID de la délibération
            
        Returns:
            Dictionnaire avec les statistiques
        """
        db_obj = self.get_by_id(db, id)
        if not db_obj:
            return {}
        
        return self._calculer_statistiques(
            db,
            db_obj.session_id,
            db_obj.niveau_id,
            db_obj.filiere_id,
            db_obj.type_deliberation,
            db_obj.semestre
        )

    def actualiser_statistiques(self, db: Session, id: int) -> Optional[Deliberation]:
        """
        Actualise les statistiques d'une délibération.
        
        Args:
            db: Session de base de données
            id: ID de la délibération
            
        Returns:
            La délibération mise à jour ou None
        """
        db_obj = self.get_by_id(db, id)
        if not db_obj:
            return None
        
        stats = self.get_statistiques(db, id)
        
        db_obj.nombre_etudiants = stats["nombre_etudiants"]
        db_obj.nombre_admis = stats["nombre_admis"]
        db_obj.nombre_ajournes = stats["nombre_ajournes"]
        db_obj.nombre_redoublants = stats.get("nombre_redoublants", 0)
        db_obj.taux_reussite = stats["taux_reussite"]
        db_obj.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_obj)
        return db_obj


# Instance singleton du repository
deliberation_repository = DeliberationRepository()
