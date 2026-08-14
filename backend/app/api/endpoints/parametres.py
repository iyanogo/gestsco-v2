from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_active_user
from app.models.user import User
from app.schemas.parametre_systeme import (
    ParametreSystemeCreate,
    ParametreSystemeUpdate,
    ParametreSystemeResponse,
    ParametreSystemeUpdateValeur
)
from app.repositories.parametre_repository import parametre_repository
from app.services.parametre_service import (
    get_parametre,
    set_parametre,
    get_parametres_par_categorie,
    initialiser_parametres_defaut
)

router = APIRouter()


@router.get("/", response_model=List[ParametreSystemeResponse])
def get_all_parametres(
    categorie: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère tous les paramètres système"""
    if categorie:
        return parametre_repository.get_by_categorie(db, categorie)
    return parametre_repository.get_all(db)


@router.get("/par-categorie")
def get_parametres_groupes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère les paramètres groupés par catégorie"""
    return get_parametres_par_categorie(db)


@router.get("/valeur/{cle}")
def get_parametre_valeur(
    cle: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère la valeur d'un paramètre par sa clé"""
    valeur = get_parametre(db, cle)
    if valeur is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Paramètre '{cle}' non trouvé"
        )
    return {"cle": cle, "valeur": valeur}


@router.get("/{parametre_id}", response_model=ParametreSystemeResponse)
def get_parametre_by_id(
    parametre_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère un paramètre par son ID"""
    parametre = parametre_repository.get_by_id(db, parametre_id)
    if not parametre:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paramètre non trouvé"
        )
    return parametre


@router.post("/", response_model=ParametreSystemeResponse, status_code=status.HTTP_201_CREATED)
def create_parametre(
    parametre_in: ParametreSystemeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Crée un nouveau paramètre système"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les super-utilisateurs peuvent créer des paramètres"
        )
    
    existing = parametre_repository.get_by_cle(db, parametre_in.cle)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Un paramètre avec la clé '{parametre_in.cle}' existe déjà"
        )
    
    return parametre_repository.create(db, parametre_in)


@router.put("/{parametre_id}", response_model=ParametreSystemeResponse)
def update_parametre(
    parametre_id: int,
    parametre_in: ParametreSystemeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Met à jour un paramètre système"""
    parametre = parametre_repository.get_by_id(db, parametre_id)
    if not parametre:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paramètre non trouvé"
        )
    
    if not parametre.est_modifiable and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ce paramètre n'est pas modifiable"
        )
    
    return parametre_repository.update(db, parametre, parametre_in)


@router.patch("/valeur/{cle}")
def update_parametre_valeur(
    cle: str,
    data: ParametreSystemeUpdateValeur,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Met à jour uniquement la valeur d'un paramètre"""
    success = set_parametre(db, cle, data.valeur, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible de mettre à jour le paramètre"
        )
    return {"message": "Paramètre mis à jour", "cle": cle, "valeur": data.valeur}


@router.delete("/{parametre_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_parametre(
    parametre_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Supprime un paramètre système"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les super-utilisateurs peuvent supprimer des paramètres"
        )
    
    if not parametre_repository.delete(db, parametre_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paramètre non trouvé"
        )


@router.post("/initialiser")
def initialiser_parametres(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Initialise les paramètres par défaut"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les super-utilisateurs peuvent initialiser les paramètres"
        )
    
    result = initialiser_parametres_defaut(db)
    return {"message": "Paramètres initialisés", **result}
