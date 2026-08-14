"""
Script pour vérifier la structure de la table etudiant
"""

from sqlalchemy import inspect
from app.core.database import engine

def check_table():
    inspector = inspect(engine)
    
    # Vérifier si la table 'etudiant' existe
    tables = inspector.get_table_names()
    print("Tables contenant 'etudiant':")
    for t in tables:
        if 'etudiant' in t.lower():
            print(f"  - {t}")
    
    # Vérifier la structure de la table 'etudiant'
    if 'etudiant' in tables:
        print("\nColonnes de la table 'etudiant':")
        columns = inspector.get_columns('etudiant')
        for col in columns:
            print(f"  - {col['name']}: {col['type']} (nullable={col.get('nullable', True)})")
        
        # Vérifier les index
        print("\nIndex de la table 'etudiant':")
        indexes = inspector.get_indexes('etudiant')
        for idx in indexes:
            print(f"  - {idx['name']}: {idx['column_names']} (unique={idx.get('unique', False)})")
        
        # Vérifier les contraintes uniques
        print("\nContraintes uniques de la table 'etudiant':")
        unique_constraints = inspector.get_unique_constraints('etudiant')
        for uc in unique_constraints:
            print(f"  - {uc['name']}: {uc['column_names']}")

if __name__ == "__main__":
    check_table()
