"""
Script pour créer les données de référence pour le module finances.
Exécuter avec : python -m app.scripts.seed_finances
"""

import asyncio
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_maker
from app.models.type_frais import TypeFrais
from app.models.frais_scolarite import FraisScolarite
from app.models.remise import Remise
from app.models.annee_academique import AnneeAcademique
from app.models.niveau import Niveau
from app.models.filiere import Filiere


# Types de frais par défaut
TYPES_FRAIS = [
    {
        "code": "INSC",
        "libelle": "Frais d'inscription",
        "categorie": "inscription",
        "montant_defaut": Decimal("50000"),
        "est_obligatoire": True,
        "est_recurrent": True,
        "periode_application": "annuel",
        "description": "Frais d'inscription annuels",
        "compte_comptable": "706100",
    },
    {
        "code": "SCOL",
        "libelle": "Frais de scolarité",
        "categorie": "scolarite",
        "montant_defaut": Decimal("500000"),
        "est_obligatoire": True,
        "est_recurrent": True,
        "periode_application": "annuel",
        "description": "Frais de scolarité annuels",
        "compte_comptable": "706200",
    },
    {
        "code": "EXAM",
        "libelle": "Frais d'examen",
        "categorie": "examen",
        "montant_defaut": Decimal("25000"),
        "est_obligatoire": True,
        "est_recurrent": True,
        "periode_application": "semestriel",
        "description": "Frais d'examen par semestre",
        "compte_comptable": "706300",
    },
    {
        "code": "BIBLIO",
        "libelle": "Frais de bibliothèque",
        "categorie": "bibliotheque",
        "montant_defaut": Decimal("15000"),
        "est_obligatoire": False,
        "est_recurrent": True,
        "periode_application": "annuel",
        "description": "Accès à la bibliothèque universitaire",
        "compte_comptable": "706400",
    },
    {
        "code": "SPORT",
        "libelle": "Frais d'activités sportives",
        "categorie": "sport",
        "montant_defaut": Decimal("10000"),
        "est_obligatoire": False,
        "est_recurrent": True,
        "periode_application": "annuel",
        "description": "Accès aux infrastructures sportives",
        "compte_comptable": "706500",
    },
    {
        "code": "LABO",
        "libelle": "Frais de laboratoire",
        "categorie": "autre",
        "montant_defaut": Decimal("30000"),
        "est_obligatoire": False,
        "est_recurrent": True,
        "periode_application": "semestriel",
        "description": "Accès aux laboratoires (filières scientifiques)",
        "compte_comptable": "706600",
    },
    {
        "code": "CARTE",
        "libelle": "Carte d'étudiant",
        "categorie": "autre",
        "montant_defaut": Decimal("5000"),
        "est_obligatoire": True,
        "est_recurrent": False,
        "periode_application": None,
        "description": "Carte d'étudiant (première année uniquement)",
        "compte_comptable": "706700",
    },
    {
        "code": "ASSUR",
        "libelle": "Assurance étudiant",
        "categorie": "autre",
        "montant_defaut": Decimal("20000"),
        "est_obligatoire": True,
        "est_recurrent": True,
        "periode_application": "annuel",
        "description": "Assurance responsabilité civile étudiant",
        "compte_comptable": "706800",
    },
]

# Remises par défaut
REMISES = [
    {
        "code": "BOURSE_EXCELLENCE",
        "libelle": "Bourse d'excellence",
        "type_remise": "pourcentage",
        "valeur": Decimal("50"),
        "conditions": "Moyenne générale >= 16/20 l'année précédente",
        "nombre_utilisations_max": 50,
    },
    {
        "code": "BOURSE_SOCIALE",
        "libelle": "Bourse sociale",
        "type_remise": "pourcentage",
        "valeur": Decimal("30"),
        "conditions": "Sur dossier social validé par la commission",
        "nombre_utilisations_max": 100,
    },
    {
        "code": "REDUCTION_FRATRIE",
        "libelle": "Réduction fratrie",
        "type_remise": "pourcentage",
        "valeur": Decimal("10"),
        "conditions": "2ème enfant ou plus inscrit dans l'établissement",
        "nombre_utilisations_max": None,
    },
    {
        "code": "PAIEMENT_ANTICIPE",
        "libelle": "Réduction paiement anticipé",
        "type_remise": "pourcentage",
        "valeur": Decimal("5"),
        "conditions": "Paiement intégral avant le 30 septembre",
        "nombre_utilisations_max": None,
    },
    {
        "code": "ANCIEN_ETUDIANT",
        "libelle": "Réduction ancien étudiant",
        "type_remise": "montant_fixe",
        "valeur": Decimal("25000"),
        "conditions": "Étudiant ayant déjà été inscrit l'année précédente",
        "nombre_utilisations_max": None,
    },
]


async def seed_types_frais(session: AsyncSession) -> list[TypeFrais]:
    """Crée les types de frais par défaut"""
    types_frais = []
    
    for data in TYPES_FRAIS:
        # Vérifier si le type existe déjà
        result = await session.execute(
            select(TypeFrais).where(TypeFrais.code == data["code"])
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            print(f"Type de frais '{data['code']}' existe déjà, ignoré.")
            types_frais.append(existing)
        else:
            type_frais = TypeFrais(**data)
            session.add(type_frais)
            types_frais.append(type_frais)
            print(f"Type de frais '{data['code']}' créé.")
    
    await session.commit()
    return types_frais


async def seed_remises(session: AsyncSession) -> list[Remise]:
    """Crée les remises par défaut"""
    remises = []
    today = date.today()
    
    # Dates de validité : année académique en cours
    if today.month >= 9:
        date_debut = date(today.year, 9, 1)
        date_fin = date(today.year + 1, 8, 31)
    else:
        date_debut = date(today.year - 1, 9, 1)
        date_fin = date(today.year, 8, 31)
    
    for data in REMISES:
        # Vérifier si la remise existe déjà
        result = await session.execute(
            select(Remise).where(Remise.code == data["code"])
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            print(f"Remise '{data['code']}' existe déjà, ignorée.")
            remises.append(existing)
        else:
            remise = Remise(
                **data,
                date_debut=date_debut,
                date_fin=date_fin,
            )
            session.add(remise)
            remises.append(remise)
            print(f"Remise '{data['code']}' créée.")
    
    await session.commit()
    return remises


async def seed_frais_scolarite(
    session: AsyncSession,
    types_frais: list[TypeFrais],
) -> None:
    """Crée les frais de scolarité pour l'année en cours"""
    
    # Récupérer l'année académique active
    result = await session.execute(
        select(AnneeAcademique).where(AnneeAcademique.statut == True)
    )
    annee_active = result.scalar_one_or_none()
    
    if not annee_active:
        print("Aucune année académique active trouvée. Frais de scolarité non créés.")
        return
    
    # Récupérer tous les niveaux
    result = await session.execute(select(Niveau))
    niveaux = result.scalars().all()
    
    if not niveaux:
        print("Aucun niveau trouvé. Frais de scolarité non créés.")
        return
    
    # Dates de validité
    today = date.today()
    if today.month >= 9:
        date_debut = date(today.year, 9, 1)
        date_fin = date(today.year + 1, 8, 31)
    else:
        date_debut = date(today.year - 1, 9, 1)
        date_fin = date(today.year, 8, 31)
    
    # Créer les frais obligatoires pour chaque niveau
    types_obligatoires = [t for t in types_frais if t.est_obligatoire]
    
    for niveau in niveaux:
        for type_frais in types_obligatoires:
            # Vérifier si le frais existe déjà
            result = await session.execute(
                select(FraisScolarite).where(
                    FraisScolarite.type_frais_id == type_frais.id,
                    FraisScolarite.niveau_id == niveau.id,
                    FraisScolarite.annee_academique_id == annee_active.id,
                )
            )
            existing = result.scalar_one_or_none()
            
            if existing:
                continue
            
            frais = FraisScolarite(
                type_frais_id=type_frais.id,
                niveau_id=niveau.id,
                annee_academique_id=annee_active.id,
                montant=type_frais.montant_defaut or Decimal("0"),
                date_debut_validite=date_debut,
                date_fin_validite=date_fin,
                description=f"{type_frais.libelle} - {niveau.libelle}",
            )
            session.add(frais)
    
    await session.commit()
    print(f"Frais de scolarité créés pour l'année {annee_active.code}.")


async def main():
    """Fonction principale"""
    print("=" * 50)
    print("Initialisation des données finances")
    print("=" * 50)
    
    async with async_session_maker() as session:
        # 1. Créer les types de frais
        print("\n--- Types de frais ---")
        types_frais = await seed_types_frais(session)
        
        # 2. Créer les remises
        print("\n--- Remises ---")
        await seed_remises(session)
        
        # 3. Créer les frais de scolarité
        print("\n--- Frais de scolarité ---")
        await seed_frais_scolarite(session, types_frais)
    
    print("\n" + "=" * 50)
    print("Initialisation terminée avec succès!")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())
