"""
Service de gestion des délibérations.
Calcul des résultats semestriels et annuels avec compensation CAMES.
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional, List
import logging

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.deliberation import Deliberation
from app.models.resultat_semestre import ResultatSemestre
from app.models.resultat_annuel import ResultatAnnuel
from app.models.resultat_matiere import ResultatMatiere
from app.models.configuration_deliberation import ConfigurationDeliberation
from app.models.note import Note
from app.models.inscription import Inscription
from app.models.etudiant import Etudiant
from app.models.matiere import Matiere

logger = logging.getLogger(__name__)


class DeliberationServiceError(Exception):
    """Exception pour les erreurs du service délibération."""
    pass


class DeliberationService:
    """
    Service pour la gestion des délibérations.
    
    Fonctionnalités :
    - Calcul des résultats semestriels
    - Application de la compensation entre semestres
    - Génération des bulletins
    - Lancement des délibérations
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def calculer_resultats_semestre(
        self,
        etudiant_id: int,
        niveau_id: int,
        semestre: int,
        annee_id: int
    ) -> ResultatSemestre:
        """
        Calcule les résultats d'un étudiant pour un semestre.
        
        Args:
            etudiant_id: ID de l'étudiant
            niveau_id: ID du niveau
            semestre: Numéro du semestre (1 ou 2)
            annee_id: ID de l'année académique
            
        Returns:
            Le résultat du semestre
        """
        # Récupérer la configuration
        config = self._get_configuration(annee_id, niveau_id)
        
        # Récupérer les notes du semestre
        notes = self._get_notes_semestre(etudiant_id, niveau_id, semestre, annee_id)
        
        if not notes:
            raise DeliberationServiceError(
                f"Aucune note trouvée pour l'étudiant {etudiant_id} au semestre {semestre}."
            )
        
        # Calculer la moyenne pondérée
        total_points = Decimal("0")
        total_coefficients = Decimal("0")
        credits_obtenus = 0
        matieres_validees = 0
        matieres_en_dette = 0
        
        for note in notes:
            matiere = note.matiere
            coefficient = Decimal(str(matiere.coefficient or 1))
            credits = matiere.credits or 0
            
            total_points += Decimal(str(note.note_finale or 0)) * coefficient
            total_coefficients += coefficient
            
            # Vérifier si la matière est validée
            if note.note_finale and note.note_finale >= 10:
                credits_obtenus += credits
                matieres_validees += 1
            else:
                matieres_en_dette += 1
        
        # Calculer la moyenne
        moyenne = total_points / total_coefficients if total_coefficients > 0 else Decimal("0")
        moyenne = round(moyenne, 2)
        
        # Déterminer la mention
        mention = self._determiner_mention(moyenne)
        
        # Déterminer la décision
        decision = self._determiner_decision_semestre(
            moyenne, credits_obtenus, matieres_en_dette, config
        )
        
        # Créer ou mettre à jour le résultat
        resultat = self.db.query(ResultatSemestre).filter(
            ResultatSemestre.etudiant_id == etudiant_id,
            ResultatSemestre.niveau_id == niveau_id,
            ResultatSemestre.annee_academique_id == annee_id,
            ResultatSemestre.semestre_numero == semestre
        ).first()
        
        if not resultat:
            resultat = ResultatSemestre(
                etudiant_id=etudiant_id,
                niveau_id=niveau_id,
                annee_academique_id=annee_id,
                semestre_numero=semestre
            )
            self.db.add(resultat)
        
        resultat.moyenne = moyenne
        resultat.credits_obtenus = credits_obtenus
        resultat.mention = mention
        resultat.decision = decision
        resultat.peut_compenser = moyenne >= Decimal("8.0")  # Seuil de compensation
        
        self.db.commit()
        
        logger.info(
            f"Résultat semestre {semestre} calculé pour étudiant {etudiant_id}: "
            f"moyenne={moyenne}, crédits={credits_obtenus}, décision={decision}"
        )
        
        return resultat
    
    def appliquer_compensation(
        self,
        etudiant_id: int,
        niveau_id: int,
        annee_id: int
    ) -> ResultatAnnuel:
        """
        Applique la compensation entre les deux semestres.
        
        Args:
            etudiant_id: ID de l'étudiant
            niveau_id: ID du niveau
            annee_id: ID de l'année académique
            
        Returns:
            Le résultat annuel
        """
        # Récupérer la configuration
        config = self._get_configuration(annee_id, niveau_id)
        
        # Récupérer les résultats des deux semestres
        resultat_s1 = self.db.query(ResultatSemestre).filter(
            ResultatSemestre.etudiant_id == etudiant_id,
            ResultatSemestre.niveau_id == niveau_id,
            ResultatSemestre.annee_academique_id == annee_id,
            ResultatSemestre.semestre_numero == 1
        ).first()
        
        resultat_s2 = self.db.query(ResultatSemestre).filter(
            ResultatSemestre.etudiant_id == etudiant_id,
            ResultatSemestre.niveau_id == niveau_id,
            ResultatSemestre.annee_academique_id == annee_id,
            ResultatSemestre.semestre_numero == 2
        ).first()
        
        if not resultat_s1 or not resultat_s2:
            raise DeliberationServiceError(
                f"Les résultats des deux semestres sont requis pour la compensation."
            )
        
        # Calculer la moyenne annuelle
        moyenne_annuelle = (resultat_s1.moyenne + resultat_s2.moyenne) / 2
        moyenne_annuelle = round(moyenne_annuelle, 2)
        
        # Calculer les crédits totaux
        credits_totaux = (resultat_s1.credits_obtenus or 0) + (resultat_s2.credits_obtenus or 0)
        
        # Appliquer la compensation si configurée
        compensation_appliquee = False
        decision = "redouble"
        
        if config and config.compensation_semestres:
            # Vérifier si la compensation est possible
            if config.peut_compenser(resultat_s1.moyenne, resultat_s2.moyenne):
                compensation_appliquee = True
                decision = "admis"
                credits_totaux = 60  # Tous les crédits de l'année
                
                # Mettre à jour les résultats semestriels
                resultat_s1.compense_avec_semestre = 2
                resultat_s1.moyenne_compensee = moyenne_annuelle
                resultat_s2.compense_avec_semestre = 1
                resultat_s2.moyenne_compensee = moyenne_annuelle
        
        # Si pas de compensation, vérifier les conditions normales
        if not compensation_appliquee:
            if moyenne_annuelle >= config.moyenne_validation if config else Decimal("10"):
                decision = "admis"
            elif config and config.peut_passer_conditionnel(moyenne_annuelle, 0):
                decision = "admis_conditionnel"
        
        # Déterminer la mention
        mention = self._determiner_mention(moyenne_annuelle)
        
        # Créer ou mettre à jour le résultat annuel
        resultat_annuel = self.db.query(ResultatAnnuel).filter(
            ResultatAnnuel.etudiant_id == etudiant_id,
            ResultatAnnuel.niveau_id == niveau_id,
            ResultatAnnuel.annee_academique_id == annee_id
        ).first()
        
        if not resultat_annuel:
            resultat_annuel = ResultatAnnuel(
                etudiant_id=etudiant_id,
                niveau_id=niveau_id,
                annee_academique_id=annee_id
            )
            self.db.add(resultat_annuel)
        
        resultat_annuel.moyenne = moyenne_annuelle
        resultat_annuel.credits_obtenus = credits_totaux
        resultat_annuel.mention = mention
        resultat_annuel.decision = decision
        
        self.db.commit()
        
        logger.info(
            f"Compensation appliquée pour étudiant {etudiant_id}: "
            f"moyenne={moyenne_annuelle}, compensation={compensation_appliquee}, décision={decision}"
        )
        
        return resultat_annuel
    
    def lancer_deliberation_semestre(
        self,
        niveau_id: int,
        filiere_id: int,
        semestre: int,
        annee_id: int,
        jury: dict
    ) -> Deliberation:
        """
        Lance une délibération pour un semestre.
        
        Args:
            niveau_id: ID du niveau
            filiere_id: ID de la filière
            semestre: Numéro du semestre
            annee_id: ID de l'année académique
            jury: Composition du jury
            
        Returns:
            La délibération créée
        """
        # Créer la délibération
        deliberation = Deliberation(
            niveau_id=niveau_id,
            filiere_id=filiere_id,
            annee_academique_id=annee_id,
            semestre=semestre,
            date_deliberation=datetime.utcnow(),
            statut="en_cours"
        )
        self.db.add(deliberation)
        self.db.flush()
        
        # Récupérer les étudiants du niveau/filière
        etudiants = self._get_etudiants_niveau(niveau_id, filiere_id, annee_id)
        
        # Calculer les résultats pour chaque étudiant
        resultats = []
        for etudiant in etudiants:
            try:
                resultat = self.calculer_resultats_semestre(
                    etudiant.id, niveau_id, semestre, annee_id
                )
                resultats.append(resultat)
            except DeliberationServiceError as e:
                logger.warning(f"Erreur pour étudiant {etudiant.id}: {str(e)}")
        
        # Calculer les statistiques
        deliberation.nombre_etudiants = len(etudiants)
        deliberation.nombre_admis = sum(1 for r in resultats if r.decision == "admis")
        deliberation.nombre_ajournes = sum(1 for r in resultats if r.decision != "admis")
        
        if deliberation.nombre_etudiants > 0:
            deliberation.taux_reussite = (
                deliberation.nombre_admis / deliberation.nombre_etudiants * 100
            )
        
        deliberation.statut = "terminee"
        self.db.commit()
        
        logger.info(
            f"Délibération semestre {semestre} terminée: "
            f"{deliberation.nombre_admis}/{deliberation.nombre_etudiants} admis"
        )
        
        return deliberation
    
    def generer_bulletin_semestre(
        self,
        etudiant_id: int,
        semestre: int,
        annee_id: int
    ) -> str:
        """
        Génère le bulletin d'un étudiant pour un semestre.
        
        Args:
            etudiant_id: ID de l'étudiant
            semestre: Numéro du semestre
            annee_id: ID de l'année académique
            
        Returns:
            URL du fichier PDF généré
        """
        # Cette méthode serait implémentée avec un générateur PDF
        # Pour l'instant, retourne un placeholder
        return f"/bulletins/{annee_id}/{semestre}/{etudiant_id}.pdf"
    
    # Méthodes privées
    
    def _get_configuration(
        self,
        annee_id: int,
        niveau_id: Optional[int]
    ) -> Optional[ConfigurationDeliberation]:
        """Récupère la configuration de délibération applicable."""
        # Chercher une config spécifique au niveau
        if niveau_id:
            config = self.db.query(ConfigurationDeliberation).filter(
                ConfigurationDeliberation.annee_academique_id == annee_id,
                ConfigurationDeliberation.niveau_id == niveau_id
            ).first()
            if config:
                return config
        
        # Sinon, chercher la config globale
        return self.db.query(ConfigurationDeliberation).filter(
            ConfigurationDeliberation.annee_academique_id == annee_id,
            ConfigurationDeliberation.niveau_id == None
        ).first()
    
    def _get_notes_semestre(
        self,
        etudiant_id: int,
        niveau_id: int,
        semestre: int,
        annee_id: int
    ) -> List[Note]:
        """Récupère les notes d'un étudiant pour un semestre."""
        # Cette requête dépend du schéma exact des notes
        return self.db.query(Note).filter(
            Note.etudiant_id == etudiant_id,
            Note.annee_academique_id == annee_id
        ).all()
    
    def _get_etudiants_niveau(
        self,
        niveau_id: int,
        filiere_id: int,
        annee_id: int
    ) -> List[Etudiant]:
        """Récupère les étudiants d'un niveau/filière pour une année."""
        # Cette requête dépend du schéma exact des inscriptions
        return self.db.query(Etudiant).join(Inscription).filter(
            Inscription.niveau_id == niveau_id,
            Inscription.filiere_id == filiere_id
        ).all()
    
    def _determiner_mention(self, moyenne: Decimal) -> str:
        """Détermine la mention en fonction de la moyenne."""
        if moyenne >= 16:
            return "Très Bien"
        elif moyenne >= 14:
            return "Bien"
        elif moyenne >= 12:
            return "Assez Bien"
        elif moyenne >= 10:
            return "Passable"
        else:
            return "Insuffisant"
    
    def _determiner_decision_semestre(
        self,
        moyenne: Decimal,
        credits: int,
        matieres_dette: int,
        config: Optional[ConfigurationDeliberation]
    ) -> str:
        """Détermine la décision pour un semestre."""
        moyenne_validation = config.moyenne_validation if config else Decimal("10")
        
        if moyenne >= moyenne_validation:
            return "admis"
        elif config and config.peut_passer_conditionnel(moyenne, matieres_dette):
            return "admis_conditionnel"
        else:
            return "ajourne"
