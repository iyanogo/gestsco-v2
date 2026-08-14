"""
Service de gestion des stages et soutenances.
Conforme au système CAMES avec intégration dans le système d'évaluation.
"""

from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List
import logging
import uuid

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.stage import Stage
from app.models.soutenance import Soutenance
from app.models.etudiant import Etudiant
from app.models.matiere import Matiere
from app.models.salle import Salle
from app.models.user import User
from app.models.note import Note

logger = logging.getLogger(__name__)


class StageServiceError(Exception):
    """Exception pour les erreurs du service stage."""
    pass


class StageService:
    """
    Service pour la gestion des stages et soutenances.
    
    Fonctionnalités :
    - Création et gestion des stages
    - Validation des stages
    - Programmation des soutenances
    - Évaluation et génération des PV
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def creer_stage(
        self,
        etudiant_id: int,
        matiere_id: int,
        niveau_id: int,
        annee_academique_id: int,
        type_stage: str,
        duree_semaines: int,
        date_debut: date,
        date_fin: date,
        entreprise_nom: str,
        maitre_stage_nom: str,
        theme: str,
        entreprise_adresse: Optional[str] = None,
        entreprise_telephone: Optional[str] = None,
        entreprise_email: Optional[str] = None,
        maitre_stage_fonction: Optional[str] = None,
        maitre_stage_email: Optional[str] = None,
        encadrant_academique_id: Optional[int] = None,
        objectifs: Optional[str] = None
    ) -> Stage:
        """
        Crée un nouveau stage.
        
        Args:
            etudiant_id: ID de l'étudiant
            matiere_id: ID de la matière (stage)
            niveau_id: ID du niveau
            annee_academique_id: ID de l'année académique
            type_stage: Type de stage (observation, pratique, professionnel, recherche)
            duree_semaines: Durée en semaines
            date_debut: Date de début
            date_fin: Date de fin
            entreprise_nom: Nom de l'entreprise
            maitre_stage_nom: Nom du maître de stage
            theme: Thème du stage
            ... autres paramètres optionnels
            
        Returns:
            Le stage créé
        """
        # Vérifier que l'étudiant existe
        etudiant = self.db.query(Etudiant).filter(Etudiant.id == etudiant_id).first()
        if not etudiant:
            raise StageServiceError(f"Étudiant {etudiant_id} non trouvé.")
        
        # Vérifier que la matière est de type stage (si applicable)
        matiere = self.db.query(Matiere).filter(Matiere.id == matiere_id).first()
        if not matiere:
            raise StageServiceError(f"Matière {matiere_id} non trouvée.")
        
        # Générer un code unique
        code = f"STG-{annee_academique_id}-{uuid.uuid4().hex[:8].upper()}"
        
        # Créer le stage
        stage = Stage(
            code=code,
            etudiant_id=etudiant_id,
            matiere_id=matiere_id,
            niveau_id=niveau_id,
            annee_academique_id=annee_academique_id,
            type_stage=type_stage,
            duree_semaines=duree_semaines,
            date_debut=date_debut,
            date_fin=date_fin,
            entreprise_nom=entreprise_nom,
            entreprise_adresse=entreprise_adresse,
            entreprise_telephone=entreprise_telephone,
            entreprise_email=entreprise_email,
            maitre_stage_nom=maitre_stage_nom,
            maitre_stage_fonction=maitre_stage_fonction,
            maitre_stage_email=maitre_stage_email,
            encadrant_academique_id=encadrant_academique_id,
            theme=theme,
            objectifs=objectifs,
            statut="en_cours"
        )
        
        self.db.add(stage)
        self.db.commit()
        
        logger.info(f"Stage {code} créé pour étudiant {etudiant_id}")
        
        return stage
    
    def valider_stage(
        self,
        stage_id: int,
        note_entreprise: Decimal,
        note_rapport: Decimal,
        observations: Optional[str] = None
    ) -> Stage:
        """
        Valide un stage avec les notes.
        
        Args:
            stage_id: ID du stage
            note_entreprise: Note du maître de stage
            note_rapport: Note du rapport
            observations: Observations
            
        Returns:
            Le stage validé
        """
        stage = self.db.query(Stage).filter(Stage.id == stage_id).first()
        if not stage:
            raise StageServiceError(f"Stage {stage_id} non trouvé.")
        
        if stage.statut not in ["en_cours", "termine"]:
            raise StageServiceError(
                f"Le stage doit être en cours ou terminé pour être validé (statut: {stage.statut})."
            )
        
        # Enregistrer les notes
        stage.note_entreprise = note_entreprise
        stage.note_rapport = note_rapport
        stage.observations = observations
        
        # Marquer comme terminé si pas encore fait
        if stage.statut == "en_cours":
            stage.terminer()
        
        self.db.commit()
        
        logger.info(f"Stage {stage.code} validé avec notes entreprise={note_entreprise}, rapport={note_rapport}")
        
        return stage
    
    def programmer_soutenance(
        self,
        stage_id: int,
        date_soutenance: datetime,
        lieu: str,
        president_jury_id: int,
        rapporteur_id: int,
        salle_id: Optional[int] = None,
        examinateur_id: Optional[int] = None,
        duree_minutes: int = 30
    ) -> Soutenance:
        """
        Programme une soutenance pour un stage.
        
        Args:
            stage_id: ID du stage
            date_soutenance: Date et heure de la soutenance
            lieu: Lieu de la soutenance
            president_jury_id: ID du président du jury
            rapporteur_id: ID du rapporteur
            salle_id: ID de la salle (optionnel)
            examinateur_id: ID de l'examinateur (optionnel)
            duree_minutes: Durée en minutes
            
        Returns:
            La soutenance programmée
        """
        stage = self.db.query(Stage).filter(Stage.id == stage_id).first()
        if not stage:
            raise StageServiceError(f"Stage {stage_id} non trouvé.")
        
        if not stage.peut_programmer_soutenance:
            raise StageServiceError(
                "Le stage doit être terminé avec un rapport déposé pour programmer une soutenance."
            )
        
        # Vérifier la disponibilité de la salle si spécifiée
        if salle_id:
            if not self._verifier_disponibilite_salle(salle_id, date_soutenance, duree_minutes):
                raise StageServiceError("La salle n'est pas disponible à cette date/heure.")
        
        # Vérifier la disponibilité des membres du jury
        jury_ids = [president_jury_id, rapporteur_id]
        if examinateur_id:
            jury_ids.append(examinateur_id)
        
        for jury_id in jury_ids:
            if not self._verifier_disponibilite_jury(jury_id, date_soutenance, duree_minutes):
                raise StageServiceError(f"Le membre du jury {jury_id} n'est pas disponible.")
        
        # Créer la soutenance
        soutenance = Soutenance(
            stage_id=stage_id,
            date_soutenance=date_soutenance,
            lieu=lieu,
            salle_id=salle_id,
            duree_minutes=duree_minutes,
            president_jury_id=president_jury_id,
            rapporteur_id=rapporteur_id,
            examinateur_id=examinateur_id,
            statut="programmee"
        )
        
        self.db.add(soutenance)
        self.db.commit()
        
        logger.info(f"Soutenance programmée pour stage {stage.code} le {date_soutenance}")
        
        return soutenance
    
    def valider_soutenance(
        self,
        soutenance_id: int,
        note_presentation: Decimal,
        note_defense: Decimal,
        note_jury: Decimal,
        observations_jury: Optional[str] = None
    ) -> Soutenance:
        """
        Valide une soutenance avec les notes du jury.
        
        Args:
            soutenance_id: ID de la soutenance
            note_presentation: Note de présentation
            note_defense: Note de défense
            note_jury: Note globale du jury
            observations_jury: Observations du jury
            
        Returns:
            La soutenance validée
        """
        soutenance = self.db.query(Soutenance).filter(Soutenance.id == soutenance_id).first()
        if not soutenance:
            raise StageServiceError(f"Soutenance {soutenance_id} non trouvée.")
        
        if soutenance.statut not in ["programmee", "en_cours", "terminee"]:
            raise StageServiceError(
                f"La soutenance ne peut pas être validée (statut: {soutenance.statut})."
            )
        
        # Enregistrer les notes
        soutenance.note_presentation = note_presentation
        soutenance.note_defense = note_defense
        soutenance.note_jury = note_jury
        soutenance.observations_jury = observations_jury
        
        # Calculer la note finale
        soutenance.calculer_note_finale()
        
        # Déterminer l'appréciation et la mention
        soutenance.determiner_appreciation()
        soutenance.determiner_mention()
        
        # Valider la soutenance
        soutenance.valider()
        
        # Mettre à jour le stage
        stage = soutenance.stage
        stage.note_soutenance = soutenance.note_finale
        stage.calculer_note_finale()
        
        # Valider ou invalider le stage selon la note
        if stage.note_finale and stage.note_finale >= 10:
            stage.valider()
        else:
            stage.invalider()
        
        # Créer la note dans le système d'évaluation
        self._creer_note_stage(stage)
        
        self.db.commit()
        
        logger.info(
            f"Soutenance {soutenance_id} validée: note={soutenance.note_finale}, "
            f"mention={soutenance.mention}"
        )
        
        return soutenance
    
    def generer_pv_soutenance(self, soutenance_id: int) -> str:
        """
        Génère le procès-verbal de soutenance.
        
        Args:
            soutenance_id: ID de la soutenance
            
        Returns:
            URL du fichier PDF généré
        """
        soutenance = self.db.query(Soutenance).filter(Soutenance.id == soutenance_id).first()
        if not soutenance:
            raise StageServiceError(f"Soutenance {soutenance_id} non trouvée.")
        
        if not soutenance.est_validee:
            raise StageServiceError("La soutenance doit être validée pour générer le PV.")
        
        # Générer le PV (placeholder - à implémenter avec un générateur PDF)
        pv_url = f"/pv-soutenances/{soutenance.stage.annee_academique_id}/{soutenance_id}.pdf"
        soutenance.proces_verbal_url = pv_url
        
        self.db.commit()
        
        return pv_url
    
    def get_stages_etudiant(self, etudiant_id: int) -> List[Stage]:
        """Récupère tous les stages d'un étudiant."""
        return self.db.query(Stage).filter(
            Stage.etudiant_id == etudiant_id
        ).order_by(Stage.date_debut.desc()).all()
    
    def get_stages_encadrant(self, encadrant_id: int) -> List[Stage]:
        """Récupère tous les stages encadrés par un enseignant."""
        return self.db.query(Stage).filter(
            Stage.encadrant_academique_id == encadrant_id
        ).order_by(Stage.date_debut.desc()).all()
    
    def get_soutenances_jury(self, user_id: int) -> List[Soutenance]:
        """Récupère toutes les soutenances où l'utilisateur est membre du jury."""
        return self.db.query(Soutenance).filter(
            (Soutenance.president_jury_id == user_id) |
            (Soutenance.rapporteur_id == user_id) |
            (Soutenance.examinateur_id == user_id)
        ).order_by(Soutenance.date_soutenance.desc()).all()
    
    def get_calendrier_soutenances(
        self,
        date_debut: date,
        date_fin: date,
        niveau_id: Optional[int] = None
    ) -> List[Soutenance]:
        """Récupère le calendrier des soutenances pour une période."""
        query = self.db.query(Soutenance).join(Stage).filter(
            func.date(Soutenance.date_soutenance) >= date_debut,
            func.date(Soutenance.date_soutenance) <= date_fin
        )
        
        if niveau_id:
            query = query.filter(Stage.niveau_id == niveau_id)
        
        return query.order_by(Soutenance.date_soutenance).all()
    
    def get_statistiques_stages(self, annee_academique_id: int) -> dict:
        """Génère les statistiques des stages pour une année."""
        stages = self.db.query(Stage).filter(
            Stage.annee_academique_id == annee_academique_id
        ).all()
        
        total = len(stages)
        en_cours = sum(1 for s in stages if s.statut == "en_cours")
        termines = sum(1 for s in stages if s.statut == "termine")
        valides = sum(1 for s in stages if s.statut == "valide")
        invalides = sum(1 for s in stages if s.statut == "invalide")
        
        # Moyenne des notes
        notes_finales = [float(s.note_finale) for s in stages if s.note_finale]
        moyenne_notes = sum(notes_finales) / len(notes_finales) if notes_finales else 0
        
        return {
            "total": total,
            "en_cours": en_cours,
            "termines": termines,
            "valides": valides,
            "invalides": invalides,
            "taux_validation": (valides / total * 100) if total > 0 else 0,
            "moyenne_notes": round(moyenne_notes, 2),
            "par_type": self._compter_par_type(stages)
        }
    
    # Méthodes privées
    
    def _verifier_disponibilite_salle(
        self,
        salle_id: int,
        date_heure: datetime,
        duree_minutes: int
    ) -> bool:
        """Vérifie la disponibilité d'une salle."""
        # Vérifier s'il y a d'autres soutenances dans la même salle
        fin_prevue = date_heure.replace(minute=date_heure.minute + duree_minutes)
        
        conflit = self.db.query(Soutenance).filter(
            Soutenance.salle_id == salle_id,
            Soutenance.statut == "programmee",
            Soutenance.date_soutenance < fin_prevue,
            func.datetime(Soutenance.date_soutenance, f'+{Soutenance.duree_minutes} minutes') > date_heure
        ).first()
        
        return conflit is None
    
    def _verifier_disponibilite_jury(
        self,
        user_id: int,
        date_heure: datetime,
        duree_minutes: int
    ) -> bool:
        """Vérifie la disponibilité d'un membre du jury."""
        # Vérifier s'il a d'autres soutenances
        conflit = self.db.query(Soutenance).filter(
            (Soutenance.president_jury_id == user_id) |
            (Soutenance.rapporteur_id == user_id) |
            (Soutenance.examinateur_id == user_id),
            Soutenance.statut == "programmee",
            func.date(Soutenance.date_soutenance) == date_heure.date()
        ).first()
        
        # Simplification : on vérifie juste s'il a une soutenance le même jour
        # Une implémentation plus complète vérifierait les chevauchements horaires
        return conflit is None
    
    def _creer_note_stage(self, stage: Stage) -> None:
        """Crée la note du stage dans le système d'évaluation."""
        if not stage.note_finale:
            return
        
        # Vérifier si une note existe déjà
        note_existante = self.db.query(Note).filter(
            Note.etudiant_id == stage.etudiant_id,
            Note.matiere_id == stage.matiere_id,
            Note.annee_academique_id == stage.annee_academique_id
        ).first()
        
        if note_existante:
            note_existante.note_finale = stage.note_finale
        else:
            note = Note(
                etudiant_id=stage.etudiant_id,
                matiere_id=stage.matiere_id,
                annee_academique_id=stage.annee_academique_id,
                note_finale=stage.note_finale,
                observations=f"Note de stage: {stage.theme[:100]}"
            )
            self.db.add(note)
    
    def _compter_par_type(self, stages: List[Stage]) -> dict:
        """Compte les stages par type."""
        compteur = {}
        for stage in stages:
            compteur[stage.type_stage] = compteur.get(stage.type_stage, 0) + 1
        return compteur
