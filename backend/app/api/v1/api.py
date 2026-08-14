from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    users,
    universites,
    etablissements,
    departements,
    cycles,
    filieres,
    niveaux,
    modules,
    matieres,
    annees_scolaires,
    etudiants,
    documents_etudiant,
    inscriptions,
    inscriptions_matieres,
    annees_academiques,
    campagnes_inscription,
    dossiers_candidature,
    pieces_jointes,
    paiements,
    inscription_publique,
    inscription_groupe,
    sessions_examen,
    examens,
    notes,
    resultats,
    deliberations,
    bulletins,
    batiments,
    salles,
    creneaux_horaires,
    seances,
    presences,
    reservations_salles,
    emplois_temps,
    types_frais,
    frais_scolarite,
    factures,
    paiements_factures,
    comptes_etudiants,
    remises,
    echeanciers,
    annees_academiques_gestion,
    modules_systeme,
    semestres,
    stages,
    soutenances,
)
from app.api.endpoints import (
    parametres,
    configurations,
    baremes,
    templates,
    regles_calcul,
    modeles_communication,
    pays,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(universites.router)
api_router.include_router(etablissements.router)
api_router.include_router(departements.router)
api_router.include_router(cycles.router)
api_router.include_router(filieres.router)
api_router.include_router(niveaux.router)
api_router.include_router(modules.router)
api_router.include_router(matieres.router)
api_router.include_router(annees_scolaires.router)
api_router.include_router(etudiants.router)
api_router.include_router(documents_etudiant.router)
api_router.include_router(inscriptions.router)
api_router.include_router(inscriptions_matieres.router)
api_router.include_router(annees_academiques.router)
api_router.include_router(campagnes_inscription.router)
api_router.include_router(dossiers_candidature.router)
api_router.include_router(pieces_jointes.router)
api_router.include_router(paiements.router)
api_router.include_router(inscription_publique.router)
api_router.include_router(inscription_groupe.router)
api_router.include_router(sessions_examen.router)
api_router.include_router(examens.router)
api_router.include_router(notes.router)
api_router.include_router(resultats.router)
api_router.include_router(deliberations.router)
api_router.include_router(bulletins.router)
api_router.include_router(batiments.router)
api_router.include_router(salles.router)
api_router.include_router(creneaux_horaires.router)
api_router.include_router(seances.router)
api_router.include_router(presences.router)
api_router.include_router(reservations_salles.router)
api_router.include_router(emplois_temps.router)
api_router.include_router(types_frais.router, prefix="/types-frais", tags=["Types de Frais"])
api_router.include_router(frais_scolarite.router, prefix="/frais-scolarite", tags=["Frais de Scolarité"])
api_router.include_router(factures.router, prefix="/factures", tags=["Factures"])
api_router.include_router(paiements_factures.router, prefix="/paiements-factures", tags=["Paiements Factures"])
api_router.include_router(comptes_etudiants.router, prefix="/comptes-etudiants", tags=["Comptes Étudiants"])
api_router.include_router(remises.router, prefix="/remises", tags=["Remises"])
api_router.include_router(echeanciers.router, prefix="/echeanciers", tags=["Échéanciers"])

# Paramétrage
api_router.include_router(parametres.router, prefix="/parametres", tags=["Paramètres Système"])
api_router.include_router(configurations.router, prefix="/configurations", tags=["Configurations Établissement"])
api_router.include_router(baremes.router, prefix="/baremes", tags=["Barèmes de Notation"])
api_router.include_router(templates.router, prefix="/templates", tags=["Templates Documents"])
api_router.include_router(regles_calcul.router, prefix="/regles-calcul", tags=["Règles de Calcul"])
api_router.include_router(modeles_communication.router, prefix="/modeles-communication", tags=["Modèles Communication"])
api_router.include_router(pays.router, prefix="/pays", tags=["Configurations Pays"])

# Gestion des années académiques LMD
api_router.include_router(annees_academiques_gestion.router, prefix="/annees-academiques", tags=["Gestion Années Académiques"])
api_router.include_router(modules_systeme.router, prefix="/modules-systeme", tags=["Modules Système"])
api_router.include_router(semestres.router, prefix="/semestres", tags=["Semestres LMD"])
api_router.include_router(stages.router, prefix="/stages", tags=["Stages"])
api_router.include_router(soutenances.router, prefix="/soutenances", tags=["Soutenances"])
