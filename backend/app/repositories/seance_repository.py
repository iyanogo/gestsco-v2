"""
Repository pour la gestion des séances
"""
from datetime import date, timedelta
from typing import List, Optional, Union

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.models.seance import Seance
from app.models.creneau_horaire import CreneauHoraire
from app.repositories.base_repository import BaseRepository
from app.schemas.seance import SeanceCreate, SeanceUpdate, SeanceRecurrenteCreate
from app.utils.emploi_temps_utils import (
    verifier_disponibilite_salle,
    verifier_disponibilite_enseignant,
    verifier_conflit_niveau,
    generer_code_seance,
    get_jour_semaine,
    generer_seances_recurrentes
)


class SeanceRepository(BaseRepository[Seance, SeanceCreate, SeanceUpdate]):
    """Repository pour les opérations CRUD sur les séances"""

    def __init__(self):
        super().__init__(Seance)

    def get_by_date(
        self,
        db: Session,
        date_seance: date,
        niveau_id: Optional[int] = None,
        filiere_id: Optional[int] = None
    ) -> List[Seance]:
        """Retourne les séances d'une date donnée"""
        query = db.query(Seance).filter(
            Seance.date_seance == date_seance,
            Seance.statut.notin_(["annulee"])
        )
        
        if niveau_id:
            query = query.filter(Seance.niveau_id == niveau_id)
        
        if filiere_id:
            query = query.filter(
                or_(Seance.filiere_id == filiere_id, Seance.filiere_id.is_(None))
            )
        
        return query.order_by(Seance.creneau_id).all()

    def get_by_periode(
        self,
        db: Session,
        date_debut: date,
        date_fin: date,
        niveau_id: Optional[int] = None,
        filiere_id: Optional[int] = None
    ) -> List[Seance]:
        """Retourne les séances d'une période donnée"""
        query = db.query(Seance).filter(
            Seance.date_seance >= date_debut,
            Seance.date_seance <= date_fin,
            Seance.statut.notin_(["annulee"])
        )
        
        if niveau_id:
            query = query.filter(Seance.niveau_id == niveau_id)
        
        if filiere_id:
            query = query.filter(
                or_(Seance.filiere_id == filiere_id, Seance.filiere_id.is_(None))
            )
        
        return query.order_by(Seance.date_seance, Seance.creneau_id).all()

    def get_by_enseignant(
        self,
        db: Session,
        enseignant_id: int,
        date_debut: Optional[date] = None,
        date_fin: Optional[date] = None
    ) -> List[Seance]:
        """Retourne les séances d'un enseignant"""
        query = db.query(Seance).filter(
            Seance.enseignant_id == enseignant_id,
            Seance.statut.notin_(["annulee"])
        )
        
        if date_debut:
            query = query.filter(Seance.date_seance >= date_debut)
        
        if date_fin:
            query = query.filter(Seance.date_seance <= date_fin)
        
        return query.order_by(Seance.date_seance, Seance.creneau_id).all()

    def get_by_salle(
        self,
        db: Session,
        salle_id: int,
        date_seance: Optional[date] = None
    ) -> List[Seance]:
        """Retourne les séances d'une salle"""
        query = db.query(Seance).filter(
            Seance.salle_id == salle_id,
            Seance.statut.notin_(["annulee"])
        )
        
        if date_seance:
            query = query.filter(Seance.date_seance == date_seance)
        
        return query.order_by(Seance.date_seance, Seance.creneau_id).all()

    def get_by_matiere(
        self,
        db: Session,
        matiere_id: int,
        niveau_id: Optional[int] = None
    ) -> List[Seance]:
        """Retourne les séances d'une matière"""
        query = db.query(Seance).filter(
            Seance.matiere_id == matiere_id,
            Seance.statut.notin_(["annulee"])
        )
        
        if niveau_id:
            query = query.filter(Seance.niveau_id == niveau_id)
        
        return query.order_by(Seance.date_seance, Seance.creneau_id).all()

    def get_semaine(
        self,
        db: Session,
        date_debut: date,
        niveau_id: int,
        filiere_id: Optional[int] = None
    ) -> List[Seance]:
        """Retourne les séances d'une semaine (7 jours)"""
        date_fin = date_debut + timedelta(days=6)
        return self.get_by_periode(db, date_debut, date_fin, niveau_id, filiere_id)

    def _validate_planning(
        self,
        db: Session,
        *,
        date_seance: date,
        creneau_id: int,
        salle_id: Optional[int],
        enseignant_id: int,
        niveau_id: int,
        filiere_id: Optional[int],
        seance_id_exclue: Optional[int] = None,
    ) -> list[str]:
        """Vérifie salle, enseignant et niveau/filière sur un créneau."""
        errors: list[str] = []

        creneau = db.query(CreneauHoraire).filter(
            CreneauHoraire.id == creneau_id
        ).first()
        if not creneau:
            return ["Créneau horaire non trouvé"]

        if salle_id:
            if not verifier_disponibilite_salle(
                db,
                salle_id,
                date_seance,
                creneau.heure_debut,
                creneau.heure_fin,
                seance_id_exclue=seance_id_exclue,
            ):
                errors.append("La salle n'est pas disponible sur ce créneau")

        if not verifier_disponibilite_enseignant(
            db,
            enseignant_id,
            date_seance,
            creneau_id,
            seance_id_exclue=seance_id_exclue,
        ):
            errors.append("L'enseignant n'est pas disponible sur ce créneau")

        if not verifier_conflit_niveau(
            db,
            niveau_id,
            filiere_id,
            date_seance,
            creneau_id,
            seance_id_exclue=seance_id_exclue,
        ):
            errors.append("Un conflit existe pour ce niveau/filière sur ce créneau")

        return errors

    def create_with_verification(
        self,
        db: Session,
        seance_create: SeanceCreate
    ) -> Union[Seance, dict]:
        """Crée une séance après vérification des disponibilités"""
        errors = self._validate_planning(
            db,
            date_seance=seance_create.date_seance,
            creneau_id=seance_create.creneau_id,
            salle_id=seance_create.salle_id,
            enseignant_id=seance_create.enseignant_id,
            niveau_id=seance_create.niveau_id,
            filiere_id=seance_create.filiere_id,
        )

        if errors:
            return {"errors": errors}

        creneau = db.query(CreneauHoraire).filter(
            CreneauHoraire.id == seance_create.creneau_id
        ).first()
        
        # Générer le code de la séance
        from app.models.matiere import Matiere
        matiere = db.query(Matiere).filter(Matiere.id == seance_create.matiere_id).first()
        matiere_code = matiere.code if matiere else "MAT"
        
        code = generer_code_seance(matiere_code, seance_create.date_seance, creneau.code)
        jour_semaine = get_jour_semaine(seance_create.date_seance)
        
        # Créer la séance
        seance_data = seance_create.model_dump()
        seance_data["code"] = code
        seance_data["jour_semaine"] = jour_semaine
        
        seance = Seance(**seance_data)
        db.add(seance)
        db.commit()
        db.refresh(seance)
        
        return seance

    def update_with_verification(
        self,
        db: Session,
        seance_id: int,
        seance_update: SeanceUpdate,
    ) -> Union[Seance, dict]:
        """Met à jour une séance avec validation des conflits si le planning change."""
        seance = self.get_by_id(db, seance_id)
        if not seance:
            return {"errors": ["Séance non trouvée"]}

        update_data = seance_update.model_dump(exclude_unset=True)

        planning_fields = {
            "date_seance",
            "creneau_id",
            "salle_id",
            "enseignant_id",
            "niveau_id",
            "filiere_id",
        }
        planning_changed = bool(planning_fields.intersection(update_data.keys()))

        merged_date = update_data.get("date_seance", seance.date_seance)
        merged_creneau_id = update_data.get("creneau_id", seance.creneau_id)
        merged_salle_id = update_data.get("salle_id", seance.salle_id)
        merged_enseignant_id = update_data.get("enseignant_id", seance.enseignant_id)
        merged_niveau_id = update_data.get("niveau_id", seance.niveau_id)
        merged_filiere_id = update_data.get("filiere_id", seance.filiere_id)

        if planning_changed:
            errors = self._validate_planning(
                db,
                date_seance=merged_date,
                creneau_id=merged_creneau_id,
                salle_id=merged_salle_id,
                enseignant_id=merged_enseignant_id,
                niveau_id=merged_niveau_id,
                filiere_id=merged_filiere_id,
                seance_id_exclue=seance_id,
            )
            if errors:
                return {"errors": errors}

        if "date_seance" in update_data:
            update_data["jour_semaine"] = get_jour_semaine(update_data["date_seance"])

        for key, value in update_data.items():
            setattr(seance, key, value)

        db.commit()
        db.refresh(seance)
        return seance

    def create_recurrente(
        self,
        db: Session,
        seance_recurrente: SeanceRecurrenteCreate,
        user_id: int
    ) -> List[Seance]:
        """Crée plusieurs séances récurrentes"""
        seances_creees = []
        seance_base = seance_recurrente.seance_base.model_dump()
        
        # Générer les dates des séances
        seances_data = generer_seances_recurrentes(
            seance_base,
            seance_recurrente.date_fin_recurrence,
            seance_recurrente.jours_semaine
        )
        
        # Créer la première séance comme séance mère
        premiere_seance = None
        
        for seance_data in seances_data:
            seance_create = SeanceCreate(**{
                k: v for k, v in seance_data.items() 
                if k not in ["jour_semaine", "est_recurrente"]
            })
            
            result = self.create_with_verification(db, seance_create)
            
            if isinstance(result, Seance):
                if premiere_seance is None:
                    premiere_seance = result
                else:
                    # Lier à la séance mère
                    result.recurrence_id = premiere_seance.id
                    result.est_recurrente = True
                    db.commit()
                    db.refresh(result)
                
                seances_creees.append(result)
        
        return seances_creees

    def confirmer_seance(self, db: Session, id: int) -> Optional[Seance]:
        """Change le statut en 'confirmee'"""
        seance = self.get_by_id(db, id)
        if seance:
            seance.statut = "confirmee"
            db.commit()
            db.refresh(seance)
        return seance

    def annuler_seance(self, db: Session, id: int, motif: str) -> Optional[Seance]:
        """Change le statut en 'annulee' et enregistre le motif"""
        seance = self.get_by_id(db, id)
        if seance:
            seance.statut = "annulee"
            seance.observations = f"Annulée: {motif}" if motif else "Annulée"
            db.commit()
            db.refresh(seance)
        return seance

    def reporter_seance(
        self,
        db: Session,
        id: int,
        nouvelle_date: date,
        nouveau_creneau_id: int
    ) -> Union[Seance, dict]:
        """Reporte une séance à une nouvelle date/créneau"""
        seance = self.get_by_id(db, id)
        if not seance:
            return {"errors": ["Séance non trouvée"]}
        
        # Récupérer le nouveau créneau
        creneau = db.query(CreneauHoraire).filter(
            CreneauHoraire.id == nouveau_creneau_id
        ).first()
        
        if not creneau:
            return {"errors": ["Créneau horaire non trouvé"]}
        
        # Vérifier disponibilité de la salle
        if seance.salle_id:
            if not verifier_disponibilite_salle(
                db,
                seance.salle_id,
                nouvelle_date,
                creneau.heure_debut,
                creneau.heure_fin
            ):
                return {"errors": ["La salle n'est pas disponible sur le nouveau créneau"]}
        
        # Vérifier disponibilité de l'enseignant
        if not verifier_disponibilite_enseignant(
            db,
            seance.enseignant_id,
            nouvelle_date,
            nouveau_creneau_id
        ):
            return {"errors": ["L'enseignant n'est pas disponible sur le nouveau créneau"]}
        
        # Mettre à jour la séance
        ancienne_date = seance.date_seance
        seance.date_seance = nouvelle_date
        seance.creneau_id = nouveau_creneau_id
        seance.jour_semaine = get_jour_semaine(nouvelle_date)
        seance.statut = "reportee"
        seance.observations = f"Reportée du {ancienne_date} au {nouvelle_date}"
        
        db.commit()
        db.refresh(seance)
        
        return seance

    def get_conflits(
        self,
        db: Session,
        date_seance: date,
        creneau_id: int,
        salle_id: Optional[int] = None,
        enseignant_id: Optional[int] = None
    ) -> dict:
        """Retourne les conflits de salle et/ou enseignant"""
        conflits = {
            "salle": None,
            "enseignant": None
        }
        
        if salle_id:
            seance_salle = db.query(Seance).filter(
                Seance.salle_id == salle_id,
                Seance.date_seance == date_seance,
                Seance.creneau_id == creneau_id,
                Seance.statut.notin_(["annulee", "reportee"])
            ).first()
            
            if seance_salle:
                conflits["salle"] = {
                    "seance_id": seance_salle.id,
                    "code": seance_salle.code,
                    "matiere_id": seance_salle.matiere_id
                }
        
        if enseignant_id:
            seance_enseignant = db.query(Seance).filter(
                Seance.enseignant_id == enseignant_id,
                Seance.date_seance == date_seance,
                Seance.creneau_id == creneau_id,
                Seance.statut.notin_(["annulee", "reportee"])
            ).first()
            
            if seance_enseignant:
                conflits["enseignant"] = {
                    "seance_id": seance_enseignant.id,
                    "code": seance_enseignant.code,
                    "matiere_id": seance_enseignant.matiere_id
                }
        
        return conflits

    def get_by_code(self, db: Session, code: str) -> Optional[Seance]:
        """Retourne une séance par son code"""
        return db.query(Seance).filter(Seance.code == code).first()


seance_repository = SeanceRepository()
