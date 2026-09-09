"""
Endpoints pour l'inscription par groupe via fichier Excel
"""

from typing import Optional
from datetime import datetime, date
import io

from fastapi import APIRouter, Depends, HTTPException, Request, status, UploadFile, File, Form
from sqlalchemy.orm import Session
import pandas as pd

from app.api.deps import get_db, get_current_active_user
from app.utils.rbac_resolver import require_permission
from app.models.user import User
from app.models.etudiant import Etudiant
from app.models.inscription import Inscription
from app.models.filiere import Filiere
from app.models.niveau import Niveau
from app.utils.matricule_generator import generate_matricule
from app.utils.administration_events import audit_and_commit

router = APIRouter(prefix="/inscription-groupe", tags=["Inscription Groupe"])


# Colonnes attendues dans le fichier Excel
EXPECTED_COLUMNS = [
    'Matricule',
    'Nom', 
    'Prenom',
    'Sexe',
    'Telephone',
    'Date de naissance',
    'Lieu de naissance',
    'Nationalite'
]


def parse_date(date_str: str) -> Optional[date]:
    """Parse une date depuis une chaine de caracteres."""
    if pd.isna(date_str) or not date_str:
        return None
    
    # Essayer differents formats
    formats = ['%d/%m/%Y', '%Y-%m-%d', '%d-%m-%Y', '%d.%m.%Y']
    for fmt in formats:
        try:
            return datetime.strptime(str(date_str).strip(), fmt).date()
        except ValueError:
            continue
    return None


def parse_sexe(sexe_str: str) -> str:
    """Normalise le sexe."""
    if not sexe_str:
        return 'M'
    sexe = str(sexe_str).strip().upper()
    if sexe in ['F', 'FEMININ', 'FEMININE', 'FEMALE']:
        return 'F'
    return 'M'


@router.post("/upload")
async def upload_inscriptions_groupe(
    http_request: Request,
    file: UploadFile = File(...),
    filiere_id: int = Form(...),
    niveau_id: int = Form(...),
    annee_academique: str = Form(...),
    type_inscription: str = Form(default="nouvelle"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inscriptions", "create")),
):
    """
    Importe des inscriptions depuis un fichier Excel.
    
    Le fichier doit contenir les colonnes:
    - Matricule (optionnel, genere automatiquement si vide)
    - Nom
    - Prenom
    - Sexe (Masculin/Feminin ou M/F)
    - Telephone
    - Date de naissance (format JJ/MM/AAAA)
    - Lieu de naissance
    - Nationalite
    
    Requiert les droits scolarite ou admin.
    """
    # Verifier le type de fichier
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le fichier doit etre au format Excel (.xlsx ou .xls)"
        )
    
    # Verifier que la filiere et le niveau existent
    filiere = db.query(Filiere).filter(Filiere.id == filiere_id).first()
    if not filiere:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Filiere non trouvee"
        )
    
    niveau = db.query(Niveau).filter(Niveau.id == niveau_id).first()
    if not niveau:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Niveau non trouve"
        )
    
    try:
        # Lire le fichier Excel
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        
        # Normaliser les noms de colonnes
        df.columns = df.columns.str.strip()
        
        # Verifier les colonnes requises (au moins Nom et Prenom)
        required_cols = ['Nom', 'Prenom']
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Colonnes manquantes: {', '.join(missing_cols)}"
            )
        
        results = {
            "total": len(df),
            "success": 0,
            "errors": [],
            "created_students": []
        }
        
        for index, row in df.iterrows():
            line_num = index + 2  # +2 car index commence a 0 et ligne 1 = entetes
            
            try:
                nom = str(row.get('Nom', '')).strip().upper()
                prenom = str(row.get('Prenom', '')).strip().title()
                
                if not nom or not prenom or nom == 'NAN' or prenom == 'Nan':
                    results["errors"].append({
                        "line": line_num,
                        "error": "Nom ou prenom manquant"
                    })
                    continue
                
                # Recuperer les autres champs
                matricule_excel = str(row.get('Matricule', '')).strip() if pd.notna(row.get('Matricule')) else None
                sexe = parse_sexe(row.get('Sexe', 'M'))
                telephone = str(row.get('Telephone', '')).strip() if pd.notna(row.get('Telephone')) else None
                date_naissance = parse_date(row.get('Date de naissance'))
                lieu_naissance = str(row.get('Lieu de naissance', '')).strip() if pd.notna(row.get('Lieu de naissance')) else None
                nationalite = str(row.get('Nationalite', '')).strip() if pd.notna(row.get('Nationalite')) else None
                
                # Verifier si l'etudiant existe deja (par matricule ou nom+prenom+date_naissance)
                existing_student = None
                if matricule_excel and matricule_excel != 'nan':
                    existing_student = db.query(Etudiant).filter(
                        Etudiant.matricule == matricule_excel
                    ).first()
                
                if not existing_student and date_naissance:
                    existing_student = db.query(Etudiant).filter(
                        Etudiant.nom == nom,
                        Etudiant.prenom == prenom,
                        Etudiant.date_naissance == date_naissance
                    ).first()
                
                if existing_student:
                    # Verifier si une inscription existe deja pour cette annee
                    existing_inscription = db.query(Inscription).filter(
                        Inscription.etudiant_id == existing_student.id,
                        Inscription.annee_academique == annee_academique,
                        Inscription.niveau_id == niveau_id
                    ).first()
                    
                    if existing_inscription:
                        results["errors"].append({
                            "line": line_num,
                            "error": f"Inscription deja existante pour {nom} {prenom}"
                        })
                        continue
                    
                    etudiant = existing_student
                else:
                    # Creer un nouvel etudiant
                    matricule = matricule_excel if matricule_excel and matricule_excel != 'nan' else generate_matricule(db)
                    
                    etudiant = Etudiant(
                        matricule=matricule,
                        nom=nom,
                        prenom=prenom,
                        sexe=sexe,
                        telephone=telephone,
                        date_naissance=date_naissance,
                        lieu_naissance=lieu_naissance,
                        nationalite=nationalite,
                        statut='actif',
                        is_active=True
                    )
                    db.add(etudiant)
                    db.flush()  # Pour obtenir l'ID
                
                # Creer l'inscription
                inscription = Inscription(
                    etudiant_id=etudiant.id,
                    filiere_id=filiere_id,
                    niveau_id=niveau_id,
                    annee_academique=annee_academique,
                    date_inscription=date.today(),
                    type_inscription=type_inscription,
                    statut_inscription='inscrit',
                    is_active=True
                )
                db.add(inscription)
                
                results["success"] += 1
                results["created_students"].append({
                    "matricule": etudiant.matricule,
                    "nom": nom,
                    "prenom": prenom
                })
                
            except Exception as e:
                results["errors"].append({
                    "line": line_num,
                    "error": str(e)
                })
        
        if results["success"] > 0:
            audit_and_commit(
                db,
                request=http_request,
                user=current_user,
                action="create",
                entity_type="inscription_groupe",
                entity_id=f"{filiere_id}-{niveau_id}",
                new_values={
                    "filiere_id": filiere_id,
                    "niveau_id": niveau_id,
                    "annee_academique": annee_academique,
                    "success_count": results["success"],
                    "error_count": len(results["errors"]),
                },
                details="import_excel",
            )
        
        return results
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du traitement du fichier: {str(e)}"
        )


@router.get("/template")
async def download_template(
    current_user: User = Depends(get_current_active_user),
):
    """
    Retourne les informations sur le format du fichier Excel attendu.
    """
    return {
        "columns": EXPECTED_COLUMNS,
        "description": "Format du fichier Excel pour l'inscription par groupe",
        "example": {
            "Matricule": "0222-SG2-2022 (optionnel, genere automatiquement si vide)",
            "Nom": "GARANE",
            "Prenom": "Nafissatou",
            "Sexe": "Feminin ou Masculin (ou F/M)",
            "Telephone": "64 26 86 36",
            "Date de naissance": "04/09/2000 (format JJ/MM/AAAA)",
            "Lieu de naissance": "Bobo-Dioulasso",
            "Nationalite": "Burkinabe"
        }
    }
