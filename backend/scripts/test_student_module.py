"""
Script pour tester le module étudiant
"""

from app.core.database import SessionLocal
from app.models import Etudiant, DocumentEtudiant, Inscription, InscriptionMatiere
from app.schemas import EtudiantSchema, EtudiantCreate, DocumentEtudiantSchema, InscriptionSchema
from app.utils import generate_matricule

def test_models_and_schemas():
    db = SessionLocal()
    try:
        # Test 1: Vérifier les étudiants existants
        print("=== Test 1: Étudiants existants ===")
        etudiants = db.query(Etudiant).limit(5).all()
        print(f"Nombre d'étudiants trouvés: {len(etudiants)}")
        for e in etudiants:
            print(f"  - {e.matricule}: {e.get_full_name()}")
        
        # Test 2: Générer un matricule
        print("\n=== Test 2: Génération de matricule ===")
        new_matricule = generate_matricule(db)
        print(f"Nouveau matricule généré: {new_matricule}")
        
        # Test 3: Tester le schéma Pydantic
        print("\n=== Test 3: Schéma Pydantic ===")
        if etudiants:
            etudiant_schema = EtudiantSchema.model_validate(etudiants[0])
            print(f"Schéma validé: {etudiant_schema.nom} {etudiant_schema.prenom}")
        
        # Test 4: Vérifier les relations
        print("\n=== Test 4: Relations ===")
        if etudiants:
            etudiant = etudiants[0]
            print(f"Documents de {etudiant.get_full_name()}: {len(etudiant.documents)}")
            print(f"Inscriptions de {etudiant.get_full_name()}: {len(etudiant.inscriptions)}")
        
        print("\n=== Tous les tests passés avec succès! ===")
        
    except Exception as e:
        print(f"Erreur: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_models_and_schemas()
