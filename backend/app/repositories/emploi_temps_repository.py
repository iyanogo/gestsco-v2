"""
Repository pour la gestion des emplois du temps
"""
from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.emploi_temps import EmploiTemps
from app.models.seance import Seance
from app.repositories.base_repository import BaseRepository
from app.schemas.emploi_temps import EmploiTempsCreate, EmploiTempsUpdate


class EmploiTempsRepository(BaseRepository[EmploiTemps, EmploiTempsCreate, EmploiTempsUpdate]):
    """Repository pour les opérations CRUD sur les emplois du temps"""

    def __init__(self):
        super().__init__(EmploiTemps)

    def get_by_niveau_filiere(
        self,
        db: Session,
        niveau_id: int,
        filiere_id: Optional[int] = None,
        semestre: Optional[int] = None,
        annee_id: Optional[int] = None
    ) -> List[EmploiTemps]:
        """Retourne les emplois du temps d'un niveau/filière"""
        query = db.query(EmploiTemps).filter(EmploiTemps.niveau_id == niveau_id)
        
        if filiere_id:
            query = query.filter(EmploiTemps.filiere_id == filiere_id)
        
        if semestre:
            query = query.filter(EmploiTemps.semestre == semestre)
        
        if annee_id:
            query = query.filter(EmploiTemps.annee_academique_id == annee_id)
        
        return query.order_by(EmploiTemps.created_at.desc()).all()

    def get_actif(
        self,
        db: Session,
        niveau_id: int,
        filiere_id: Optional[int],
        semestre: int,
        annee_id: int
    ) -> Optional[EmploiTemps]:
        """Retourne l'emploi du temps publié (statut='publie')"""
        query = db.query(EmploiTemps).filter(
            EmploiTemps.niveau_id == niveau_id,
            EmploiTemps.semestre == semestre,
            EmploiTemps.annee_academique_id == annee_id,
            EmploiTemps.statut == "publie"
        )
        
        if filiere_id:
            query = query.filter(EmploiTemps.filiere_id == filiere_id)
        else:
            query = query.filter(EmploiTemps.filiere_id.is_(None))
        
        return query.first()

    def valider(self, db: Session, id: int) -> Optional[EmploiTemps]:
        """Change le statut en 'valide'"""
        emploi_temps = self.get_by_id(db, id)
        if emploi_temps and emploi_temps.statut == "brouillon":
            emploi_temps.statut = "valide"
            db.commit()
            db.refresh(emploi_temps)
        return emploi_temps

    def publier(self, db: Session, id: int, user_id: int) -> Optional[EmploiTemps]:
        """Change le statut en 'publie'"""
        emploi_temps = self.get_by_id(db, id)
        if emploi_temps and emploi_temps.statut in ["brouillon", "valide"]:
            # Archiver l'ancien emploi du temps publié s'il existe
            ancien = self.get_actif(
                db,
                emploi_temps.niveau_id,
                emploi_temps.filiere_id,
                emploi_temps.semestre,
                emploi_temps.annee_academique_id
            )
            if ancien and ancien.id != id:
                ancien.statut = "archive"
                db.commit()
            
            emploi_temps.statut = "publie"
            emploi_temps.publie_le = datetime.utcnow()
            emploi_temps.publie_par = user_id
            db.commit()
            db.refresh(emploi_temps)
        return emploi_temps

    def archiver(self, db: Session, id: int) -> Optional[EmploiTemps]:
        """Change le statut en 'archive'"""
        emploi_temps = self.get_by_id(db, id)
        if emploi_temps:
            emploi_temps.statut = "archive"
            db.commit()
            db.refresh(emploi_temps)
        return emploi_temps

    def get_with_seances(self, db: Session, id: int) -> Optional[dict]:
        """Retourne l'emploi du temps avec toutes ses séances"""
        emploi_temps = self.get_by_id(db, id)
        if not emploi_temps:
            return None
        
        # Récupérer les séances correspondantes
        seances = db.query(Seance).filter(
            Seance.niveau_id == emploi_temps.niveau_id,
            Seance.annee_academique_id == emploi_temps.annee_academique_id,
            Seance.semestre == emploi_temps.semestre,
            Seance.date_seance >= emploi_temps.date_debut,
            Seance.date_seance <= emploi_temps.date_fin,
            Seance.statut.notin_(["annulee"])
        )
        
        if emploi_temps.filiere_id:
            seances = seances.filter(
                (Seance.filiere_id == emploi_temps.filiere_id) | 
                (Seance.filiere_id.is_(None))
            )
        
        seances = seances.order_by(Seance.date_seance, Seance.creneau_id).all()
        
        # Construire la réponse
        result = {
            "id": emploi_temps.id,
            "code": emploi_temps.code,
            "libelle": emploi_temps.libelle,
            "niveau_id": emploi_temps.niveau_id,
            "filiere_id": emploi_temps.filiere_id,
            "semestre": emploi_temps.semestre,
            "annee_academique_id": emploi_temps.annee_academique_id,
            "date_debut": emploi_temps.date_debut,
            "date_fin": emploi_temps.date_fin,
            "statut": emploi_temps.statut,
            "version": emploi_temps.version,
            "publie_le": emploi_temps.publie_le,
            "publie_par": emploi_temps.publie_par,
            "observations": emploi_temps.observations,
            "created_at": emploi_temps.created_at,
            "updated_at": emploi_temps.updated_at,
            "seances": []
        }
        
        for seance in seances:
            seance_data = {
                "id": seance.id,
                "code": seance.code,
                "matiere_id": seance.matiere_id,
                "niveau_id": seance.niveau_id,
                "filiere_id": seance.filiere_id,
                "enseignant_id": seance.enseignant_id,
                "salle_id": seance.salle_id,
                "creneau_id": seance.creneau_id,
                "type_seance": seance.type_seance,
                "date_seance": seance.date_seance,
                "jour_semaine": seance.jour_semaine,
                "semestre": seance.semestre,
                "duree_minutes": seance.duree_minutes,
                "statut": seance.statut,
                "matiere_libelle": seance.matiere.libelle if seance.matiere else None,
                "matiere_code": seance.matiere.code if seance.matiere else None,
                "enseignant_nom": seance.enseignant.full_name if seance.enseignant else None,
                "salle_libelle": seance.salle.libelle if seance.salle else None,
                "salle_code": seance.salle.code if seance.salle else None,
                "creneau_libelle": seance.creneau.libelle if seance.creneau else None,
            }
            result["seances"].append(seance_data)
        
        return result

    def get_by_code(self, db: Session, code: str) -> Optional[EmploiTemps]:
        """Retourne un emploi du temps par son code"""
        return db.query(EmploiTemps).filter(EmploiTemps.code == code).first()


emploi_temps_repository = EmploiTempsRepository()
