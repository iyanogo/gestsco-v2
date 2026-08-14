"""
Script pour vérifier la structure de la table annee
"""

from sqlalchemy import inspect
from app.core.database import engine

def check_table():
    inspector = inspect(engine)
    
    # Lister toutes les tables
    tables = inspector.get_table_names()
    print("Tables existantes:")
    for t in tables:
        if 'annee' in t.lower():
            print(f"  - {t}")
    
    # Vérifier si la table 'annee' existe
    if 'annee' in tables:
        print("\nColonnes de la table 'annee':")
        columns = inspector.get_columns('annee')
        for col in columns:
            print(f"  - {col['name']}: {col['type']}")

if __name__ == "__main__":
    check_table()
