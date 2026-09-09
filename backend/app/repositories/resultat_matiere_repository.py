"""
Repository pour la gestion des résultats par matière
"""

from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session, joinedload

from app.models.resultat_matiere import ResultatMatiere
from app.models.note import Note
from app.models.examen import Examen
from app.models.inscription import Inscription
from app.models.inscription_matiere import InscriptionMatiere
from app.models.session_examen import SessionExamen
from app.repositories.base_repository import BaseRepository
from app.repositories.presence_repository import presence_repository
from app.utils.calcul_notes import (
    calculer_moyenne_matiere,
    determiner_decision_matiere,
)
from app.utils.configuration_deliberation_resolver import resolve_config_snapshot
from app.core.type_evaluation import assign_note_to_slot


class ResultatMatiereRepository(BaseRepository[ResultatMatiere, None, None]):
    """Repository pour les opérations sur les résultats par matière."""

    def __init__(self):
        super().__init__(ResultatMatiere)

    def get_by_etudiant(
        self,
        db: Session,
        etudiant_id: int,
        session_id: Optional[int] = None
    ) -> list[ResultatMatiere]:
        """
        Liste les résultats matières d'un étudiant.
        
        Args:
            db: Session de base de données
            etudiant_id: ID de l'étudiant
            session_id: ID de la session (optionnel)
            
        Returns:
            Liste des résultats matières
        """
        query = db.query(ResultatMatiere).filter(
            ResultatMatiere.etudiant_id == etudiant_id
        )
        
        if session_id:
            query = query.filter(ResultatMatiere.session_id == session_id)
        
        return query.all()

    def get_by_session(
        self,
        db: Session,
        session_id: int,
        skip: int = 0,
        limit: int = 1000
    ) -> list[ResultatMatiere]:
        """
        Liste les résultats matières d'une session.
        
        Args:
            db: Session de base de données
            session_id: ID de la session
            skip: Nombre d'éléments à ignorer
            limit: Nombre maximum d'éléments
            
        Returns:
            Liste des résultats matières
        """
        return db.query(ResultatMatiere).filter(
            ResultatMatiere.session_id == session_id
        ).offset(skip).limit(limit).all()

    def get_by_session_matiere_niveau(
        self,
        db: Session,
        session_id: int,
        matiere_id: int,
        niveau_id: int,
        skip: int = 0,
        limit: int = 1000,
    ) -> list[ResultatMatiere]:
        """Résultats matière d'une session pour un niveau (lecture portail enseignant)."""
        return (
            db.query(ResultatMatiere)
            .options(
                joinedload(ResultatMatiere.etudiant),
                joinedload(ResultatMatiere.matiere),
            )
            .join(
                InscriptionMatiere,
                ResultatMatiere.inscription_matiere_id == InscriptionMatiere.id,
            )
            .join(Inscription, InscriptionMatiere.inscription_id == Inscription.id)
            .filter(
                ResultatMatiere.session_id == session_id,
                ResultatMatiere.matiere_id == matiere_id,
                Inscription.niveau_id == niveau_id,
            )
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_inscription_matiere(
        self,
        db: Session,
        inscription_matiere_id: int
    ) -> Optional[ResultatMatiere]:
        """
        Récupère le résultat d'une inscription matière.
        
        Args:
            db: Session de base de données
            inscription_matiere_id: ID de l'inscription matière
            
        Returns:
            Le résultat ou None
        """
        return db.query(ResultatMatiere).filter(
            ResultatMatiere.inscription_matiere_id == inscription_matiere_id
        ).first()

    def calculer_resultat_matiere(
        self,
        db: Session,
        inscription_matiere_id: int,
        session_id: int
    ) -> ResultatMatiere:
        """
        Calcule le résultat d'une matière pour un étudiant.
        
        Args:
            db: Session de base de données
            inscription_matiere_id: ID de l'inscription matière
            session_id: ID de la session
            
        Returns:
            Le résultat matière calculé
        """
        # Récupérer l'inscription matière avec la matière et l'inscription
        inscription_matiere = db.query(InscriptionMatiere).options(
            joinedload(InscriptionMatiere.matiere),
            joinedload(InscriptionMatiere.inscription),
        ).filter(
            InscriptionMatiere.id == inscription_matiere_id
        ).first()
        
        if not inscription_matiere:
            raise ValueError(f"Inscription matière {inscription_matiere_id} non trouvée")
        
        # Récupérer les notes de cette inscription matière pour cette session
        notes = db.query(Note).join(Examen).filter(
            Note.inscription_matiere_id == inscription_matiere_id,
            Examen.session_id == session_id,
            Note.is_valide == True
        ).all()
        
        # Organiser les notes par type d'évaluation
        note_cc = None
        note_tp = None
        note_examen = None
        
        for note in notes:
            examen = db.query(Examen).filter(Examen.id == note.examen_id).first()
            if examen:
                note_cc, note_tp, note_examen = assign_note_to_slot(
                    examen.type_evaluation,
                    note.note_sur_20,
                    note_cc=note_cc,
                    note_tp=note_tp,
                    note_examen=note_examen,
                )
        
        # Calculer la moyenne
        moyenne = calculer_moyenne_matiere(note_cc, note_tp, note_examen)
        
        # Récupérer le crédit de la matière
        credit_matiere = float(inscription_matiere.matiere.credit or 3) if inscription_matiere.matiere else 3.0

        session = db.query(SessionExamen).filter(SessionExamen.id == session_id).first()
        annee_id = session.annee_academique_id if session else None
        niveau_id = (
            inscription_matiere.inscription.niveau_id
            if inscription_matiere.inscription
            else None
        )
        config = resolve_config_snapshot(db, annee_id, niveau_id)
        notes_composantes = [n for n in (note_cc, note_tp, note_examen) if n is not None]

        taux_presence = None
        etudiant_id = (
            inscription_matiere.inscription.etudiant_id
            if inscription_matiere.inscription
            else None
        )
        if etudiant_id and config.taux_presence_min is not None:
            stats = presence_repository.calculer_taux_presence_etudiant(
                db,
                etudiant_id,
                matiere_id=inscription_matiere.matiere_id,
            )
            if stats.get("total_seances", 0) > 0:
                taux_presence = stats.get("taux_presence")

        # Déterminer la décision et les crédits obtenus
        decision, credit_obtenu = determiner_decision_matiere(
            moyenne,
            credit_matiere,
            config=config,
            notes_composantes=notes_composantes,
            taux_presence=taux_presence,
        )
        
        # Déterminer le statut
        statut = "valide" if decision == "admis" else "non_valide"
        
        # Chercher un résultat existant ou en créer un nouveau
        resultat = self.get_by_inscription_matiere(db, inscription_matiere_id)
        now = datetime.utcnow()
        
        if resultat:
            # Mise à jour
            resultat.note_cc = note_cc
            resultat.note_tp = note_tp
            resultat.note_examen = note_examen
            resultat.moyenne_matiere = moyenne
            resultat.credit_obtenu = credit_obtenu
            resultat.statut = statut
            resultat.decision = decision
            resultat.session_id = session_id
            resultat.updated_at = now
        else:
            # Création
            resultat = ResultatMatiere(
                inscription_matiere_id=inscription_matiere_id,
                etudiant_id=inscription_matiere.inscription.etudiant_id if inscription_matiere.inscription else None,
                matiere_id=inscription_matiere.matiere_id,
                session_id=session_id,
                note_cc=note_cc,
                note_tp=note_tp,
                note_examen=note_examen,
                moyenne_matiere=moyenne,
                credit_matiere=credit_matiere,
                credit_obtenu=credit_obtenu,
                statut=statut,
                decision=decision,
                is_valide=False,
                created_at=now,
                updated_at=now
            )
            db.add(resultat)
        
        db.commit()
        db.refresh(resultat)
        return resultat

    def calculer_resultats_session(
        self,
        db: Session,
        session_id: int
    ) -> int:
        """
        Calcule les résultats pour toutes les matières d'une session.
        
        Args:
            db: Session de base de données
            session_id: ID de la session
            
        Returns:
            Nombre de résultats calculés
        """
        # Récupérer tous les examens de la session
        examens = db.query(Examen).filter(Examen.session_id == session_id).all()
        
        # Récupérer toutes les inscriptions matières concernées
        inscription_matiere_ids = set()
        for examen in examens:
            notes = db.query(Note).filter(Note.examen_id == examen.id).all()
            for note in notes:
                inscription_matiere_ids.add(note.inscription_matiere_id)
        
        # Calculer le résultat pour chaque inscription matière
        count = 0
        for im_id in inscription_matiere_ids:
            try:
                self.calculer_resultat_matiere(db, im_id, session_id)
                count += 1
            except Exception as e:
                print(f"Erreur calcul résultat matière {im_id}: {e}")
        
        return count


# Instance singleton du repository
resultat_matiere_repository = ResultatMatiereRepository()
