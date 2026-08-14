from app.repositories.base_repository import BaseRepository
from app.repositories.user_repository import UserRepository
from app.repositories.universite_repository import UniversiteRepository, universite_repository
from app.repositories.etablissement_repository import EtablissementRepository, etablissement_repository
from app.repositories.departement_repository import DepartementRepository, departement_repository
from app.repositories.cycle_repository import CycleRepository, cycle_repository
from app.repositories.filiere_repository import FiliereRepository, filiere_repository
from app.repositories.niveau_repository import NiveauRepository, niveau_repository
from app.repositories.module_repository import ModuleRepository, module_repository
from app.repositories.matiere_repository import MatiereRepository, matiere_repository
from app.repositories.annee_scolaire_repository import AnneeRepository, annee_repository
from app.repositories.etudiant_repository import EtudiantRepository, etudiant_repository
from app.repositories.document_etudiant_repository import DocumentEtudiantRepository, document_etudiant_repository
from app.repositories.inscription_repository import InscriptionRepository, inscription_repository
from app.repositories.inscription_matiere_repository import InscriptionMatiereRepository, inscription_matiere_repository
from app.repositories.annee_academique_repository import AnneeAcademiqueRepository, annee_academique_repository
from app.repositories.campagne_inscription_repository import CampagneInscriptionRepository, campagne_inscription_repository
from app.repositories.dossier_candidature_repository import DossierCandidatureRepository, dossier_candidature_repository
from app.repositories.piece_jointe_repository import PieceJointeRepository, piece_jointe_repository
from app.repositories.paiement_repository import PaiementRepository, paiement_repository
from app.repositories.session_examen_repository import SessionExamenRepository, session_examen_repository
from app.repositories.examen_repository import ExamenRepository, examen_repository
from app.repositories.note_repository import NoteRepository, note_repository
from app.repositories.resultat_matiere_repository import ResultatMatiereRepository, resultat_matiere_repository
from app.repositories.resultat_semestre_repository import ResultatSemestreRepository, resultat_semestre_repository
from app.repositories.resultat_annuel_repository import ResultatAnnuelRepository, resultat_annuel_repository
from app.repositories.deliberation_repository import DeliberationRepository, deliberation_repository
from app.repositories.batiment_repository import BatimentRepository, batiment_repository
from app.repositories.salle_repository import SalleRepository, salle_repository
from app.repositories.creneau_horaire_repository import CreneauHoraireRepository, creneau_horaire_repository
from app.repositories.seance_repository import SeanceRepository, seance_repository
from app.repositories.presence_repository import PresenceRepository, presence_repository
from app.repositories.reservation_salle_repository import ReservationSalleRepository, reservation_salle_repository
from app.repositories.emploi_temps_repository import EmploiTempsRepository, emploi_temps_repository
from app.repositories.type_frais_repository import TypeFraisRepository, type_frais_repository
from app.repositories.frais_scolarite_repository import FraisScolariteRepository, frais_scolarite_repository
from app.repositories.facture_repository import FactureRepository, facture_repository
from app.repositories.paiement_facture_repository import PaiementFactureRepository, paiement_facture_repository
from app.repositories.compte_etudiant_repository import CompteEtudiantRepository, compte_etudiant_repository
from app.repositories.remise_repository import RemiseRepository, remise_repository
from app.repositories.echeancier_repository import EcheancierRepository, echeancier_repository

__all__ = [
    # Base
    "BaseRepository",
    # User
    "UserRepository",
    # Universite
    "UniversiteRepository",
    "universite_repository",
    # Etablissement
    "EtablissementRepository",
    "etablissement_repository",
    # Departement
    "DepartementRepository",
    "departement_repository",
    # Cycle
    "CycleRepository",
    "cycle_repository",
    # Filiere
    "FiliereRepository",
    "filiere_repository",
    # Niveau
    "NiveauRepository",
    "niveau_repository",
    # Module
    "ModuleRepository",
    "module_repository",
    # Matiere
    "MatiereRepository",
    "matiere_repository",
    # Annee
    "AnneeRepository",
    "annee_repository",
    # Etudiant
    "EtudiantRepository",
    "etudiant_repository",
    # DocumentEtudiant
    "DocumentEtudiantRepository",
    "document_etudiant_repository",
    # Inscription
    "InscriptionRepository",
    "inscription_repository",
    # InscriptionMatiere
    "InscriptionMatiereRepository",
    "inscription_matiere_repository",
    # AnneeAcademique
    "AnneeAcademiqueRepository",
    "annee_academique_repository",
    # CampagneInscription
    "CampagneInscriptionRepository",
    "campagne_inscription_repository",
    # DossierCandidature
    "DossierCandidatureRepository",
    "dossier_candidature_repository",
    # PieceJointe
    "PieceJointeRepository",
    "piece_jointe_repository",
    # Paiement
    "PaiementRepository",
    "paiement_repository",
    # SessionExamen
    "SessionExamenRepository",
    "session_examen_repository",
    # Examen
    "ExamenRepository",
    "examen_repository",
    # Note
    "NoteRepository",
    "note_repository",
    # ResultatMatiere
    "ResultatMatiereRepository",
    "resultat_matiere_repository",
    # ResultatSemestre
    "ResultatSemestreRepository",
    "resultat_semestre_repository",
    # ResultatAnnuel
    "ResultatAnnuelRepository",
    "resultat_annuel_repository",
    # Deliberation
    "DeliberationRepository",
    "deliberation_repository",
    # Batiment
    "BatimentRepository",
    "batiment_repository",
    # Salle
    "SalleRepository",
    "salle_repository",
    # CreneauHoraire
    "CreneauHoraireRepository",
    "creneau_horaire_repository",
    # Seance
    "SeanceRepository",
    "seance_repository",
    # Presence
    "PresenceRepository",
    "presence_repository",
    # ReservationSalle
    "ReservationSalleRepository",
    "reservation_salle_repository",
    # EmploiTemps
    "EmploiTempsRepository",
    "emploi_temps_repository",
    # TypeFrais
    "TypeFraisRepository",
    "type_frais_repository",
    # FraisScolarite
    "FraisScolariteRepository",
    "frais_scolarite_repository",
    # Facture
    "FactureRepository",
    "facture_repository",
    # PaiementFacture
    "PaiementFactureRepository",
    "paiement_facture_repository",
    # CompteEtudiant
    "CompteEtudiantRepository",
    "compte_etudiant_repository",
    # Remise
    "RemiseRepository",
    "remise_repository",
    # Echeancier
    "EcheancierRepository",
    "echeancier_repository",
]
