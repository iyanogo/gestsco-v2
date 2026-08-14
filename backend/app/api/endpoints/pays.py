from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_active_user
from app.models.user import User
from app.schemas.pays_configuration import (
    PaysConfigurationCreate,
    PaysConfigurationUpdate,
    PaysConfigurationResponse
)
from app.repositories.pays_configuration_repository import pays_configuration_repository
from app.scripts.init_pays import init_pays

router = APIRouter()


@router.get("/", response_model=List[PaysConfigurationResponse])
def get_all_pays(
    continent: Optional[str] = None,
    region: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère toutes les configurations de pays"""
    if continent:
        return pays_configuration_repository.get_by_continent(db, continent)
    if region:
        return pays_configuration_repository.get_by_region(db, region)
    return pays_configuration_repository.get_all_actifs(db)


@router.get("/continents")
def get_continents(
    current_user: User = Depends(get_current_active_user)
):
    """Récupère la liste des continents disponibles"""
    return [
        {"code": "Afrique", "libelle": "Afrique"},
        {"code": "Europe", "libelle": "Europe"},
        {"code": "Asie", "libelle": "Asie"},
        {"code": "Amérique", "libelle": "Amérique"},
        {"code": "Océanie", "libelle": "Océanie"}
    ]


@router.get("/regions")
def get_regions(
    continent: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    """Récupère la liste des régions disponibles"""
    regions = [
        {"code": "Afrique de l'Ouest", "continent": "Afrique"},
        {"code": "Afrique Centrale", "continent": "Afrique"},
        {"code": "Afrique de l'Est", "continent": "Afrique"},
        {"code": "Afrique du Nord", "continent": "Afrique"},
        {"code": "Afrique Australe", "continent": "Afrique"},
        {"code": "Europe de l'Ouest", "continent": "Europe"},
        {"code": "Europe de l'Est", "continent": "Europe"},
    ]
    if continent:
        return [r for r in regions if r["continent"] == continent]
    return regions


@router.get("/{pays_id}", response_model=PaysConfigurationResponse)
def get_pays_by_id(
    pays_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère une configuration de pays par son ID"""
    pays = pays_configuration_repository.get_by_id(db, pays_id)
    if not pays:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration de pays non trouvée"
        )
    return pays


@router.get("/code/{code_pays}", response_model=PaysConfigurationResponse)
def get_pays_by_code(
    code_pays: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère une configuration de pays par son code ISO"""
    pays = pays_configuration_repository.get_by_code(db, code_pays.upper())
    if not pays:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration de pays non trouvée"
        )
    return pays


@router.post("/", response_model=PaysConfigurationResponse, status_code=status.HTTP_201_CREATED)
def create_pays(
    pays_in: PaysConfigurationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Crée une nouvelle configuration de pays"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les super-utilisateurs peuvent créer des configurations de pays"
        )
    
    existing = pays_configuration_repository.get_by_code(db, pays_in.code_pays.upper())
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Une configuration pour le pays '{pays_in.code_pays}' existe déjà"
        )
    
    return pays_configuration_repository.create(db, pays_in)


@router.put("/{pays_id}", response_model=PaysConfigurationResponse)
def update_pays(
    pays_id: int,
    pays_in: PaysConfigurationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Met à jour une configuration de pays"""
    pays = pays_configuration_repository.get_by_id(db, pays_id)
    if not pays:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration de pays non trouvée"
        )
    
    return pays_configuration_repository.update(db, pays, pays_in)


@router.delete("/{pays_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pays(
    pays_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Supprime une configuration de pays"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les super-utilisateurs peuvent supprimer des configurations de pays"
        )
    
    if not pays_configuration_repository.delete(db, pays_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration de pays non trouvée"
        )


@router.post("/initialiser")
def initialiser_pays(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Initialise les configurations de pays par défaut"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les super-utilisateurs peuvent initialiser les configurations de pays"
        )
    
    count = init_pays(db)
    return {"message": "Configurations de pays initialisées", "pays_crees": count}
