"""
Repository pour la gestion des résultats semestriels
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import func, desc
from sqlalchemy.orm import Session, joinedload

from app.models.resultat_semestre import ResultatSemestre
from app.models.resultat_matiere import ResultatMatiere
from app.models.inscription import Inscription
from app.models.inscription_matiere import InscriptionMatiere
from app.models.session_examen import SessionExamen
from app.repositories.base_repository import BaseRepository
from app.utils.calcul_notes import calculer_moyenne_ponderee, calculer_mention
from app.utils.configuration_deliberation_resolver import resolve_config_snapshot
from app.utils.deliberation_rules import determiner_decision_semestre


class ResultatSemestreRepository(BaseRepository[ResultatSemestre, None, None]):
    """Repository pour les opérations sur les résultats semestriels."""

    def __init__(self):
        super().__init__(ResultatSemestre)

    def get_by_etudiant(
        self,
        db: Session,
        etudiant_id: int
    ) -> list[ResultatSemestre]:
        """
        Liste les résultats semestriels d'un étudiant.
        
        Args:
            db: Session de base de données
            etudiant_id: ID de l'étudiant
            
        Returns:
            Liste des résultats semestriels
        """
        return db.query(ResultatSemestre).filter(
            ResultatSemestre.etudiant_id == etudiant_id
        ).order_by(ResultatSemestre.semestre).all()

    def get_by_inscription(
        self,
        db: Session,
        inscription_id: int,
        semestre: Optional[int] = None
    ) -> list[ResultatSemestre]:
        """
        Liste les résultats semestriels d'une inscription.
        
        Args:
            db: Session de base de données
            inscription_id: ID de l'inscription
            semestre: Numéro du semestre (optionnel)
            
        Returns:
            Liste des résultats semestriels
        """
        query = db.query(ResultatSemestre).filter(
            ResultatSemestre.inscription_id == inscription_id
        )
        
        if semestre:
            query = query.filter(ResultatSemestre.semestre == semestre)
        
        return query.order_by(ResultatSemestre.semestre).all()

    def get_by_session(
        self,
        db: Session,
        session_id: int,
        skip: int = 0,
        limit: int = 1000
    ) -> list[ResultatSemestre]:
        """
        Liste les résultats semestriels d'une session.
        
        Args:
            db: Session de base de données
            session_id: ID de la session
            skip: Nombre d'éléments à ignorer
            limit: Nombre maximum d'éléments
            
        Returns:
            Liste des résultats semestriels
        """
        return db.query(ResultatSemestre).filter(
            ResultatSemestre.session_id == session_id
        ).offset(skip).limit(limit).all()

    def calculer_resultat_semestre(
        self,
        db: Session,
        inscription_id: int,
        session_id: int,
        semestre: int
    ) -> ResultatSemestre:
        """
        Calcule le résultat semestriel d'un étudiant.
        
        Args:
            db: Session de base de données
            inscription_id: ID de l'inscription
            session_id: ID de la session
            semestre: Numéro du semestre
            
        Returns:
            Le résultat semestriel calculé
        """
        # Récupérer l'inscription
        inscription = db.query(Inscription).filter(
            Inscription.id == inscription_id
        ).first()
        
        if not inscription:
            raise ValueError(f"Inscription {inscription_id} non trouvée")
        
        # Récupérer les inscriptions matières du semestre
        inscriptions_matieres = db.query(InscriptionMatiere).filter(
            InscriptionMatiere.inscription_id == inscription_id,
            InscriptionMatiere.semestre == semestre,
        ).all()
        
        # Récupérer les résultats matières correspondants
        resultats_matieres = []
        for im in inscriptions_matieres:
            rm = db.query(ResultatMatiere).filter(
                ResultatMatiere.inscription_matiere_id == im.id,
                ResultatMatiere.session_id == session_id
            ).first()
            if rm:
                resultats_matieres.append(rm)
        
        # Calculer les totaux
        total_credits_inscrits = sum(
            (im.matiere.credit or 3) for im in inscriptions_matieres if im.matiere
        )
        total_credits_obtenus = sum(
            rm.credit_obtenu for rm in resultats_matieres if rm.credit_obtenu
        )
        total_credits_capitalises = sum(
            rm.credit_obtenu for rm in resultats_matieres 
            if rm.statut == "valide" and rm.credit_obtenu
        )
        
        nombre_matieres = len(inscriptions_matieres)
        nombre_matieres_validees = len([
            rm for rm in resultats_matieres if rm.statut == "valide"
        ])
        
        # Calculer la moyenne pondérée par crédits
        notes_ponderees = []
        for rm in resultats_matieres:
            if rm.moyenne_matiere is not None:
                im = next((i for i in inscriptions_matieres if i.id == rm.inscription_matiere_id), None)
                if im and im.matiere:
                    notes_ponderees.append((rm.moyenne_matiere, im.matiere.credit or 3))
        
        moyenne_generale = calculer_moyenne_ponderee(notes_ponderees)

        session = db.query(SessionExamen).filter(SessionExamen.id == session_id).first()
        annee_id = session.annee_academique_id if session else None
        config = resolve_config_snapshot(db, annee_id, inscription.niveau_id)
        matieres_dette = nombre_matieres - nombre_matieres_validees

        # Déterminer mention et décision
        mention = calculer_mention(moyenne_generale, config.moyenne_validation)
        decision = determiner_decision_semestre(
            moyenne_generale,
            total_credits_obtenus,
            total_credits_inscrits,
            matieres_dette,
            config,
        )
        
        # Chercher un résultat existant ou en créer un nouveau
        resultat = db.query(ResultatSemestre).filter(
            ResultatSemestre.inscription_id == inscription_id,
            ResultatSemestre.session_id == session_id,
            ResultatSemestre.semestre == semestre
        ).first()
        
        now = datetime.utcnow()
        
        if resultat:
            # Mise à jour
            resultat.moyenne_generale = moyenne_generale
            resultat.total_credits_inscrits = total_credits_inscrits
            resultat.total_credits_obtenus = total_credits_obtenus
            resultat.total_credits_capitalises = total_credits_capitalises
            resultat.nombre_matieres = nombre_matieres
            resultat.nombre_matieres_validees = nombre_matieres_validees
            resultat.mention = mention
            resultat.decision = decision
            resultat.statut = "calcule"
            resultat.updated_at = now
        else:
            # Création
            resultat = ResultatSemestre(
                inscription_id=inscription_id,
                etudiant_id=inscription.etudiant_id,
                session_id=session_id,
                semestre=semestre,
                moyenne_generale=moyenne_generale,
                total_credits_inscrits=total_credits_inscrits,
                total_credits_obtenus=total_credits_obtenus,
                total_credits_capitalises=total_credits_capitalises,
                nombre_matieres=nombre_matieres,
                nombre_matieres_validees=nombre_matieres_validees,
                statut="calcule",
                decision=decision,
                mention=mention,
                is_valide=False,
                created_at=now,
                updated_at=now
            )
            db.add(resultat)
        
        db.commit()
        db.refresh(resultat)
        return resultat

    def calculer_resultats_session_semestre(
        self,
        db: Session,
        session_id: int,
        semestre: int
    ) -> int:
        """
        Calcule les résultats semestriels pour tous les étudiants.
        
        Args:
            db: Session de base de données
            session_id: ID de la session
            semestre: Numéro du semestre
            
        Returns:
            Nombre de résultats calculés
        """
        # Récupérer toutes les inscriptions ayant des résultats matières pour cette session
        inscription_ids = db.query(ResultatMatiere.inscription_matiere_id).join(
            InscriptionMatiere
        ).filter(
            ResultatMatiere.session_id == session_id
        ).distinct().all()
        
        # Récupérer les inscriptions uniques
        inscriptions = set()
        for (im_id,) in inscription_ids:
            im = db.query(InscriptionMatiere).filter(
                InscriptionMatiere.id == im_id
            ).first()
            if im:
                inscriptions.add(im.inscription_id)
        
        # Calculer le résultat pour chaque inscription
        count = 0
        for inscription_id in inscriptions:
            try:
                self.calculer_resultat_semestre(db, inscription_id, session_id, semestre)
                count += 1
            except Exception as e:
                print(f"Erreur calcul résultat semestre {inscription_id}: {e}")
        
        return count

    def get_classement(
        self,
        db: Session,
        niveau_id: int,
        filiere_id: int,
        session_id: int,
        semestre: int
    ) -> list[ResultatSemestre]:
        """
        Récupère le classement des étudiants pour un semestre.
        
        Args:
            db: Session de base de données
            niveau_id: ID du niveau
            filiere_id: ID de la filière
            session_id: ID de la session
            semestre: Numéro du semestre
            
        Returns:
            Liste des résultats ordonnés par moyenne décroissante
        """
        return db.query(ResultatSemestre).join(Inscription).filter(
            ResultatSemestre.session_id == session_id,
            ResultatSemestre.semestre == semestre,
            Inscription.niveau_id == niveau_id,
            Inscription.filiere_id == filiere_id
        ).order_by(desc(ResultatSemestre.moyenne_generale)).all()

    def calculer_rangs(
        self,
        db: Session,
        niveau_id: int,
        filiere_id: int,
        session_id: int,
        semestre: int
    ) -> int:
        """
        Calcule et enregistre les rangs pour un semestre.
        
        Args:
            db: Session de base de données
            niveau_id: ID du niveau
            filiere_id: ID de la filière
            session_id: ID de la session
            semestre: Numéro du semestre
            
        Returns:
            Nombre de rangs calculés
        """
        resultats = self.get_classement(db, niveau_id, filiere_id, session_id, semestre)
        effectif = len(resultats)
        
        for rang, resultat in enumerate(resultats, 1):
            resultat.rang = rang
            resultat.effectif = effectif
            resultat.updated_at = datetime.utcnow()
        
        db.commit()
        return effectif


# Instance singleton du repository
resultat_semestre_repository = ResultatSemestreRepository()
