from app.core.database import Base
from app.models.user import User
from app.models.universite import Universite
from app.models.etablissement import Etablissement
from app.models.departement import Departement
from app.models.cycle import Cycle
from app.models.filiere import Filiere
from app.models.niveau import Niveau
from app.models.module import Module
from app.models.matiere import Matiere
from app.models.annee_scolaire import Annee
from app.models.etudiant import Etudiant
from app.models.document_etudiant import DocumentEtudiant
from app.models.inscription import Inscription
from app.models.inscription_matiere import InscriptionMatiere
from app.models.annee_academique import AnneeAcademique
from app.models.campagne_inscription import CampagneInscription
from app.models.type_piece_requise import TypePieceRequise
from app.models.dossier_candidature import DossierCandidature
from app.models.piece_jointe import PieceJointe
from app.models.paiement import Paiement
from app.models.inscrit import Inscrit
from app.models.session_examen import SessionExamen
from app.models.examen import Examen
from app.models.note import Note
from app.models.resultat_matiere import ResultatMatiere
from app.models.resultat_semestre import ResultatSemestre
from app.models.resultat_annuel import ResultatAnnuel
from app.models.deliberation import Deliberation
from app.models.batiment import Batiment
from app.models.salle import Salle
from app.models.creneau_horaire import CreneauHoraire
from app.models.seance import Seance
from app.models.presence import Presence
from app.models.reservation_salle import ReservationSalle
from app.models.emploi_temps import EmploiTemps
from app.models.type_frais import TypeFrais
from app.models.frais_scolarite import FraisScolarite
from app.models.facture import Facture
from app.models.ligne_facture import LigneFacture
from app.models.paiement_facture import PaiementFacture
from app.models.compte_etudiant import CompteEtudiant
from app.models.mouvement_compte import MouvementCompte
from app.models.remise import Remise
from app.models.remise_etudiant import RemiseEtudiant
from app.models.echeancier import Echeancier
from app.models.parametre_systeme import ParametreSysteme
from app.models.configuration_etablissement import ConfigurationEtablissement
from app.models.bareme_notation import BaremeNotation
from app.models.mention_notation import MentionNotation
from app.models.template_document import TemplateDocument
from app.models.regles_calcul import RegleCalcul
from app.models.modele_email import ModeleEmail
from app.models.modele_sms import ModeleSMS
from app.models.pays_configuration import PaysConfiguration
from app.models.semestre import Semestre
from app.models.module_systeme import ModuleSysteme
from app.models.module_actif import ModuleActif
from app.models.periode_comptable import PeriodeComptable
from app.models.stage import Stage
from app.models.soutenance import Soutenance
from app.models.configuration_deliberation import ConfigurationDeliberation

__all__ = [
    "Base",
    "User",
    "Universite",
    "Etablissement",
    "Departement",
    "Cycle",
    "Filiere",
    "Niveau",
    "Module",
    "Matiere",
    "Annee",
    "Etudiant",
    "DocumentEtudiant",
    "Inscription",
    "InscriptionMatiere",
    "AnneeAcademique",
    "CampagneInscription",
    "TypePieceRequise",
    "DossierCandidature",
    "PieceJointe",
    "Paiement",
    "Inscrit",
    "SessionExamen",
    "Examen",
    "Note",
    "ResultatMatiere",
    "ResultatSemestre",
    "ResultatAnnuel",
    "Deliberation",
    "Batiment",
    "Salle",
    "CreneauHoraire",
    "Seance",
    "Presence",
    "ReservationSalle",
    "EmploiTemps",
    "TypeFrais",
    "FraisScolarite",
    "Facture",
    "LigneFacture",
    "PaiementFacture",
    "CompteEtudiant",
    "MouvementCompte",
    "Remise",
    "RemiseEtudiant",
    "Echeancier",
    "ParametreSysteme",
    "ConfigurationEtablissement",
    "BaremeNotation",
    "MentionNotation",
    "TemplateDocument",
    "RegleCalcul",
    "ModeleEmail",
    "ModeleSMS",
    "PaysConfiguration",
    "Semestre",
    "ModuleSysteme",
    "ModuleActif",
    "PeriodeComptable",
    "Stage",
    "Soutenance",
    "ConfigurationDeliberation",
]