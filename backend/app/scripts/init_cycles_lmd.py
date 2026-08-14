"""
Script pour créer les cycles LMD dans la base de données.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy import text
from app.core.database import engine

def init_cycles():
    """Crée les cycles LMD s'ils n'existent pas."""
    
    cycles_data = [
        ("L", "Licence", "L"),
        ("M", "Master", "M"),
        ("D", "Doctorat", "D"),
    ]
    
    print("=== Creation des cycles LMD ===\n")
    
    with engine.connect() as conn:
        # Obtenir le prochain ID disponible
        max_id_result = conn.execute(text("SELECT COALESCE(MAX(id), 0) FROM cycle")).fetchone()
        next_id = max_id_result[0] + 1
        
        for code, libelle, sigle in cycles_data:
            # Vérifier si le cycle existe
            result = conn.execute(
                text("SELECT id FROM cycle WHERE code = :code"),
                {"code": code}
            ).fetchone()
            
            if result:
                print(f"Cycle {code} existe deja (id={result[0]})")
            else:
                # Créer le cycle avec un ID explicite
                conn.execute(
                    text("""
                        INSERT INTO cycle (id, code, libelle, sigle, created_date)
                        VALUES (:id, :code, :libelle, :sigle, CURRENT_TIMESTAMP)
                    """),
                    {"id": next_id, "code": code, "libelle": libelle, "sigle": sigle}
                )
                conn.commit()
                print(f"Cycle cree: {code} - {libelle} (id={next_id})")
                next_id += 1
    
    print("\n=== Cycles LMD initialises ===")


if __name__ == "__main__":
    init_cycles()
