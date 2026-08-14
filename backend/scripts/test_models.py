"""
Script pour tester les modèles
"""

from app.models import Etudiant, DocumentEtudiant, Inscription, InscriptionMatiere
print("Models imported successfully!")
print(f"Etudiant table: {Etudiant.__tablename__}")
print(f"DocumentEtudiant table: {DocumentEtudiant.__tablename__}")
print(f"Inscription table: {Inscription.__tablename__}")
print(f"InscriptionMatiere table: {InscriptionMatiere.__tablename__}")
