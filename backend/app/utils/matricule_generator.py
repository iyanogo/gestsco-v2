"""
Utilitaire pour la génération de matricules étudiants
"""

import threading
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.etudiant import Etudiant

# Lock pour garantir la thread-safety
_matricule_lock = threading.Lock()


def generate_matricule(db: Session, annee: Optional[int] = None) -> str:
    """
    Génère un matricule unique pour un étudiant.
    
    Format: ETU-YYYY-XXXXX
    - ETU: Préfixe fixe
    - YYYY: Année (année en cours si non fournie)
    - XXXXX: Numéro séquentiel sur 5 chiffres
    
    Args:
        db: Session de base de données
        annee: Année à utiliser (optionnel, utilise l'année courante par défaut)
    
    Returns:
        str: Matricule généré (ex: ETU-2025-00001)
    
    Raises:
        ValueError: Si impossible de générer un matricule unique après plusieurs tentatives
    """
    if annee is None:
        annee = datetime.now().year
    
    prefix = f"ETU-{annee}-"
    
    with _matricule_lock:
        # Trouver le dernier numéro séquentiel pour cette année
        last_matricule = (
            db.query(Etudiant.matricule)
            .filter(Etudiant.matricule.like(f"{prefix}%"))
            .order_by(Etudiant.matricule.desc())
            .first()
        )
        
        if last_matricule and last_matricule[0]:
            try:
                # Extraire le numéro séquentiel du dernier matricule
                last_num = int(last_matricule[0].split("-")[-1])
                next_num = last_num + 1
            except (ValueError, IndexError):
                next_num = 1
        else:
            next_num = 1
        
        # Générer le nouveau matricule
        new_matricule = f"{prefix}{next_num:05d}"
        
        # Vérifier l'unicité (au cas où)
        max_attempts = 100
        attempts = 0
        while attempts < max_attempts:
            exists = db.query(Etudiant).filter(Etudiant.matricule == new_matricule).first()
            if not exists:
                return new_matricule
            next_num += 1
            new_matricule = f"{prefix}{next_num:05d}"
            attempts += 1
        
        raise ValueError(f"Impossible de générer un matricule unique après {max_attempts} tentatives")


def generate_numero_carte(db: Session, annee: Optional[int] = None) -> str:
    """
    Génère un numéro de carte étudiant unique.
    
    Format: CARD-YYYY-XXXXX
    
    Args:
        db: Session de base de données
        annee: Année à utiliser (optionnel)
    
    Returns:
        str: Numéro de carte généré
    """
    if annee is None:
        annee = datetime.now().year
    
    prefix = f"CARD-{annee}-"
    
    with _matricule_lock:
        last_card = (
            db.query(Etudiant.numero_carte)
            .filter(Etudiant.numero_carte.like(f"{prefix}%"))
            .order_by(Etudiant.numero_carte.desc())
            .first()
        )
        
        if last_card and last_card[0]:
            try:
                last_num = int(last_card[0].split("-")[-1])
                next_num = last_num + 1
            except (ValueError, IndexError):
                next_num = 1
        else:
            next_num = 1
        
        return f"{prefix}{next_num:05d}"
