"""
Repository pour la gestion des présences
"""
from datetime import date, datetime
from typing import List, Optional

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.presence import Presence
from app.models.seance import Seance
from app.models.etudiant import Etudiant
from app.models.inscription import Inscription
from app.models.inscription_matiere import InscriptionMatiere
from app.models.annee_academique import AnneeAcademique
from app.repositories.base_repository import BaseRepository
from app.schemas.presence import PresenceCreate, PresenceUpdate, PresenceBulkCreate


class PresenceRepository(BaseRepository[Presence, PresenceCreate, PresenceUpdate]):
    """Repository pour les opérations CRUD sur les présences"""

    def __init__(self):
        super().__init__(Presence)

    def get_by_seance(self, db: Session, seance_id: int) -> List[Presence]:
        """Retourne les présences d'une séance"""
        return db.query(Presence).filter(
            Presence.seance_id == seance_id
        ).all()

    def get_by_etudiant(
        self,
        db: Session,
        etudiant_id: int,
        date_debut: Optional[date] = None,
        date_fin: Optional[date] = None
    ) -> List[Presence]:
        """Retourne les présences d'un étudiant"""
        query = db.query(Presence).join(Seance).filter(
            Presence.etudiant_id == etudiant_id
        )
        
        if date_debut:
            query = query.filter(Seance.date_seance >= date_debut)
        
        if date_fin:
            query = query.filter(Seance.date_seance <= date_fin)
        
        return query.order_by(Seance.date_seance.desc()).all()

    def create_bulk(
        self,
        db: Session,
        presences_data: PresenceBulkCreate,
        user_id: int
    ) -> List[Presence]:
        """Crée les présences pour tous les étudiants d'une séance"""
        presences_creees = []
        
        for presence_item in presences_data.presences:
            # Vérifier si une présence existe déjà
            existing = db.query(Presence).filter(
                Presence.seance_id == presences_data.seance_id,
                Presence.etudiant_id == presence_item.etudiant_id
            ).first()
            
            if existing:
                # Mettre à jour
                existing.statut = presence_item.statut
                existing.heure_arrivee = presence_item.heure_arrivee
                existing.observation = presence_item.observation
                existing.saisie_par = user_id
                existing.date_saisie = datetime.utcnow()
                db.commit()
                db.refresh(existing)
                presences_creees.append(existing)
            else:
                # Créer
                presence = Presence(
                    seance_id=presences_data.seance_id,
                    etudiant_id=presence_item.etudiant_id,
                    statut=presence_item.statut,
                    heure_arrivee=presence_item.heure_arrivee,
                    observation=presence_item.observation,
                    saisie_par=user_id,
                    date_saisie=datetime.utcnow()
                )
                db.add(presence)
                db.commit()
                db.refresh(presence)
                presences_creees.append(presence)
        
        # Mettre à jour l'effectif présent de la séance
        seance = db.query(Seance).filter(Seance.id == presences_data.seance_id).first()
        if seance:
            effectif_present = db.query(Presence).filter(
                Presence.seance_id == presences_data.seance_id,
                Presence.statut.in_(["present", "retard"])
            ).count()
            seance.effectif_present = effectif_present
            db.commit()
        
        return presences_creees

    def get_feuille_appel_seance(
        self,
        db: Session,
        seance_id: int,
    ) -> Optional[List[dict]]:
        """
        Retourne la feuille d'appel : étudiants inscrits à la matière de la séance,
        fusionnés avec les présences déjà saisies.
        """
        seance = db.query(Seance).filter(Seance.id == seance_id).first()
        if not seance:
            return None

        annee = db.query(AnneeAcademique).filter(
            AnneeAcademique.id == seance.annee_academique_id
        ).first()

        query = (
            db.query(Etudiant)
            .join(Inscription, Etudiant.id == Inscription.etudiant_id)
            .join(InscriptionMatiere, Inscription.id == InscriptionMatiere.inscription_id)
            .filter(
                InscriptionMatiere.matiere_id == seance.matiere_id,
                InscriptionMatiere.semestre == seance.semestre,
                Inscription.niveau_id == seance.niveau_id,
                Inscription.is_active == True,
            )
        )
        if seance.filiere_id:
            query = query.filter(Inscription.filiere_id == seance.filiere_id)
        if annee:
            query = query.filter(Inscription.annee_academique == annee.code)
        if hasattr(InscriptionMatiere, "is_active"):
            query = query.filter(InscriptionMatiere.is_active == True)

        etudiants = query.order_by(Etudiant.nom, Etudiant.prenom).distinct().all()
        presences_map = {
            p.etudiant_id: p for p in self.get_by_seance(db, seance_id)
        }

        rows = []
        for etudiant in etudiants:
            presence = presences_map.get(etudiant.id)
            rows.append(
                {
                    "id": presence.id if presence else None,
                    "seance_id": seance_id,
                    "etudiant_id": etudiant.id,
                    "statut": presence.statut if presence else "present",
                    "heure_arrivee": presence.heure_arrivee if presence else None,
                    "justificatif_url": presence.justificatif_url if presence else None,
                    "observation": presence.observation if presence else None,
                    "saisie_par": presence.saisie_par if presence else None,
                    "date_saisie": presence.date_saisie if presence else None,
                    "etudiant_nom": etudiant.nom,
                    "etudiant_prenom": etudiant.prenom,
                    "etudiant_matricule": etudiant.matricule,
                }
            )
        return rows

    def calculer_taux_presence_etudiant(
        self,
        db: Session,
        etudiant_id: int,
        matiere_id: Optional[int] = None,
        date_debut: Optional[date] = None,
        date_fin: Optional[date] = None
    ) -> dict:
        """Calcule le taux de présence d'un étudiant"""
        query = db.query(Presence).join(Seance).filter(
            Presence.etudiant_id == etudiant_id,
            Seance.statut.notin_(["annulee", "reportee", "planifiee"]),
        )
        
        if matiere_id:
            query = query.filter(Seance.matiere_id == matiere_id)
        
        if date_debut:
            query = query.filter(Seance.date_seance >= date_debut)
        
        if date_fin:
            query = query.filter(Seance.date_seance <= date_fin)
        
        presences = query.all()
        
        total = len(presences)
        if total == 0:
            return {
                "total_seances": 0,
                "presences": 0,
                "absences": 0,
                "retards": 0,
                "absences_justifiees": 0,
                "taux_presence": 0.0
            }
        
        stats = {
            "total_seances": total,
            "presences": sum(1 for p in presences if p.statut == "present"),
            "absences": sum(1 for p in presences if p.statut == "absent"),
            "retards": sum(1 for p in presences if p.statut == "retard"),
            "absences_justifiees": sum(1 for p in presences if p.statut == "absent_justifie"),
        }
        
        # Présences effectives = présents + retards + absences justifiées
        presences_effectives = stats["presences"] + stats["retards"] + stats["absences_justifiees"]
        stats["taux_presence"] = round((presences_effectives / total) * 100, 2)
        
        return stats

    def get_statistiques_seance(self, db: Session, seance_id: int) -> dict:
        """Retourne les statistiques de présence d'une séance"""
        presences = self.get_by_seance(db, seance_id)
        
        total = len(presences)
        if total == 0:
            return {
                "total": 0,
                "presents": 0,
                "absents": 0,
                "retards": 0,
                "absences_justifiees": 0,
                "taux_presence": 0.0
            }
        
        presents = sum(1 for p in presences if p.statut == "present")
        retards = sum(1 for p in presences if p.statut == "retard")
        absents = sum(1 for p in presences if p.statut == "absent")
        absences_justifiees = sum(1 for p in presences if p.statut == "absent_justifie")
        
        taux = round(((presents + retards + absences_justifiees) / total) * 100, 2)
        
        return {
            "total": total,
            "presents": presents,
            "absents": absents,
            "retards": retards,
            "absences_justifiees": absences_justifiees,
            "taux_presence": taux
        }

    def get_etudiants_absents_frequents(
        self,
        db: Session,
        niveau_id: int,
        seuil_absence: int = 3
    ) -> List[dict]:
        """Retourne les étudiants avec plus de X absences"""
        # Sous-requête pour compter les absences par étudiant
        subquery = db.query(
            Presence.etudiant_id,
            func.count(Presence.id).label("nb_absences")
        ).join(Seance).filter(
            Seance.niveau_id == niveau_id,
            Presence.statut == "absent"
        ).group_by(Presence.etudiant_id).subquery()
        
        # Requête principale
        results = db.query(
            Etudiant,
            subquery.c.nb_absences
        ).join(
            subquery, Etudiant.id == subquery.c.etudiant_id
        ).filter(
            subquery.c.nb_absences >= seuil_absence
        ).order_by(subquery.c.nb_absences.desc()).all()
        
        return [
            {
                "etudiant_id": etudiant.id,
                "matricule": etudiant.matricule,
                "nom": etudiant.nom,
                "prenom": etudiant.prenom,
                "nb_absences": nb_absences
            }
            for etudiant, nb_absences in results
        ]


presence_repository = PresenceRepository()
