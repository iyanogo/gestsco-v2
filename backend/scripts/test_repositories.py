"""
Script pour tester les repositories du module étudiant
"""

import sys
sys.path.insert(0, '.')

from app.core.database import SessionLocal
from app.repositories import (
    etudiant_repository,
    document_etudiant_repository,
    inscription_repository,
    inscription_matiere_repository,
)

db = SessionLocal()

print("=== Test 1: EtudiantRepository ===")
# Test get_all
etudiants = etudiant_repository.get_all(db, limit=5)
print(f"Nombre d'étudiants (limit 5): {len(etudiants)}")

# Test get_statistiques
stats = etudiant_repository.get_statistiques(db)
print(f"Statistiques: {stats}")

# Test search
if etudiants:
    first = etudiants[0]
    print(f"\nPremier étudiant: {first.nom} {first.prenom}")
    
    # Test get_by_id
    found = etudiant_repository.get_by_id(db, first.id)
    print(f"get_by_id({first.id}): {found.nom if found else 'Non trouvé'}")
    
    # Test get_with_details
    with_details = etudiant_repository.get_with_details(db, first.id)
    if with_details:
        print(f"Documents: {len(with_details.documents)}, Inscriptions: {len(with_details.inscriptions)}")

# Test search_advanced
results = etudiant_repository.search_advanced(db, nom="TAPSOBA")
print(f"\nRecherche 'TAPSOBA': {len(results)} résultat(s)")

print("\n=== Test 2: DocumentEtudiantRepository ===")
docs = document_etudiant_repository.get_all(db, limit=5)
print(f"Nombre de documents (limit 5): {len(docs)}")

print("\n=== Test 3: InscriptionRepository ===")
inscriptions = inscription_repository.get_all(db, limit=5)
print(f"Nombre d'inscriptions (limit 5): {len(inscriptions)}")

print("\n=== Test 4: InscriptionMatiereRepository ===")
insc_matieres = inscription_matiere_repository.get_all(db, limit=5)
print(f"Nombre d'inscriptions matières (limit 5): {len(insc_matieres)}")

print("\n=== Tous les tests passés avec succès! ===")

db.close()
