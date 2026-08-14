from app.schemas.user import User, UserCreate, UserUpdate, Token, TokenData
from app.schemas.common import PaginatedResponse, MessageResponse
from app.schemas.universite import (
    Universite,
    UniversiteCreate,
    UniversiteUpdate,
    UniversiteBase,
)
from app.schemas.etablissement import (
    Etablissement,
    EtablissementCreate,
    EtablissementUpdate,
    EtablissementBase,
)
from app.schemas.departement import (
    Departement,
    DepartementCreate,
    DepartementUpdate,
    DepartementBase,
)
from app.schemas.cycle import (
    Cycle,
    CycleCreate,
    CycleUpdate,
    CycleBase,
)
from app.schemas.filiere import (
    Filiere,
    FiliereCreate,
    FiliereUpdate,
    FiliereBase,
)
from app.schemas.niveau import (
    Niveau,
    NiveauCreate,
    NiveauUpdate,
    NiveauBase,
)
from app.schemas.module import (
    Module,
    ModuleCreate,
    ModuleUpdate,
    ModuleBase,
)
from app.schemas.matiere import (
    Matiere,
    MatiereCreate,
    MatiereUpdate,
    MatiereBase,
)
from app.schemas.annee_scolaire import (
    AnneeResponse,
    AnneeCreate,
    AnneeUpdate,
    AnneeBase,
)
from app.schemas.etudiant import (
    Etudiant as EtudiantSchema,
    EtudiantCreate,
    EtudiantUpdate,
    EtudiantBase,
    EtudiantInDB,
    EtudiantWithDetails,
)
from app.schemas.document_etudiant import (
    DocumentEtudiant as DocumentEtudiantSchema,
    DocumentEtudiantCreate,
    DocumentEtudiantUpdate,
    DocumentEtudiantBase,
    DocumentEtudiantInDB,
)
from app.schemas.inscription import (
    Inscription as InscriptionSchema,
    InscriptionCreate,
    InscriptionUpdate,
    InscriptionBase,
    InscriptionInDB,
    InscriptionWithDetails,
)
from app.schemas.inscription_matiere import (
    InscriptionMatiere as InscriptionMatiereSchema,
    InscriptionMatiereCreate,
    InscriptionMatiereUpdate,
    InscriptionMatiereBase,
    InscriptionMatiereInDB,
    InscriptionMatiereWithDetails,
)
from app.schemas.annee_academique import (
    AnneeAcademique as AnneeAcademiqueSchema,
    AnneeAcademiqueCreate,
    AnneeAcademiqueUpdate,
    AnneeAcademiqueBase,
    AnneeAcademiqueInDB,
)
from app.schemas.campagne_inscription import (
    CampagneInscription as CampagneInscriptionSchema,
    CampagneInscriptionCreate,
    CampagneInscriptionUpdate,
    CampagneInscriptionBase,
    CampagneInscriptionInDB,
    CampagneInscriptionWithStats,
)
from app.schemas.dossier_candidature import (
    DossierCandidature as DossierCandidatureSchema,
    DossierCandidatureCreate,
    DossierCandidatureUpdate,
    DossierCandidatureBase,
    DossierCandidatureInDB,
    DossierCandidatureWithDetails,
)
from app.schemas.piece_jointe import (
    PieceJointe as PieceJointeSchema,
    PieceJointeCreate,
    PieceJointeUpdate,
    PieceJointeBase,
    PieceJointeInDB,
)
from app.schemas.paiement import (
    Paiement as PaiementSchema,
    PaiementCreate,
    PaiementUpdate,
    PaiementBase,
    PaiementInDB,
    PaiementValidation,
    PaiementWithDetails,
)
from app.schemas.type_piece_requise import (
    TypePieceRequise as TypePieceRequiseSchema,
    TypePieceRequiseCreate,
    TypePieceRequiseUpdate,
    TypePieceRequiseBase,
    TypePieceRequiseInDB,
)
from app.schemas.inscrit import (
    Inscrit as InscritSchema,
    InscritCreate,
    InscritUpdate,
    InscritBase,
    InscritInDB,
    InscritWithDetails,
)
from app.schemas.session_examen import (
    SessionExamen as SessionExamenSchema,
    SessionExamenCreate,
    SessionExamenUpdate,
    SessionExamenBase,
    SessionExamenInDB,
    SessionExamenWithStats,
)
from app.schemas.examen import (
    Examen as ExamenSchema,
    ExamenCreate,
    ExamenUpdate,
    ExamenBase,
    ExamenInDB,
    ExamenWithDetails,
)
from app.schemas.note import (
    Note as NoteSchema,
    NoteCreate,
    NoteUpdate,
    NoteBase,
    NoteInDB,
    NoteBulkCreate,
    NoteBulkItem,
    NoteWithDetails,
    NoteValidation,
)
from app.schemas.resultat import (
    ResultatMatiere as ResultatMatiereSchema,
    ResultatMatiereCreate,
    ResultatMatiereUpdate,
    ResultatMatiereBase,
    ResultatMatiereInDB,
    ResultatMatiereWithDetails,
    ResultatSemestre as ResultatSemestreSchema,
    ResultatSemestreCreate,
    ResultatSemestreUpdate,
    ResultatSemestreBase,
    ResultatSemestreInDB,
    ResultatSemestreWithDetails,
    ResultatAnnuel as ResultatAnnuelSchema,
    ResultatAnnuelCreate,
    ResultatAnnuelUpdate,
    ResultatAnnuelBase,
    ResultatAnnuelInDB,
    ResultatAnnuelWithDetails,
)
from app.schemas.deliberation import (
    Deliberation as DeliberationSchema,
    DeliberationCreate,
    DeliberationUpdate,
    DeliberationBase,
    DeliberationInDB,
    DeliberationWithDetails,
    DeliberationStats,
    DeliberationValidation,
    DeliberationPublication,
)
from app.schemas.batiment import (
    Batiment as BatimentSchema,
    BatimentCreate,
    BatimentUpdate,
    BatimentBase,
    BatimentInDB,
    BatimentWithEtablissement,
)
from app.schemas.salle import (
    Salle as SalleSchema,
    SalleCreate,
    SalleUpdate,
    SalleBase,
    SalleInDB,
    SalleWithBatiment,
    SalleWithDisponibilite,
)
from app.schemas.creneau_horaire import (
    CreneauHoraire as CreneauHoraireSchema,
    CreneauHoraireCreate,
    CreneauHoraireUpdate,
    CreneauHoraireBase,
    CreneauHoraireInDB,
)
from app.schemas.seance import (
    Seance as SeanceSchema,
    SeanceCreate,
    SeanceUpdate,
    SeanceBase,
    SeanceInDB,
    SeanceWithDetails,
    SeanceRecurrenteCreate,
    SeanceStatut,
)
from app.schemas.presence import (
    Presence as PresenceSchema,
    PresenceCreate,
    PresenceUpdate,
    PresenceBase,
    PresenceInDB,
    PresenceWithEtudiant,
    PresenceBulkCreate,
    PresenceItem,
    StatistiquesPresence,
)
from app.schemas.reservation_salle import (
    ReservationSalle as ReservationSalleSchema,
    ReservationSalleCreate,
    ReservationSalleUpdate,
    ReservationSalleBase,
    ReservationSalleInDB,
    ReservationSalleWithDetails,
    ReservationApprouver,
    ReservationRefuser,
)
from app.schemas.emploi_temps import (
    EmploiTemps as EmploiTempsSchema,
    EmploiTempsCreate,
    EmploiTempsUpdate,
    EmploiTempsBase,
    EmploiTempsInDB,
    EmploiTempsWithDetails,
    EmploiTempsWithSeances,
    EmploiTempsPublier,
    EmploiTempsValider,
    JourSemaine,
    EmploiTempsSemaine,
)
from app.schemas.type_frais import (
    TypeFrais as TypeFraisSchema,
    TypeFraisCreate,
    TypeFraisUpdate,
    TypeFraisBase,
    TypeFraisInDB,
)
from app.schemas.frais_scolarite import (
    FraisScolarite as FraisScolariteSchema,
    FraisScolariteCreate,
    FraisScolariteUpdate,
    FraisScolariteBase,
    FraisScolariteInDB,
    FraisScolariteWithDetails,
)
from app.schemas.ligne_facture import (
    LigneFacture as LigneFactureSchema,
    LigneFactureCreate,
    LigneFactureUpdate,
    LigneFactureBase,
    LigneFactureInDB,
)
from app.schemas.facture import (
    Facture as FactureSchema,
    FactureCreate,
    FactureUpdate,
    FactureBase,
    FactureInDB,
    FactureWithDetails,
    FactureWithPaiements,
    FactureAnnuler,
)
from app.schemas.paiement_facture import (
    PaiementFacture as PaiementFactureSchema,
    PaiementFactureCreate,
    PaiementFactureUpdate,
    PaiementFactureBase,
    PaiementFactureInDB,
    PaiementFactureWithDetails,
    PaiementFactureValider,
    PaiementFactureRejeter,
)
from app.schemas.compte_etudiant import (
    CompteEtudiant as CompteEtudiantSchema,
    CompteEtudiantCreate,
    CompteEtudiantUpdate,
    CompteEtudiantBase,
    CompteEtudiantInDB,
    CompteEtudiantWithDetails,
    CompteEtudiantWithMouvements,
)
from app.schemas.mouvement_compte import (
    MouvementCompte as MouvementCompteSchema,
    MouvementCompteCreate,
    MouvementCompteBase,
    MouvementCompteInDB,
    MouvementCompteWithDetails,
)
from app.schemas.remise import (
    Remise as RemiseSchema,
    RemiseCreate,
    RemiseUpdate,
    RemiseBase,
    RemiseInDB,
    RemiseWithDetails,
)
from app.schemas.remise_etudiant import (
    RemiseEtudiant as RemiseEtudiantSchema,
    RemiseEtudiantCreate,
    RemiseEtudiantBase,
    RemiseEtudiantInDB,
    RemiseEtudiantWithDetails,
)
from app.schemas.echeancier import (
    Echeancier as EcheancierSchema,
    EcheancierCreate,
    EcheancierUpdate,
    EcheancierBase,
    EcheancierInDB,
    EcheancierWithDetails,
    EcheanceItem,
)

__all__ = [
    # User
    "User",
    "UserCreate",
    "UserUpdate",
    "Token",
    "TokenData",
    # Common
    "PaginatedResponse",
    "MessageResponse",
    # Universite
    "Universite",
    "UniversiteCreate",
    "UniversiteUpdate",
    "UniversiteBase",
    # Etablissement
    "Etablissement",
    "EtablissementCreate",
    "EtablissementUpdate",
    "EtablissementBase",
    # Departement
    "Departement",
    "DepartementCreate",
    "DepartementUpdate",
    "DepartementBase",
    # Cycle
    "Cycle",
    "CycleCreate",
    "CycleUpdate",
    "CycleBase",
    # Filiere
    "Filiere",
    "FiliereCreate",
    "FiliereUpdate",
    "FiliereBase",
    # Niveau
    "Niveau",
    "NiveauCreate",
    "NiveauUpdate",
    "NiveauBase",
    # Module
    "Module",
    "ModuleCreate",
    "ModuleUpdate",
    "ModuleBase",
    # Matiere
    "Matiere",
    "MatiereCreate",
    "MatiereUpdate",
    "MatiereBase",
    # Annee
    "AnneeResponse",
    "AnneeCreate",
    "AnneeUpdate",
    "AnneeBase",
    # Etudiant
    "EtudiantSchema",
    "EtudiantCreate",
    "EtudiantUpdate",
    "EtudiantBase",
    "EtudiantInDB",
    "EtudiantWithDetails",
    # DocumentEtudiant
    "DocumentEtudiantSchema",
    "DocumentEtudiantCreate",
    "DocumentEtudiantUpdate",
    "DocumentEtudiantBase",
    "DocumentEtudiantInDB",
    # Inscription
    "InscriptionSchema",
    "InscriptionCreate",
    "InscriptionUpdate",
    "InscriptionBase",
    "InscriptionInDB",
    "InscriptionWithDetails",
    # InscriptionMatiere
    "InscriptionMatiereSchema",
    "InscriptionMatiereCreate",
    "InscriptionMatiereUpdate",
    "InscriptionMatiereBase",
    "InscriptionMatiereInDB",
    "InscriptionMatiereWithDetails",
    # AnneeAcademique
    "AnneeAcademiqueSchema",
    "AnneeAcademiqueCreate",
    "AnneeAcademiqueUpdate",
    "AnneeAcademiqueBase",
    "AnneeAcademiqueInDB",
    # CampagneInscription
    "CampagneInscriptionSchema",
    "CampagneInscriptionCreate",
    "CampagneInscriptionUpdate",
    "CampagneInscriptionBase",
    "CampagneInscriptionInDB",
    "CampagneInscriptionWithStats",
    # DossierCandidature
    "DossierCandidatureSchema",
    "DossierCandidatureCreate",
    "DossierCandidatureUpdate",
    "DossierCandidatureBase",
    "DossierCandidatureInDB",
    "DossierCandidatureWithDetails",
    # PieceJointe
    "PieceJointeSchema",
    "PieceJointeCreate",
    "PieceJointeUpdate",
    "PieceJointeBase",
    "PieceJointeInDB",
    # Paiement
    "PaiementSchema",
    "PaiementCreate",
    "PaiementUpdate",
    "PaiementBase",
    "PaiementInDB",
    "PaiementValidation",
    "PaiementWithDetails",
    # TypePieceRequise
    "TypePieceRequiseSchema",
    "TypePieceRequiseCreate",
    "TypePieceRequiseUpdate",
    "TypePieceRequiseBase",
    "TypePieceRequiseInDB",
    # Inscrit
    "InscritSchema",
    "InscritCreate",
    "InscritUpdate",
    "InscritBase",
    "InscritInDB",
    "InscritWithDetails",
    # SessionExamen
    "SessionExamenSchema",
    "SessionExamenCreate",
    "SessionExamenUpdate",
    "SessionExamenBase",
    "SessionExamenInDB",
    "SessionExamenWithStats",
    # Examen
    "ExamenSchema",
    "ExamenCreate",
    "ExamenUpdate",
    "ExamenBase",
    "ExamenInDB",
    "ExamenWithDetails",
    # Note
    "NoteSchema",
    "NoteCreate",
    "NoteUpdate",
    "NoteBase",
    "NoteInDB",
    "NoteBulkCreate",
    "NoteBulkItem",
    "NoteWithDetails",
    "NoteValidation",
    # ResultatMatiere
    "ResultatMatiereSchema",
    "ResultatMatiereCreate",
    "ResultatMatiereUpdate",
    "ResultatMatiereBase",
    "ResultatMatiereInDB",
    "ResultatMatiereWithDetails",
    # ResultatSemestre
    "ResultatSemestreSchema",
    "ResultatSemestreCreate",
    "ResultatSemestreUpdate",
    "ResultatSemestreBase",
    "ResultatSemestreInDB",
    "ResultatSemestreWithDetails",
    # ResultatAnnuel
    "ResultatAnnuelSchema",
    "ResultatAnnuelCreate",
    "ResultatAnnuelUpdate",
    "ResultatAnnuelBase",
    "ResultatAnnuelInDB",
    "ResultatAnnuelWithDetails",
    # Deliberation
    "DeliberationSchema",
    "DeliberationCreate",
    "DeliberationUpdate",
    "DeliberationBase",
    "DeliberationInDB",
    "DeliberationWithDetails",
    "DeliberationStats",
    "DeliberationValidation",
    "DeliberationPublication",
    # Batiment
    "BatimentSchema",
    "BatimentCreate",
    "BatimentUpdate",
    "BatimentBase",
    "BatimentInDB",
    "BatimentWithEtablissement",
    # Salle
    "SalleSchema",
    "SalleCreate",
    "SalleUpdate",
    "SalleBase",
    "SalleInDB",
    "SalleWithBatiment",
    "SalleWithDisponibilite",
    # CreneauHoraire
    "CreneauHoraireSchema",
    "CreneauHoraireCreate",
    "CreneauHoraireUpdate",
    "CreneauHoraireBase",
    "CreneauHoraireInDB",
    # Seance
    "SeanceSchema",
    "SeanceCreate",
    "SeanceUpdate",
    "SeanceBase",
    "SeanceInDB",
    "SeanceWithDetails",
    "SeanceRecurrenteCreate",
    "SeanceStatut",
    # Presence
    "PresenceSchema",
    "PresenceCreate",
    "PresenceUpdate",
    "PresenceBase",
    "PresenceInDB",
    "PresenceWithEtudiant",
    "PresenceBulkCreate",
    "PresenceItem",
    "StatistiquesPresence",
    # ReservationSalle
    "ReservationSalleSchema",
    "ReservationSalleCreate",
    "ReservationSalleUpdate",
    "ReservationSalleBase",
    "ReservationSalleInDB",
    "ReservationSalleWithDetails",
    "ReservationApprouver",
    "ReservationRefuser",
    # EmploiTemps
    "EmploiTempsSchema",
    "EmploiTempsCreate",
    "EmploiTempsUpdate",
    "EmploiTempsBase",
    "EmploiTempsInDB",
    "EmploiTempsWithDetails",
    "EmploiTempsWithSeances",
    "EmploiTempsPublier",
    "EmploiTempsValider",
    "JourSemaine",
    "EmploiTempsSemaine",
    # TypeFrais
    "TypeFraisSchema",
    "TypeFraisCreate",
    "TypeFraisUpdate",
    "TypeFraisBase",
    "TypeFraisInDB",
    # FraisScolarite
    "FraisScolariteSchema",
    "FraisScolariteCreate",
    "FraisScolariteUpdate",
    "FraisScolariteBase",
    "FraisScolariteInDB",
    "FraisScolariteWithDetails",
    # LigneFacture
    "LigneFactureSchema",
    "LigneFactureCreate",
    "LigneFactureUpdate",
    "LigneFactureBase",
    "LigneFactureInDB",
    # Facture
    "FactureSchema",
    "FactureCreate",
    "FactureUpdate",
    "FactureBase",
    "FactureInDB",
    "FactureWithDetails",
    "FactureWithPaiements",
    "FactureAnnuler",
    # PaiementFacture
    "PaiementFactureSchema",
    "PaiementFactureCreate",
    "PaiementFactureUpdate",
    "PaiementFactureBase",
    "PaiementFactureInDB",
    "PaiementFactureWithDetails",
    "PaiementFactureValider",
    "PaiementFactureRejeter",
    # CompteEtudiant
    "CompteEtudiantSchema",
    "CompteEtudiantCreate",
    "CompteEtudiantUpdate",
    "CompteEtudiantBase",
    "CompteEtudiantInDB",
    "CompteEtudiantWithDetails",
    "CompteEtudiantWithMouvements",
    # MouvementCompte
    "MouvementCompteSchema",
    "MouvementCompteCreate",
    "MouvementCompteBase",
    "MouvementCompteInDB",
    "MouvementCompteWithDetails",
    # Remise
    "RemiseSchema",
    "RemiseCreate",
    "RemiseUpdate",
    "RemiseBase",
    "RemiseInDB",
    "RemiseWithDetails",
    # RemiseEtudiant
    "RemiseEtudiantSchema",
    "RemiseEtudiantCreate",
    "RemiseEtudiantBase",
    "RemiseEtudiantInDB",
    "RemiseEtudiantWithDetails",
    # Echeancier
    "EcheancierSchema",
    "EcheancierCreate",
    "EcheancierUpdate",
    "EcheancierBase",
    "EcheancierInDB",
    "EcheancierWithDetails",
    "EcheanceItem",
]
