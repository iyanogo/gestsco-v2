"""
Script pour initialiser les données de référence du système CAMES.
Usage: python scripts/seed_reference_data.py
"""
import sys
from pathlib import Path

# Ajouter le répertoire parent au path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models import (
    Base,
    Cycle,
    Niveau,
    Universite,
    Etablissement,
    Departement,
    Filiere,
    Module,
    Matiere,
)


def seed_cycles(db: Session) -> dict:
    """Crée les cycles LMD."""
    cycles_data = [
        {"code": "L", "libelle": "Licence", "duree_annees": 3, "ordre": 1},
        {"code": "M", "libelle": "Master", "duree_annees": 2, "ordre": 2},
        {"code": "D", "libelle": "Doctorat", "duree_annees": 3, "ordre": 3},
    ]
    
    cycles = {}
    for data in cycles_data:
        existing = db.query(Cycle).filter(Cycle.code == data["code"]).first()
        if existing:
            cycles[data["code"]] = existing
            print(f"  Cycle '{data['code']}' existe déjà")
        else:
            cycle = Cycle(**data)
            db.add(cycle)
            db.flush()
            cycles[data["code"]] = cycle
            print(f"  Cycle '{data['code']}' créé")
    
    return cycles


def seed_niveaux(db: Session, cycles: dict) -> dict:
    """Crée les niveaux pour chaque cycle."""
    niveaux_data = [
        # Licence
        {"code": "L1", "libelle": "Licence 1", "cycle_code": "L", "annee": 1, "ordre": 1},
        {"code": "L2", "libelle": "Licence 2", "cycle_code": "L", "annee": 2, "ordre": 2},
        {"code": "L3", "libelle": "Licence 3", "cycle_code": "L", "annee": 3, "ordre": 3},
        # Master
        {"code": "M1", "libelle": "Master 1", "cycle_code": "M", "annee": 1, "ordre": 4},
        {"code": "M2", "libelle": "Master 2", "cycle_code": "M", "annee": 2, "ordre": 5},
        # Doctorat
        {"code": "D1", "libelle": "Doctorat 1", "cycle_code": "D", "annee": 1, "ordre": 6},
        {"code": "D2", "libelle": "Doctorat 2", "cycle_code": "D", "annee": 2, "ordre": 7},
        {"code": "D3", "libelle": "Doctorat 3", "cycle_code": "D", "annee": 3, "ordre": 8},
    ]
    
    niveaux = {}
    for data in niveaux_data:
        existing = db.query(Niveau).filter(Niveau.code == data["code"]).first()
        if existing:
            niveaux[data["code"]] = existing
            print(f"  Niveau '{data['code']}' existe déjà")
        else:
            cycle = cycles[data.pop("cycle_code")]
            niveau = Niveau(**data, cycle_id=cycle.id)
            db.add(niveau)
            db.flush()
            niveaux[data["code"]] = niveau
            print(f"  Niveau '{data['code']}' créé")
    
    return niveaux


def seed_universite(db: Session) -> Universite:
    """Crée une université exemple."""
    existing = db.query(Universite).filter(Universite.code == "UO").first()
    if existing:
        print("  Université 'UO' existe déjà")
        return existing
    
    universite = Universite(
        code="UO",
        libelle="Université de Ouagadougou",
        sigle="UO",
        adresse="03 BP 7021 Ouagadougou 03, Burkina Faso",
        telephone="+226 25 30 70 64",
        email="contact@univ-ouaga.bf",
        site_web="https://www.univ-ouaga.bf",
    )
    db.add(universite)
    db.flush()
    print("  Université 'UO' créée")
    return universite


def seed_etablissement(db: Session, universite: Universite) -> Etablissement:
    """Crée un établissement exemple."""
    existing = db.query(Etablissement).filter(Etablissement.code == "FS").first()
    if existing:
        print("  Établissement 'FS' existe déjà")
        return existing
    
    etablissement = Etablissement(
        code="FS",
        libelle="Faculté des Sciences",
        sigle="FS",
        type_etablissement="Faculté",
        adresse="Campus universitaire de Ouagadougou",
        telephone="+226 25 30 70 65",
        email="fs@univ-ouaga.bf",
        universite_id=universite.id,
    )
    db.add(etablissement)
    db.flush()
    print("  Établissement 'FS' créé")
    return etablissement


def seed_departement(db: Session, etablissement: Etablissement) -> Departement:
    """Crée un département exemple."""
    existing = db.query(Departement).filter(Departement.code == "INFO").first()
    if existing:
        print("  Département 'INFO' existe déjà")
        return existing
    
    departement = Departement(
        code="INFO",
        libelle="Département d'Informatique",
        sigle="INFO",
        etablissement_id=etablissement.id,
    )
    db.add(departement)
    db.flush()
    print("  Département 'INFO' créé")
    return departement


def seed_filiere(db: Session, departement: Departement, cycles: dict) -> Filiere:
    """Crée une filière exemple."""
    existing = db.query(Filiere).filter(Filiere.code == "L-INFO").first()
    if existing:
        print("  Filière 'L-INFO' existe déjà")
        return existing
    
    filiere = Filiere(
        code="L-INFO",
        libelle="Licence Informatique",
        sigle="L-INFO",
        departement_id=departement.id,
        cycle_id=cycles["L"].id,
        description="Formation en informatique générale sur 3 ans",
    )
    db.add(filiere)
    db.flush()
    print("  Filière 'L-INFO' créée")
    return filiere


def seed_modules(db: Session) -> dict:
    """Crée des modules exemples."""
    modules_data = [
        {
            "code": "MOD-PROG",
            "libelle": "Programmation",
            "type_module": "Obligatoire",
            "credits": 6,
            "coefficient": 2.0,
            "description": "Module de programmation informatique",
        },
        {
            "code": "MOD-MATH",
            "libelle": "Mathématiques pour l'informatique",
            "type_module": "Obligatoire",
            "credits": 4,
            "coefficient": 1.5,
            "description": "Module de mathématiques appliquées",
        },
    ]
    
    modules = {}
    for data in modules_data:
        existing = db.query(Module).filter(Module.code == data["code"]).first()
        if existing:
            modules[data["code"]] = existing
            print(f"  Module '{data['code']}' existe déjà")
        else:
            module = Module(**data)
            db.add(module)
            db.flush()
            modules[data["code"]] = module
            print(f"  Module '{data['code']}' créé")
    
    return modules


def seed_matieres(db: Session, modules: dict) -> None:
    """Crée des matières exemples."""
    matieres_data = [
        {
            "code": "MAT-ALGO",
            "libelle": "Algorithmique",
            "sigle": "ALGO",
            "module_code": "MOD-PROG",
            "credits": 3,
            "coefficient": 1.0,
            "volume_horaire_cm": 20,
            "volume_horaire_td": 15,
            "volume_horaire_tp": 10,
            "description": "Introduction à l'algorithmique",
        },
        {
            "code": "MAT-PYTHON",
            "libelle": "Programmation Python",
            "sigle": "PYTHON",
            "module_code": "MOD-PROG",
            "credits": 3,
            "coefficient": 1.0,
            "volume_horaire_cm": 15,
            "volume_horaire_td": 10,
            "volume_horaire_tp": 20,
            "description": "Programmation en Python",
        },
        {
            "code": "MAT-ANALYSE",
            "libelle": "Analyse mathématique",
            "sigle": "ANALYSE",
            "module_code": "MOD-MATH",
            "credits": 2,
            "coefficient": 1.0,
            "volume_horaire_cm": 25,
            "volume_horaire_td": 20,
            "volume_horaire_tp": 0,
            "description": "Analyse mathématique de base",
        },
        {
            "code": "MAT-ALGEBRE",
            "libelle": "Algèbre linéaire",
            "sigle": "ALGEBRE",
            "module_code": "MOD-MATH",
            "credits": 2,
            "coefficient": 1.0,
            "volume_horaire_cm": 25,
            "volume_horaire_td": 20,
            "volume_horaire_tp": 0,
            "description": "Algèbre linéaire et matricielle",
        },
    ]
    
    for data in matieres_data:
        existing = db.query(Matiere).filter(Matiere.code == data["code"]).first()
        if existing:
            print(f"  Matière '{data['code']}' existe déjà")
        else:
            module = modules[data.pop("module_code")]
            matiere = Matiere(**data, module_id=module.id)
            db.add(matiere)
            print(f"  Matière '{data['code']}' créée")


def main():
    """Fonction principale pour initialiser les données de référence."""
    print("=" * 60)
    print("Initialisation des données de référence CAMES")
    print("=" * 60)
    
    db = SessionLocal()
    
    try:
        print("\n1. Création des cycles LMD...")
        cycles = seed_cycles(db)
        
        print("\n2. Création des niveaux...")
        niveaux = seed_niveaux(db, cycles)
        
        print("\n3. Création de l'université exemple...")
        universite = seed_universite(db)
        
        print("\n4. Création de l'établissement exemple...")
        etablissement = seed_etablissement(db, universite)
        
        print("\n5. Création du département exemple...")
        departement = seed_departement(db, etablissement)
        
        print("\n6. Création de la filière exemple...")
        filiere = seed_filiere(db, departement, cycles)
        
        print("\n7. Création des modules exemples...")
        modules = seed_modules(db)
        
        print("\n8. Création des matières exemples...")
        seed_matieres(db, modules)
        
        db.commit()
        
        print("\n" + "=" * 60)
        print("Données de référence initialisées avec succès !")
        print("=" * 60)
        
        # Résumé
        print("\nRésumé:")
        print(f"  - Cycles: {db.query(Cycle).count()}")
        print(f"  - Niveaux: {db.query(Niveau).count()}")
        print(f"  - Universités: {db.query(Universite).count()}")
        print(f"  - Établissements: {db.query(Etablissement).count()}")
        print(f"  - Départements: {db.query(Departement).count()}")
        print(f"  - Filières: {db.query(Filiere).count()}")
        print(f"  - Modules: {db.query(Module).count()}")
        print(f"  - Matières: {db.query(Matiere).count()}")
        
    except Exception as e:
        db.rollback()
        print(f"\nErreur lors de l'initialisation: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
