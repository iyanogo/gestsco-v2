"""
Script pour vérifier les nouvelles tables
"""

from sqlalchemy import inspect
from app.core.database import engine

def check_tables():
    inspector = inspect(engine)
    
    tables_to_check = ['documents_etudiant', 'inscriptions', 'inscriptions_matieres']
    
    for table_name in tables_to_check:
        if table_name in inspector.get_table_names():
            print(f"\n=== Table '{table_name}' ===")
            columns = inspector.get_columns(table_name)
            for col in columns:
                print(f"  - {col['name']}: {col['type']} (nullable={col.get('nullable', True)})")
        else:
            print(f"\nTable '{table_name}' NOT FOUND!")

if __name__ == "__main__":
    check_tables()
