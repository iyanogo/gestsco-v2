"""
Repository pour la gestion des résultats annuels
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.resultat_annuel import ResultatAnnuel
from app.models.resultat_semestre import ResultatSemestre
from app.models.inscription import Inscription
from app.repositories.base_repository import BaseRepository
from app.utils.calcul_notes import (
    calculer_mention,
    determiner_decision_annuelle,
)


class ResultatAnnuelRepository(BaseRepository[ResultatAnnuel, None, None]):
    """Repository pour les opérations sur les résultats annuels."""

    def __init__(self):
        super().__init__(ResultatAnnuel)

    def get_by_etudiant(
        self,
        db: Session,
        etudiant_id: int,
        annee_id: Optional[int] = None
    ) -> list[ResultatAnnuel]:
        """
        Liste les résultats annuels d'un étudiant.
        
        Args:
            db: Session de base de données
            etudiant_id: ID de l'étudiant
            annee_id: ID de l'année académique (optionnel)
            
        Returns:
            Liste des résultats annuels
        """
        query = db.query(ResultatAnnuel).filter(
            ResultatAnnuel.etudiant_id == etudiant_id
        )
        
        if annee_id:
            query = query.filter(ResultatAnnuel.annee_academique_id == annee_id)
        
        return query.all()

    def get_by_inscription(
        self,
        db: Session,
        inscription_id: int
    ) -> Optional[ResultatAnnuel]:
        """
        Récupère le résultat annuel d'une inscription.
        
        Args:
            db: Session de base de données
            inscription_id: ID de l'inscription
            
        Returns:
            Le résultat annuel ou None
        """
        return db.query(ResultatAnnuel).filter(
            ResultatAnnuel.inscription_id == inscription_id
        ).first()

    def calculer_resultat_annuel(
        self,
        db: Session,
        inscription_id: int
    ) -> ResultatAnnuel:
        """
        Calcule le résultat annuel d'un étudiant.
        
        Args:
            db: Session de base de données
            inscription_id: ID de l'inscription
            
        Returns:
            Le résultat annuel calculé
        """
        # Récupérer l'inscription
        inscription = db.query(Inscription).filter(
            Inscription.id == inscription_id
        ).first()
        
        if not inscription:
            raise ValueError(f"Inscription {inscription_id} non trouvée")
        
        # Récupérer les résultats semestriels
        resultats_semestres = db.query(ResultatSemestre).filter(
            ResultatSemestre.inscription_id == inscription_id
        ).all()
        
        resultat_s1 = next((r for r in resultats_semestres if r.semestre == 1), None)
        resultat_s2 = next((r for r in resultats_semestres if r.semestre == 2), None)
        
        # Calculer les moyennes
        moyenne_s1 = resultat_s1.moyenne_generale if resultat_s1 else None
        moyenne_s2 = resultat_s2.moyenne_generale if resultat_s2 else None
        
        # Calculer la moyenne annuelle
        moyenne_annuelle = None
        if moyenne_s1 is not None and moyenne_s2 is not None:
            moyenne_annuelle = round((moyenne_s1 + moyenne_s2) / 2, 2)
        elif moyenne_s1 is not None:
            moyenne_annuelle = moyenne_s1
        elif moyenne_s2 is not None:
            moyenne_annuelle = moyenne_s2
        
        # Calculer les crédits
        total_credits_inscrits = sum(
            r.total_credits_inscrits for r in resultats_semestres if r.total_credits_inscrits
        )
        total_credits_obtenus = sum(
            r.total_credits_obtenus for r in resultats_semestres if r.total_credits_obtenus
        )
        total_credits_capitalises = sum(
            r.total_credits_capitalises for r in resultats_semestres if r.total_credits_capitalises
        )
        
        # Déterminer mention et décision
        mention = calculer_mention(moyenne_annuelle)
        decision, passage = determiner_decision_annuelle(
            moyenne_annuelle,
            total_credits_obtenus,
            total_credits_inscrits
        )
        
        # Chercher un résultat existant ou en créer un nouveau
        resultat = self.get_by_inscription(db, inscription_id)
        now = datetime.utcnow()
        
        if resultat:
            # Mise à jour
            resultat.moyenne_annuelle = moyenne_annuelle
            resultat.moyenne_semestre1 = moyenne_s1
            resultat.moyenne_semestre2 = moyenne_s2
            resultat.total_credits_inscrits = total_credits_inscrits
            resultat.total_credits_obtenus = total_credits_obtenus
            resultat.total_credits_capitalises = total_credits_capitalises
            resultat.mention = mention
            resultat.decision = decision
            resultat.passage_niveau_superieur = passage
            resultat.statut = "calcule"
            resultat.updated_at = now
        else:
            # Création
            resultat = ResultatAnnuel(
                inscription_id=inscription_id,
                etudiant_id=inscription.etudiant_id,
                annee_academique_id=inscription.annee_academique_id if hasattr(inscription, 'annee_academique_id') else None,
                niveau_id=inscription.niveau_id,
                moyenne_annuelle=moyenne_annuelle,
                moyenne_semestre1=moyenne_s1,
                moyenne_semestre2=moyenne_s2,
                total_credits_inscrits=total_credits_inscrits,
                total_credits_obtenus=total_credits_obtenus,
                total_credits_capitalises=total_credits_capitalises,
                statut="calcule",
                decision=decision,
                mention=mention,
                passage_niveau_superieur=passage,
                is_valide=False,
                created_at=now,
                updated_at=now
            )
            db.add(resultat)
        
        db.commit()
        db.refresh(resultat)
        return resultat

    def calculer_resultats_niveau(
        self,
        db: Session,
        niveau_id: int,
        annee_id: int
    ) -> int:
        """
        Calcule les résultats annuels pour tous les étudiants d'un niveau.
        
        Args:
            db: Session de base de données
            niveau_id: ID du niveau
            annee_id: ID de l'année académique
            
        Returns:
            Nombre de résultats calculés
        """
        # Récupérer toutes les inscriptions du niveau pour cette année
        inscriptions = db.query(Inscription).filter(
            Inscription.niveau_id == niveau_id,
            Inscription.is_active == True
        ).all()
        
        # Filtrer par année si l'inscription a un champ annee_academique_id
        if hasattr(Inscription, 'annee_academique_id'):
            inscriptions = [i for i in inscriptions if i.annee_academique_id == annee_id]
        
        # Calculer le résultat pour chaque inscription
        count = 0
        for inscription in inscriptions:
            try:
                self.calculer_resultat_annuel(db, inscription.id)
                count += 1
            except Exception as e:
                print(f"Erreur calcul résultat annuel {inscription.id}: {e}")
        
        return count

    def get_classement_annuel(
        self,
        db: Session,
        niveau_id: int,
        filiere_id: int,
        annee_id: int
    ) -> list[ResultatAnnuel]:
        """
        Récupère le classement annuel des étudiants.
        
        Args:
            db: Session de base de données
            niveau_id: ID du niveau
            filiere_id: ID de la filière
            annee_id: ID de l'année académique
            
        Returns:
            Liste des résultats ordonnés par moyenne décroissante
        """
        return db.query(ResultatAnnuel).join(Inscription).filter(
            ResultatAnnuel.annee_academique_id == annee_id,
            Inscription.niveau_id == niveau_id,
            Inscription.filiere_id == filiere_id
        ).order_by(desc(ResultatAnnuel.moyenne_annuelle)).all()

    def calculer_rangs_annuels(
        self,
        db: Session,
        niveau_id: int,
        filiere_id: int,
        annee_id: int
    ) -> int:
        """
        Calcule et enregistre les rangs annuels.
        
        Args:
            db: Session de base de données
            niveau_id: ID du niveau
            filiere_id: ID de la filière
            annee_id: ID de l'année académique
            
        Returns:
            Nombre de rangs calculés
        """
        resultats = self.get_classement_annuel(db, niveau_id, filiere_id, annee_id)
        effectif = len(resultats)
        
        for rang, resultat in enumerate(resultats, 1):
            resultat.rang = rang
            resultat.effectif = effectif
            resultat.updated_at = datetime.utcnow()
        
        db.commit()
        return effectif


# Instance singleton du repository
resultat_annuel_repository = ResultatAnnuelRepository()
