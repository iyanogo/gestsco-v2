"""
Script pour tester l'API des années scolaires
"""

from app.repositories import annee_repository
from app.core.database import SessionLocal

db = SessionLocal()
try:
    annees = annee_repository.get_all_ordered(db)
    print(f"Nombre d'années: {len(annees)}")
    for a in annees:
        print(f"  - {a.id}: {a.code} - {a.libelle} (statut={a.statut})")
finally:
    db.close()
