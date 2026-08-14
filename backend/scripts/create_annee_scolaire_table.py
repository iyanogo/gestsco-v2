"""
Script pour créer la table annee_scolaire
"""

from app.core.database import engine, Base
from app.models.annee_scolaire import AnneeScolaire

def create_table():
    """Crée la table annee_scolaire si elle n'existe pas."""
    AnneeScolaire.__table__.create(engine, checkfirst=True)
    print("Table annee_scolaire créée avec succès!")

if __name__ == "__main__":
    create_table()
