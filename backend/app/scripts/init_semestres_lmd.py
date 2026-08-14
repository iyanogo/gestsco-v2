"""
Script d'initialisation des semestres LMD CAMES.
Structure : L (S1-S6), M (S7-S10), D (S11-S16)
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.semestre import Semestre
from app.models.cycle import Cycle


def get_or_create_cycles(db: Session) -> dict:
    """Récupère les cycles LMD existants."""
    cycles = {}
    
    cycle_codes = ["L", "M", "D"]
    
    for code in cycle_codes:
        cycle = db.query(Cycle).filter(Cycle.code == code).first()
        if cycle:
            cycles[code] = cycle
            print(f"Cycle trouve: {code} - {cycle.libelle}")
        else:
            print(f"ATTENTION: Cycle {code} non trouve dans la base de donnees")
    
    return cycles


def init_semestres_lmd(db: Session):
    """
    Initialise les 16 semestres du système LMD CAMES.
    
    Structure :
    - Licence (L) : S1-S6 (3 ans × 2 semestres = 180 crédits)
      * L1 : S1 + S2 (60 crédits)
      * L2 : S3 + S4 (60 crédits)
      * L3 : S5 + S6 (60 crédits)
    - Master (M) : S7-S10 (2 ans × 2 semestres = 120 crédits)
      * M1 : S7 + S8 (60 crédits)
      * M2 : S9 + S10 (60 crédits)
    - Doctorat (D) : S11-S16 (3 ans × 2 semestres = 180 crédits)
      * D1 : S11 + S12 (60 crédits)
      * D2 : S13 + S14 (60 crédits)
      * D3 : S15 + S16 (60 crédits)
    """
    
    # Récupérer ou créer les cycles
    cycles = get_or_create_cycles(db)
    
    # Définition des semestres
    semestres_data = [
        # Licence
        {"code": "S1", "libelle": "Semestre 1", "cycle": "L", "numero": 1, "annee": 1, "sem_annee": 1},
        {"code": "S2", "libelle": "Semestre 2", "cycle": "L", "numero": 2, "annee": 1, "sem_annee": 2},
        {"code": "S3", "libelle": "Semestre 3", "cycle": "L", "numero": 3, "annee": 2, "sem_annee": 1},
        {"code": "S4", "libelle": "Semestre 4", "cycle": "L", "numero": 4, "annee": 2, "sem_annee": 2},
        {"code": "S5", "libelle": "Semestre 5", "cycle": "L", "numero": 5, "annee": 3, "sem_annee": 1},
        {"code": "S6", "libelle": "Semestre 6", "cycle": "L", "numero": 6, "annee": 3, "sem_annee": 2},
        # Master
        {"code": "S7", "libelle": "Semestre 7", "cycle": "M", "numero": 7, "annee": 1, "sem_annee": 1},
        {"code": "S8", "libelle": "Semestre 8", "cycle": "M", "numero": 8, "annee": 1, "sem_annee": 2},
        {"code": "S9", "libelle": "Semestre 9", "cycle": "M", "numero": 9, "annee": 2, "sem_annee": 1},
        {"code": "S10", "libelle": "Semestre 10", "cycle": "M", "numero": 10, "annee": 2, "sem_annee": 2},
        # Doctorat
        {"code": "S11", "libelle": "Semestre 11", "cycle": "D", "numero": 11, "annee": 1, "sem_annee": 1},
        {"code": "S12", "libelle": "Semestre 12", "cycle": "D", "numero": 12, "annee": 1, "sem_annee": 2},
        {"code": "S13", "libelle": "Semestre 13", "cycle": "D", "numero": 13, "annee": 2, "sem_annee": 1},
        {"code": "S14", "libelle": "Semestre 14", "cycle": "D", "numero": 14, "annee": 2, "sem_annee": 2},
        {"code": "S15", "libelle": "Semestre 15", "cycle": "D", "numero": 15, "annee": 3, "sem_annee": 1},
        {"code": "S16", "libelle": "Semestre 16", "cycle": "D", "numero": 16, "annee": 3, "sem_annee": 2},
    ]
    
    created = 0
    skipped = 0
    
    for data in semestres_data:
        # Vérifier si le semestre existe déjà
        existing = db.query(Semestre).filter(Semestre.code == data["code"]).first()
        if existing:
            print(f"Semestre {data['code']} existe déjà, ignoré.")
            skipped += 1
            continue
        
        cycle = cycles.get(data["cycle"])
        if not cycle:
            print(f"Cycle {data['cycle']} non trouvé pour {data['code']}")
            continue
        
        semestre = Semestre(
            code=data["code"],
            libelle=data["libelle"],
            cycle_id=cycle.id,
            numero_semestre=data["numero"],
            annee_dans_cycle=data["annee"],
            semestre_dans_annee=data["sem_annee"],
            credits_requis=30,
            description=f"{data['libelle']} du cycle {data['cycle']} (Année {data['annee']})",
            is_active=True
        )
        db.add(semestre)
        created += 1
        print(f"Semestre créé: {data['code']} - {data['libelle']}")
    
    db.commit()
    
    print(f"\n=== Résumé ===")
    print(f"Semestres créés: {created}")
    print(f"Semestres ignorés (existants): {skipped}")
    print(f"Total semestres LMD: 16")


def main():
    """Point d'entrée du script."""
    print("=== Initialisation des semestres LMD CAMES ===\n")
    
    db = SessionLocal()
    try:
        init_semestres_lmd(db)
        print("\n=== Initialisation terminée avec succès ===")
    except Exception as e:
        print(f"\nErreur: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
