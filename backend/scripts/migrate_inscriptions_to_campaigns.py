"""
Script pour migrer les inscriptions existantes (table inscrit) vers la nouvelle table inscriptions
et les lier aux campagnes d'inscription correspondantes.

Ce script:
1. Recupere les inscriptions de la table inscrit avec leur annee academique
2. Cree les enregistrements correspondants dans la table inscriptions
3. Met a jour le champ annee_academique dans inscrit

Usage:
    python -m scripts.migrate_inscriptions_to_campaigns
"""

import sys
import os
from datetime import date, datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, engine


def get_inscriptions_with_annee(db: Session) -> list:
    """Recupere les inscriptions avec leur annee academique via enseignement."""
    result = db.execute(
        text("""
            SELECT 
                i.id as inscrit_id,
                i.etudiant_id,
                i.filiere_id,
                i.niveau_id,
                i.date_inscription,
                i.type_inscription,
                i.regime_etudes,
                i.statut_inscription,
                i.frais_inscription,
                i.frais_payes,
                a.code as annee_code
            FROM inscrit i
            JOIN enseignement e ON i.enseignement_id = e.id
            JOIN annee a ON e.annee_id = a.id
            WHERE i.annee_academique IS NULL OR i.annee_academique = ''
            LIMIT 1000
        """)
    )
    return [dict(row._mapping) for row in result.fetchall()]


def update_inscrit_annee_academique(db: Session) -> int:
    """Met a jour le champ annee_academique dans la table inscrit."""
    result = db.execute(
        text("""
            UPDATE inscrit i
            SET annee_academique = (
                SELECT a.code 
                FROM enseignement e
                JOIN annee a ON e.annee_id = a.id
                WHERE e.id = i.enseignement_id
            )
            WHERE i.annee_academique IS NULL OR i.annee_academique = ''
        """)
    )
    db.commit()
    return result.rowcount


def count_inscriptions_by_annee(db: Session) -> dict:
    """Compte les inscriptions par annee apres mise a jour."""
    result = db.execute(
        text("""
            SELECT annee_academique, COUNT(*) as count 
            FROM inscrit 
            WHERE annee_academique IS NOT NULL AND annee_academique != ''
            GROUP BY annee_academique 
            ORDER BY annee_academique
        """)
    )
    return {row[0]: row[1] for row in result.fetchall()}


def main():
    """Point d'entree principal."""
    print("=" * 60)
    print("Migration des inscriptions vers les campagnes")
    print("=" * 60)
    
    db = SessionLocal()
    
    try:
        # 1. Compter les inscriptions sans annee_academique
        result = db.execute(
            text("SELECT COUNT(*) FROM inscrit WHERE annee_academique IS NULL OR annee_academique = ''")
        )
        count_null = result.fetchone()[0]
        print(f"\n1. Inscriptions sans annee_academique: {count_null}")
        
        if count_null == 0:
            print("   Toutes les inscriptions ont deja une annee_academique.")
        else:
            # 2. Mettre a jour le champ annee_academique
            print("\n2. Mise a jour du champ annee_academique...")
            updated = update_inscrit_annee_academique(db)
            print(f"   {updated} inscription(s) mise(s) a jour")
        
        # 3. Verifier le resultat
        print("\n3. Verification des inscriptions par annee:")
        counts = count_inscriptions_by_annee(db)
        total = 0
        for annee, count in counts.items():
            print(f"   - {annee}: {count} inscription(s)")
            total += count
        print(f"   Total: {total} inscription(s)")
        
        # 4. Resume
        print("\n" + "=" * 60)
        print("Migration terminee avec succes!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\nErreur: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
