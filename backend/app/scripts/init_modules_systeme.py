"""
Script d'initialisation des modules système.
Définit les modules fonctionnels disponibles dans l'application.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.module_systeme import ModuleSysteme


def init_modules_systeme(db: Session):
    """
    Initialise les modules système.
    
    Modules disponibles :
    - REFERENTIEL : Gestion du référentiel (obligatoire)
    - ETUDIANTS : Gestion des étudiants (obligatoire)
    - INSCRIPTIONS : Gestion des inscriptions (obligatoire)
    - EVALUATIONS : Gestion des évaluations (obligatoire)
    - EMPLOI_TEMPS : Gestion des emplois du temps
    - FINANCES : Gestion financière
    - STAGES : Gestion des stages et soutenances
    - BIBLIOTHEQUE : Gestion de la bibliothèque
    - COMMUNICATION : Communication et notifications
    """
    
    modules_data = [
        {
            "code": "REFERENTIEL",
            "libelle": "Référentiel",
            "description": "Gestion du référentiel académique : filières, modules, matières, niveaux, cycles.",
            "icone": "book",
            "ordre": 1,
            "est_obligatoire": True,
            "permissions_requises": ["admin", "scolarite"],
            "dependances": None
        },
        {
            "code": "ETUDIANTS",
            "libelle": "Étudiants",
            "description": "Gestion des dossiers étudiants : informations personnelles, documents, historique.",
            "icone": "people",
            "ordre": 2,
            "est_obligatoire": True,
            "permissions_requises": ["admin", "scolarite"],
            "dependances": ["REFERENTIEL"]
        },
        {
            "code": "INSCRIPTIONS",
            "libelle": "Inscriptions",
            "description": "Gestion des inscriptions : campagnes, candidatures, validation des dossiers.",
            "icone": "person-plus",
            "ordre": 3,
            "est_obligatoire": True,
            "permissions_requises": ["admin", "scolarite"],
            "dependances": ["REFERENTIEL", "ETUDIANTS"]
        },
        {
            "code": "EVALUATIONS",
            "libelle": "Évaluations",
            "description": "Gestion des évaluations : examens, notes, délibérations, bulletins.",
            "icone": "clipboard-check",
            "ordre": 4,
            "est_obligatoire": True,
            "permissions_requises": ["admin", "scolarite", "enseignant"],
            "dependances": ["REFERENTIEL", "ETUDIANTS", "INSCRIPTIONS"]
        },
        {
            "code": "EMPLOI_TEMPS",
            "libelle": "Emploi du temps",
            "description": "Gestion des emplois du temps : créneaux, salles, séances, présences.",
            "icone": "calendar3",
            "ordre": 5,
            "est_obligatoire": False,
            "permissions_requises": ["admin", "scolarite", "enseignant"],
            "dependances": ["REFERENTIEL"]
        },
        {
            "code": "FINANCES",
            "libelle": "Finances",
            "description": "Gestion financière : frais de scolarité, factures, paiements, comptabilité.",
            "icone": "cash-stack",
            "ordre": 6,
            "est_obligatoire": False,
            "permissions_requises": ["admin", "comptable"],
            "dependances": ["ETUDIANTS", "INSCRIPTIONS"]
        },
        {
            "code": "STAGES",
            "libelle": "Stages et Soutenances",
            "description": "Gestion des stages : conventions, suivi, évaluation, soutenances.",
            "icone": "briefcase",
            "ordre": 7,
            "est_obligatoire": False,
            "permissions_requises": ["admin", "scolarite", "enseignant"],
            "dependances": ["ETUDIANTS", "EVALUATIONS"]
        },
        {
            "code": "BIBLIOTHEQUE",
            "libelle": "Bibliothèque",
            "description": "Gestion de la bibliothèque : ouvrages, emprunts, réservations.",
            "icone": "journal-bookmark",
            "ordre": 8,
            "est_obligatoire": False,
            "permissions_requises": ["admin", "bibliothecaire"],
            "dependances": ["ETUDIANTS"]
        },
        {
            "code": "COMMUNICATION",
            "libelle": "Communication",
            "description": "Communication et notifications : emails, SMS, annonces, messagerie.",
            "icone": "envelope",
            "ordre": 9,
            "est_obligatoire": False,
            "permissions_requises": ["admin", "scolarite"],
            "dependances": None
        },
    ]
    
    created = 0
    updated = 0
    
    for data in modules_data:
        existing = db.query(ModuleSysteme).filter(ModuleSysteme.code == data["code"]).first()
        
        if existing:
            # Mettre à jour le module existant
            existing.libelle = data["libelle"]
            existing.description = data["description"]
            existing.icone = data["icone"]
            existing.ordre = data["ordre"]
            existing.est_obligatoire = data["est_obligatoire"]
            existing.permissions_requises = data["permissions_requises"]
            existing.dependances = data["dependances"]
            updated += 1
            print(f"Module mis à jour: {data['code']}")
        else:
            # Créer le module
            module = ModuleSysteme(
                code=data["code"],
                libelle=data["libelle"],
                description=data["description"],
                icone=data["icone"],
                ordre=data["ordre"],
                est_obligatoire=data["est_obligatoire"],
                permissions_requises=data["permissions_requises"],
                dependances=data["dependances"],
                is_active=True
            )
            db.add(module)
            created += 1
            print(f"Module créé: {data['code']} - {data['libelle']}")
    
    db.commit()
    
    print(f"\n=== Résumé ===")
    print(f"Modules créés: {created}")
    print(f"Modules mis à jour: {updated}")
    print(f"Total modules: {len(modules_data)}")


def main():
    """Point d'entrée du script."""
    print("=== Initialisation des modules système ===\n")
    
    db = SessionLocal()
    try:
        init_modules_systeme(db)
        print("\n=== Initialisation terminée avec succès ===")
    except Exception as e:
        print(f"\nErreur: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
