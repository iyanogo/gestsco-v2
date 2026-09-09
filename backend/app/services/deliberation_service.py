"""
Service de délibération - applique ConfigurationDeliberation aux résultats calculés.

Ne recalcule pas les moyennes depuis les notes brutes : s'appuie sur
ResultatMatiere / ResultatSemestre / ResultatAnnuel (sous-lot 3).
"""

from __future__ import annotations

from datetime import datetime
import logging
from typing import Optional

from sqlalchemy.orm import Session

from app.models.configuration_deliberation import ConfigurationDeliberation
from app.models.deliberation import Deliberation
from app.models.inscription import Inscription
from app.models.resultat_annuel import ResultatAnnuel
from app.models.resultat_matiere import ResultatMatiere
from app.models.resultat_semestre import ResultatSemestre
from app.models.session_examen import SessionExamen
from app.utils.calcul_notes import calculer_mention
from app.utils.configuration_deliberation_resolver import resolve_config_snapshot
from app.utils.deliberation_rules import (
    DeliberationConfigSnapshot,
    determiner_decision_annuelle,
    determiner_decision_semestre,
)

logger = logging.getLogger(__name__)


class DeliberationServiceError(Exception):
    pass


class DeliberationService:
    def __init__(self, db: Session):
        self.db = db

    def get_config_snapshot(
        self, annee_academique_id: int, niveau_id: Optional[int] = None
    ) -> DeliberationConfigSnapshot:
        return resolve_config_snapshot(self.db, annee_academique_id, niveau_id)

    def deliberer_semestre_inscription(
        self,
        inscription_id: int,
        session_id: int,
        semestre: int,
        annee_academique_id: int,
        niveau_id: int,
    ) -> ResultatSemestre:
        config = self.get_config_snapshot(annee_academique_id, niveau_id)

        resultat = (
            self.db.query(ResultatSemestre)
            .filter(
                ResultatSemestre.inscription_id == inscription_id,
                ResultatSemestre.session_id == session_id,
                ResultatSemestre.semestre == semestre,
            )
            .first()
        )
        if not resultat:
            raise DeliberationServiceError(
                f"Aucun résultat semestriel (inscription={inscription_id}, session={session_id}). "
                "Lancer d'abord /resultats/calculer/*."
            )

        matieres_dette = self._compter_matieres_dette(
            resultat.etudiant_id, session_id
        )
        decision = determiner_decision_semestre(
            resultat.moyenne_generale,
            float(resultat.total_credits_obtenus or 0),
            float(resultat.total_credits_inscrits or 0),
            matieres_dette,
            config,
        )

        resultat.decision = decision
        resultat.mention = calculer_mention(
            resultat.moyenne_generale, config.moyenne_validation
        )
        resultat.statut = "calcule"
        resultat.is_valide = False
        resultat.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(resultat)
        return resultat

    def deliberer_annuelle_inscription(
        self,
        inscription_id: int,
        annee_academique_id: int,
        niveau_id: int,
    ) -> ResultatAnnuel:
        config = self.get_config_snapshot(annee_academique_id, niveau_id)

        resultat = (
            self.db.query(ResultatAnnuel)
            .filter(ResultatAnnuel.inscription_id == inscription_id)
            .first()
        )
        if not resultat:
            raise DeliberationServiceError(
                f"Aucun résultat annuel pour inscription {inscription_id}. "
                "Calculer les semestres puis /resultats/calculer/annuel/*."
            )

        matieres_dette = self._compter_matieres_dette_annuel(
            resultat.etudiant_id, annee_academique_id
        )
        decision, passage, _compensation = determiner_decision_annuelle(
            resultat.moyenne_semestre1,
            resultat.moyenne_semestre2,
            resultat.moyenne_annuelle,
            float(resultat.total_credits_obtenus or 0),
            float(resultat.total_credits_inscrits or 0),
            matieres_dette,
            config,
        )

        resultat.decision = decision
        resultat.passage_niveau_superieur = passage
        resultat.mention = calculer_mention(
            resultat.moyenne_annuelle, config.moyenne_validation
        )
        resultat.statut = "calcule"
        resultat.is_valide = False
        resultat.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(resultat)
        return resultat

    def executer_deliberation_semestrielle(
        self,
        session_id: int,
        niveau_id: int,
        filiere_id: int,
        semestre: int,
    ) -> int:
        session = self.db.query(SessionExamen).filter(SessionExamen.id == session_id).first()
        if not session:
            raise DeliberationServiceError(f"Session {session_id} introuvable")

        inscriptions = (
            self.db.query(Inscription)
            .filter(
                Inscription.niveau_id == niveau_id,
                Inscription.filiere_id == filiere_id,
                Inscription.is_active == True,
            )
            .all()
        )

        count = 0
        for inscription in inscriptions:
            try:
                self.deliberer_semestre_inscription(
                    inscription.id,
                    session_id,
                    semestre,
                    session.annee_academique_id,
                    niveau_id,
                )
                count += 1
            except DeliberationServiceError as exc:
                logger.warning("Délibération semestre ignorée inscription %s: %s", inscription.id, exc)
        return count

    def executer_deliberation_annuelle(
        self,
        niveau_id: int,
        filiere_id: int,
        annee_academique_id: int,
    ) -> int:
        inscriptions = (
            self.db.query(Inscription)
            .filter(
                Inscription.niveau_id == niveau_id,
                Inscription.filiere_id == filiere_id,
                Inscription.is_active == True,
            )
            .all()
        )

        count = 0
        for inscription in inscriptions:
            try:
                self.deliberer_annuelle_inscription(
                    inscription.id, annee_academique_id, niveau_id
                )
                count += 1
            except DeliberationServiceError as exc:
                logger.warning("Délibération annuelle ignorée inscription %s: %s", inscription.id, exc)
        return count

    def marquer_resultats_valides(self, deliberation: Deliberation) -> None:
        """Verrouille les résultats après validation officielle du jury."""
        now = datetime.utcnow()
        session = (
            self.db.query(SessionExamen)
            .filter(SessionExamen.id == deliberation.session_id)
            .first()
        )
        if not session:
            return

        if deliberation.type_deliberation == "semestrielle" and deliberation.semestre:
            resultats = (
                self.db.query(ResultatSemestre)
                .join(Inscription)
                .filter(
                    ResultatSemestre.session_id == deliberation.session_id,
                    ResultatSemestre.semestre == deliberation.semestre,
                    Inscription.niveau_id == deliberation.niveau_id,
                    Inscription.filiere_id == deliberation.filiere_id,
                )
                .all()
            )
            for r in resultats:
                r.is_valide = True
                r.statut = "valide"
                r.date_deliberation = now
                r.updated_at = now
        else:
            resultats = (
                self.db.query(ResultatAnnuel)
                .join(Inscription)
                .filter(
                    ResultatAnnuel.annee_academique_id == session.annee_academique_id,
                    Inscription.niveau_id == deliberation.niveau_id,
                    Inscription.filiere_id == deliberation.filiere_id,
                )
                .all()
            )
            for r in resultats:
                r.is_valide = True
                r.statut = "valide"
                r.date_deliberation = now
                r.updated_at = now

        # commit laissé à l'appelant (valider_deliberation)

    def _compter_matieres_dette(self, etudiant_id: int, session_id: int) -> int:
        return (
            self.db.query(ResultatMatiere)
            .filter(
                ResultatMatiere.etudiant_id == etudiant_id,
                ResultatMatiere.session_id == session_id,
                ResultatMatiere.statut != "valide",
            )
            .count()
        )

    def _compter_matieres_dette_annuel(self, etudiant_id: int, annee_id: int) -> int:
        return (
            self.db.query(ResultatMatiere)
            .join(SessionExamen, ResultatMatiere.session_id == SessionExamen.id)
            .filter(
                ResultatMatiere.etudiant_id == etudiant_id,
                SessionExamen.annee_academique_id == annee_id,
                ResultatMatiere.statut != "valide",
            )
            .count()
        )
