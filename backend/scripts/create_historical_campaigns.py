"""
Script pour créer des campagnes d'inscription historiques
basées sur les inscriptions existantes dans la table inscriptions.

Ce script:
1. Récupère toutes les années académiques distinctes des inscriptions existantes
2. Crée une campagne d'inscription pour chaque année académique
3. Lie les inscriptions existantes à leur campagne respective (optionnel)

Usage:
    python -m scripts.create_historical_campaigns
"""

import sys
import os
from datetime import date, datetime

# Ajouter le répertoire parent au path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, engine
from app.models.campagne_inscription import CampagneInscription
from app.models.annee_academique import AnneeAcademique
from app.models.inscription import Inscription


def get_distinct_annees_from_inscriptions(db: Session) -> list[str]:
    """Récupère les années académiques distinctes des inscriptions (via enseignement -> annee)."""
    result = db.execute(
        text("""
            SELECT DISTINCT a.code 
            FROM inscrit i
            JOIN enseignement e ON i.enseignement_id = e.id
            JOIN annee a ON e.annee_id = a.id
            ORDER BY a.code
        """)
    )
    return [row[0] for row in result.fetchall()]


def get_or_create_annee_academique(db: Session, code: str) -> AnneeAcademique:
    """Récupère ou crée une année académique."""
    annee = db.query(AnneeAcademique).filter(AnneeAcademique.code == code).first()
    if annee:
        return annee
    
    # Créer l'année académique
    # Format attendu: 2023-2024
    parts = code.split('-')
    if len(parts) == 2:
        annee_debut = int(parts[0])
        annee_fin = int(parts[1])
    else:
        # Fallback si format différent
        annee_debut = int(code[:4]) if code[:4].isdigit() else 2020
        annee_fin = annee_debut + 1
    
    annee = AnneeAcademique(
        code=code,
        libelle=f"Année académique {code}",
        date_debut=date(annee_debut, 9, 1),       # 1er septembre
        date_fin=date(annee_fin, 7, 31),          # 31 juillet
        date_debut_inscriptions=date(annee_debut, 6, 1),  # 1er juin
        date_fin_inscriptions=date(annee_debut, 9, 30),   # 30 septembre
        is_active=True,
        is_current=False
    )
    db.add(annee)
    db.commit()
    db.refresh(annee)
    print(f"  [OK] Annee academique creee: {code}")
    return annee


def get_default_cycle(db: Session) -> int:
    """Récupère le premier cycle disponible."""
    from app.models.cycle import Cycle
    
    cycle = db.query(Cycle).first()
    if cycle:
        return cycle.id
    
    # Erreur si aucun cycle n'existe
    raise Exception("Aucun cycle trouve dans la base de donnees. Veuillez en creer un d'abord.")


def create_campaign_for_year(db: Session, annee_code: str, cycle_id: int = None) -> CampagneInscription:
    """Crée une campagne d'inscription pour une année académique."""
    
    # Récupérer ou créer l'année académique d'abord
    annee = get_or_create_annee_academique(db, annee_code)
    
    # Vérifier si une campagne existe déjà pour cette année
    existing = db.query(CampagneInscription).filter(
        CampagneInscription.annee_academique_id == annee.id
    ).first()
    
    if existing:
        print(f"  → Campagne existante pour {annee_code}: {existing.libelle}")
        return existing
    
    # Récupérer un cycle par défaut si non fourni
    if cycle_id is None:
        cycle_id = get_default_cycle(db)
    
    # Déterminer les dates de la campagne
    parts = annee_code.split('-')
    if len(parts) == 2:
        annee_debut = int(parts[0])
    else:
        annee_debut = int(annee_code[:4]) if annee_code[:4].isdigit() else 2020
    
    # Campagne du 1er juin au 30 septembre de l'année de début
    date_ouverture = datetime(annee_debut, 6, 1)
    date_cloture = datetime(annee_debut, 9, 30)
    
    # Générer un code unique
    code = f"CAMP-{annee_code.replace('-', '')}"
    
    # Créer la campagne
    campagne = CampagneInscription(
        code=code,
        libelle=f"Inscriptions {annee_code}",
        description=f"Campagne d'inscription pour l'année académique {annee_code} (générée automatiquement)",
        annee_academique_id=annee.id,
        cycle_id=cycle_id,
        date_ouverture=date_ouverture,
        date_cloture=date_cloture,
        date_limite_paiement=date_cloture,
        frais_inscription=50000,  # Valeur par défaut
        frais_dossier=5000,       # Valeur par défaut
        nombre_places=None,       # Illimité
        statut='fermee',          # Campagne historique fermée
        is_active=True
    )
    
    db.add(campagne)
    db.commit()
    db.refresh(campagne)
    print(f"  [OK] Campagne creee: {campagne.libelle} (code: {code})")
    return campagne


def count_inscriptions_by_year(db: Session) -> dict:
    """Compte les inscriptions par année académique (via enseignement -> annee)."""
    result = db.execute(
        text("""
            SELECT a.code, COUNT(*) as count 
            FROM inscrit i
            JOIN enseignement e ON i.enseignement_id = e.id
            JOIN annee a ON e.annee_id = a.id
            GROUP BY a.code 
            ORDER BY a.code
        """)
    )
    return {row[0]: row[1] for row in result.fetchall()}


def main():
    """Point d'entrée principal."""
    print("=" * 60)
    print("Création des campagnes d'inscription historiques")
    print("=" * 60)
    
    db = SessionLocal()
    
    try:
        # 1. Récupérer les années académiques des inscriptions
        print("\n1. Récupération des années académiques existantes...")
        annees = get_distinct_annees_from_inscriptions(db)
        
        if not annees:
            print("   Aucune inscription trouvée dans la base de données.")
            return
        
        print(f"   {len(annees)} année(s) académique(s) trouvée(s): {', '.join(annees)}")
        
        # 2. Compter les inscriptions par année
        print("\n2. Statistiques des inscriptions par année:")
        counts = count_inscriptions_by_year(db)
        for annee, count in counts.items():
            print(f"   - {annee}: {count} inscription(s)")
        
        # 3. Créer les campagnes
        print("\n3. Création des campagnes d'inscription...")
        campagnes_created = 0
        
        for annee_code in annees:
            campagne = create_campaign_for_year(db, annee_code)
            if campagne:
                campagnes_created += 1
        
        print(f"\n   Total: {campagnes_created} campagne(s) traitée(s)")
        
        # 4. Résumé
        print("\n" + "=" * 60)
        print("Résumé:")
        print(f"  - Années académiques traitées: {len(annees)}")
        print(f"  - Campagnes créées/existantes: {campagnes_created}")
        print("=" * 60)
        
    except Exception as e:
        print(f"\nErreur: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
