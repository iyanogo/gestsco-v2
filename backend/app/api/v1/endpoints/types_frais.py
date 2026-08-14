"""
Endpoints API pour la gestion des types de frais
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.core.permissions import get_current_superuser
from app.models.user import User
from app.repositories.type_frais_repository import type_frais_repository
from app.schemas.type_frais import (
    TypeFrais,
    TypeFraisCreate,
    TypeFraisUpdate,
)

router = APIRouter()


@router.get("/", response_model=list[TypeFrais])
def get_types_frais(
    skip: int = 0,
    limit: int = 100,
    categorie: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Liste tous les types de frais.
    
    - **skip**: Nombre d'éléments à ignorer
    - **limit**: Nombre maximum d'éléments à retourner
    - **categorie**: Filtrer par catégorie (optionnel)
    """
    if categorie:
        return type_frais_repository.get_by_categorie(db, categorie)
    return type_frais_repository.get_all(db, skip=skip, limit=limit)


@router.get("/obligatoires", response_model=list[TypeFrais])
def get_types_frais_obligatoires(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Liste les types de frais obligatoires.
    """
    return type_frais_repository.get_obligatoires(db)


@router.get("/recurrents", response_model=list[TypeFrais])
def get_types_frais_recurrents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Liste les types de frais récurrents.
    """
    return type_frais_repository.get_recurrents(db)


@router.get("/{type_frais_id}", response_model=TypeFrais)
def get_type_frais(
    type_frais_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère un type de frais par son ID.
    """
    type_frais = type_frais_repository.get_by_id(db, type_frais_id)
    if not type_frais:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Type de frais non trouvé"
        )
    return type_frais


@router.post("/", response_model=TypeFrais, status_code=status.HTTP_201_CREATED)
def create_type_frais(
    type_frais_in: TypeFraisCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """
    Crée un nouveau type de frais.
    
    Réservé aux superutilisateurs.
    """
    # Vérifier si le code existe déjà
    existing = type_frais_repository.get_by_code(db, type_frais_in.code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un type de frais avec ce code existe déjà"
        )
    
    return type_frais_repository.create(db, type_frais_in)


@router.put("/{type_frais_id}", response_model=TypeFrais)
def update_type_frais(
    type_frais_id: int,
    type_frais_in: TypeFraisUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """
    Met à jour un type de frais.
    
    Réservé aux superutilisateurs.
    """
    type_frais = type_frais_repository.get_by_id(db, type_frais_id)
    if not type_frais:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Type de frais non trouvé"
        )
    
    # Vérifier l'unicité du code si modifié
    if type_frais_in.code and type_frais_in.code != type_frais.code:
        existing = type_frais_repository.get_by_code(db, type_frais_in.code)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un type de frais avec ce code existe déjà"
            )
    
    return type_frais_repository.update(db, type_frais_id, type_frais_in)


@router.delete("/{type_frais_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_type_frais(
    type_frais_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """
    Supprime un type de frais (désactivation logique).
    
    Réservé aux superutilisateurs.
    """
    type_frais = type_frais_repository.get_by_id(db, type_frais_id)
    if not type_frais:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Type de frais non trouvé"
        )
    
    type_frais_repository.delete(db, type_frais_id)
    return None
