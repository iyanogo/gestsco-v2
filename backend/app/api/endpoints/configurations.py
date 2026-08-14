from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_active_user
from app.models.user import User
from app.schemas.configuration_etablissement import (
    ConfigurationEtablissementCreate,
    ConfigurationEtablissementUpdate,
    ConfigurationEtablissementResponse,
    ConfigurationCouleursUpdate
)
from app.repositories.configuration_etablissement_repository import configuration_etablissement_repository
from app.services.parametre_service import get_configuration_complete

router = APIRouter()


@router.get("/", response_model=List[ConfigurationEtablissementResponse])
def get_all_configurations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère toutes les configurations d'établissement"""
    return configuration_etablissement_repository.get_all(db)


@router.get("/etablissement/{etablissement_id}", response_model=ConfigurationEtablissementResponse)
def get_configuration_by_etablissement(
    etablissement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère la configuration d'un établissement"""
    config = configuration_etablissement_repository.get_active(db, etablissement_id)
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration non trouvée pour cet établissement"
        )
    return config


@router.get("/etablissement/{etablissement_id}/complete")
def get_configuration_complete_etablissement(
    etablissement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère la configuration complète (paramètres système + établissement)"""
    return get_configuration_complete(db, etablissement_id)


@router.get("/{config_id}", response_model=ConfigurationEtablissementResponse)
def get_configuration_by_id(
    config_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère une configuration par son ID"""
    config = configuration_etablissement_repository.get_by_id(db, config_id)
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration non trouvée"
        )
    return config


@router.post("/", response_model=ConfigurationEtablissementResponse, status_code=status.HTTP_201_CREATED)
def create_configuration(
    config_in: ConfigurationEtablissementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Crée une nouvelle configuration d'établissement"""
    existing = configuration_etablissement_repository.get_by_etablissement(db, config_in.etablissement_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Une configuration existe déjà pour cet établissement"
        )
    
    return configuration_etablissement_repository.create(db, config_in)


@router.put("/{config_id}", response_model=ConfigurationEtablissementResponse)
def update_configuration(
    config_id: int,
    config_in: ConfigurationEtablissementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Met à jour une configuration d'établissement"""
    config = configuration_etablissement_repository.get_by_id(db, config_id)
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration non trouvée"
        )
    
    return configuration_etablissement_repository.update(db, config, config_in)


@router.patch("/{config_id}/couleurs")
def update_couleurs(
    config_id: int,
    couleurs: ConfigurationCouleursUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Met à jour les couleurs de l'établissement"""
    config = configuration_etablissement_repository.update_couleurs(
        db, config_id, couleurs.couleur_primaire, couleurs.couleur_secondaire
    )
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration non trouvée"
        )
    return {"message": "Couleurs mises à jour", "couleur_primaire": config.couleur_primaire, "couleur_secondaire": config.couleur_secondaire}


@router.patch("/{config_id}/logo")
async def update_logo(
    config_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Met à jour le logo de l'établissement"""
    # Vérifier le type de fichier
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le fichier doit être une image"
        )
    
    # Sauvegarder le fichier (à adapter selon votre système de stockage)
    import os
    upload_dir = "uploads/logos"
    os.makedirs(upload_dir, exist_ok=True)
    
    filename = f"logo_{config_id}_{file.filename}"
    file_path = os.path.join(upload_dir, filename)
    
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    logo_url = f"/uploads/logos/{filename}"
    config = configuration_etablissement_repository.update_logo(db, config_id, logo_url)
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration non trouvée"
        )
    
    return {"message": "Logo mis à jour", "logo_url": logo_url}


@router.delete("/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_configuration(
    config_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Supprime une configuration d'établissement"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les super-utilisateurs peuvent supprimer des configurations"
        )
    
    if not configuration_etablissement_repository.delete(db, config_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration non trouvée"
        )
