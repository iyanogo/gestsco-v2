"""Script pour vérifier la structure des tables existantes."""
import sys
sys.path.insert(0, '.')
from app.core.database import engine
from sqlalchemy import inspect

insp = inspect(engine)

tables_to_check = ['universite', 'etablissement', 'departement', 'cycle', 'filiere', 'niveau', 'module', 'matiere']

for table in tables_to_check:
    if table in insp.get_table_names():
        print(f"\n=== Table: {table} ===")
        cols = insp.get_columns(table)
        for c in cols:
            print(f"  {c['name']}: {c['type']}")
    else:
        print(f"\n=== Table: {table} === NOT FOUND")
