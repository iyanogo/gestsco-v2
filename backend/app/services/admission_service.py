"""
Service pour la gestion des admissions
"""

from datetime import datetime, date
from sqlalchemy.orm import Session

from app.models.etudiant import Etudiant
from app.models.dossier_candidature import DossierCandidature
from app.models.inscrit import Inscrit
from app.repositories.dossier_candidature_repository import dossier_candidature_repository
from app.repositories.annee_academique_repository import annee_academique_repository


def generate_matricule(db: Session, annee_code: str) -> str:
    """
    Génère un matricule unique pour un étudiant.
    Format: {ANNEE}{NUMERO_SEQUENTIEL:05d}
    Exemple: 202500001
    """
    # Extraire l'année de début du code (ex: 2025 de 2024-2025)
    year = annee_code.split("-")[1] if "-" in annee_code else annee_code[:4]
    
    # Compter les étudiants existants avec ce préfixe
    prefix = year
    count = db.query(Etudiant).filter(
        Etudiant.matricule.like(f"{prefix}%")
    ).count()
    
    # Générer le matricule
    numero_seq = count + 1
    matricule = f"{prefix}{numero_seq:05d}"
    
    # Vérifier l'unicité
    while db.query(Etudiant).filter(Etudiant.matricule == matricule).first():
        numero_seq += 1
        matricule = f"{prefix}{numero_seq:05d}"
    
    return matricule


def create_etudiant_from_dossier(db: Session, dossier_id: int) -> Etudiant:
    """
    Crée un étudiant à partir d'un dossier de candidature admis.
    
    Args:
        db: Session de base de données
        dossier_id: ID du dossier de candidature
        
    Returns:
        L'étudiant créé
        
    Raises:
        ValueError: Si le dossier n'est pas admis ou n'existe pas
    """
    # Récupérer le dossier avec ses détails
    dossier = dossier_candidature_repository.get_with_details(db, dossier_id)
    if not dossier:
        raise ValueError("Dossier non trouvé")
    
    if dossier.statut_dossier != "admis":
        raise ValueError("Le dossier n'est pas admis")
    
    if dossier.etudiant_id:
        # L'étudiant existe déjà
        return db.query(Etudiant).filter(Etudiant.id == dossier.etudiant_id).first()
    
    # Récupérer l'année académique active
    annee_active = annee_academique_repository.get_active(db)
    annee_code = annee_active.code if annee_active else str(datetime.now().year)
    
    # Générer le matricule
    matricule = generate_matricule(db, annee_code)
    
    # Créer l'étudiant
    etudiant = Etudiant(
        matricule=matricule,
        nom=dossier.candidat_nom,
        prenom=dossier.candidat_prenom,
        email=dossier.candidat_email,
        telephone=dossier.candidat_telephone,
        date_naissance=str(dossier.candidat_date_naissance) if dossier.candidat_date_naissance else None,
        lieu_naissance=dossier.candidat_lieu_naissance,
        sexe=dossier.candidat_sexe,
        nationalite=dossier.candidat_nationalite,
        adresse=dossier.candidat_adresse,
        statut="actif",
        is_active=True,
        created_date=datetime.utcnow()
    )
    
    db.add(etudiant)
    db.flush()  # Pour obtenir l'ID de l'étudiant
    
    # Créer l'inscription dans la table inscrit
    inscrit = Inscrit(
        etudiant_id=etudiant.id,
        filiere_id=dossier.filiere_admise,
        annee_academique=annee_code,
        date_inscription=date.today(),
        type_inscription="nouvelle",
        statut_inscription="validee",
        is_active=True,
        created_date=datetime.utcnow()
    )
    
    db.add(inscrit)
    
    # Lier le dossier à l'étudiant créé
    dossier.etudiant_id = etudiant.id
    
    db.commit()
    db.refresh(etudiant)
    
    return etudiant
