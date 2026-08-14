"""
Endpoints pour la gestion des modules système.
Activation/désactivation des modules par université et année académique.
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.module_systeme import ModuleSysteme
from app.services.module_service import ModuleService, ModuleServiceError

router = APIRouter()


# Schémas Pydantic

class ModuleSystemeResponse(BaseModel):
    """Réponse pour un module système."""
    id: int
    code: str
    libelle: str
    description: Optional[str]
    icone: Optional[str]
    ordre: int
    est_obligatoire: bool
    dependances: Optional[List[str]]
    is_active: bool

    class Config:
        from_attributes = True


class ActiverModuleRequest(BaseModel):
    """Requête pour activer un module."""
    universite_id: Optional[int] = None
    annee_id: Optional[int] = None
    configuration: Optional[dict] = None


class DesactiverModuleRequest(BaseModel):
    """Requête pour désactiver un module."""
    universite_id: Optional[int] = None
    annee_id: Optional[int] = None


# Endpoints

@router.get("/", response_model=List[ModuleSystemeResponse], summary="Liste des modules système")
async def list_modules_systeme(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère la liste de tous les modules système.
    
    Retourne tous les modules disponibles avec leurs informations.
    """
    service = ModuleService(db)
    modules = service.get_tous_modules()
    return modules


@router.post("/{code}/activer", summary="Activer un module")
async def activer_module(
    code: str,
    request: ActiverModuleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Active un module pour une université et/ou année académique.
    
    - Vérifie les dépendances
    - Crée ou met à jour l'activation
    
    **Permissions requises**: Admin
    """
    if not hasattr(current_user, 'role') or current_user.role not in ['admin', 'superadmin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les administrateurs peuvent activer des modules"
        )
    
    service = ModuleService(db)
    
    try:
        module_actif = service.activer_module(
            module_code=code,
            universite_id=request.universite_id,
            annee_id=request.annee_id,
            user_id=current_user.id,
            config=request.configuration
        )
        
        return {
            "message": f"Module {code} activé avec succès",
            "module_actif": {
                "id": module_actif.id,
                "module_id": module_actif.module_id,
                "universite_id": module_actif.universite_id,
                "annee_academique_id": module_actif.annee_academique_id,
                "est_actif": module_actif.est_actif,
                "date_activation": module_actif.date_activation
            }
        }
    except ModuleServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{code}/desactiver", summary="Désactiver un module")
async def desactiver_module(
    code: str,
    request: DesactiverModuleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Désactive un module.
    
    - Vérifie que le module n'est pas obligatoire
    - Vérifie qu'aucun module actif n'en dépend
    
    **Permissions requises**: Admin
    """
    if not hasattr(current_user, 'role') or current_user.role not in ['admin', 'superadmin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les administrateurs peuvent désactiver des modules"
        )
    
    service = ModuleService(db)
    
    try:
        module_actif = service.desactiver_module(
            module_code=code,
            universite_id=request.universite_id,
            annee_id=request.annee_id,
            user_id=current_user.id
        )
        
        return {
            "message": f"Module {code} désactivé avec succès",
            "module_actif": {
                "id": module_actif.id,
                "est_actif": module_actif.est_actif,
                "date_desactivation": module_actif.date_desactivation
            }
        }
    except ModuleServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/actifs", response_model=List[ModuleSystemeResponse], summary="Modules actifs")
async def get_modules_actifs(
    universite_id: Optional[int] = Query(None, description="ID de l'université"),
    annee_id: Optional[int] = Query(None, description="ID de l'année académique"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère la liste des modules actifs pour un contexte donné.
    
    Filtre par université et/ou année académique.
    """
    service = ModuleService(db)
    modules = service.get_modules_actifs(universite_id, annee_id)
    return modules


@router.get("/{code}/verifier-acces", summary="Vérifier l'accès à un module")
async def verifier_acces_module(
    code: str,
    universite_id: Optional[int] = Query(None),
    annee_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Vérifie si l'utilisateur courant a accès à un module.
    
    Vérifie :
    - Que le module est actif pour le contexte
    - Que l'utilisateur a les permissions requises
    """
    service = ModuleService(db)
    
    a_acces = service.verifier_acces_module(
        module_code=code,
        user=current_user,
        universite_id=universite_id,
        annee_id=annee_id
    )
    
    return {
        "module": code,
        "a_acces": a_acces,
        "universite_id": universite_id,
        "annee_id": annee_id
    }


@router.get("/{code}", response_model=ModuleSystemeResponse, summary="Détails d'un module")
async def get_module_systeme(
    code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère les détails d'un module système par son code.
    """
    module = db.query(ModuleSysteme).filter(
        ModuleSysteme.code == code,
        ModuleSysteme.is_active == True
    ).first()
    
    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Module {code} non trouvé"
        )
    
    return module
