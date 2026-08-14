from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_active_user
from app.models.user import User
from app.schemas.modele_email import (
    ModeleEmailCreate,
    ModeleEmailUpdate,
    ModeleEmailResponse,
    ModeleEmailPreviewRequest,
    ModeleEmailPreviewResponse
)
from app.schemas.modele_sms import (
    ModeleSMSCreate,
    ModeleSMSUpdate,
    ModeleSMSResponse,
    ModeleSMSPreviewRequest,
    ModeleSMSPreviewResponse
)
from app.repositories.modele_email_repository import modele_email_repository
from app.repositories.modele_sms_repository import modele_sms_repository
from app.services.template_service import render_email, render_sms

router = APIRouter()


# ========== MODÈLES EMAIL ==========

@router.get("/emails", response_model=List[ModeleEmailResponse])
def get_all_modeles_email(
    etablissement_id: Optional[int] = None,
    type_destinataire: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère tous les modèles d'email"""
    if type_destinataire:
        return modele_email_repository.get_by_type_destinataire(db, type_destinataire)
    return modele_email_repository.get_all(db, etablissement_id)


@router.get("/emails/{modele_id}", response_model=ModeleEmailResponse)
def get_modele_email_by_id(
    modele_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère un modèle d'email par son ID"""
    modele = modele_email_repository.get_by_id(db, modele_id)
    if not modele:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Modèle d'email non trouvé"
        )
    return modele


@router.post("/emails", response_model=ModeleEmailResponse, status_code=status.HTTP_201_CREATED)
def create_modele_email(
    modele_in: ModeleEmailCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Crée un nouveau modèle d'email"""
    existing = modele_email_repository.get_by_code(db, modele_in.code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Un modèle avec le code '{modele_in.code}' existe déjà"
        )
    
    return modele_email_repository.create(db, modele_in)


@router.put("/emails/{modele_id}", response_model=ModeleEmailResponse)
def update_modele_email(
    modele_id: int,
    modele_in: ModeleEmailUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Met à jour un modèle d'email"""
    modele = modele_email_repository.get_by_id(db, modele_id)
    if not modele:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Modèle d'email non trouvé"
        )
    
    return modele_email_repository.update(db, modele, modele_in)


@router.delete("/emails/{modele_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_modele_email(
    modele_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Supprime un modèle d'email"""
    if not modele_email_repository.delete(db, modele_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Modèle d'email non trouvé"
        )


@router.post("/emails/{modele_id}/preview", response_model=ModeleEmailPreviewResponse)
def preview_modele_email(
    modele_id: int,
    preview_data: ModeleEmailPreviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Génère un aperçu de l'email avec les variables fournies"""
    result = modele_email_repository.render_email(db, modele_id, preview_data.variables)
    if not result["objet"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Modèle d'email non trouvé"
        )
    return result


@router.post("/emails/code/{code}/render")
def render_email_by_code(
    code: str,
    preview_data: ModeleEmailPreviewRequest,
    etablissement_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Génère l'email à partir du code du modèle"""
    result = render_email(db, code, preview_data.variables, etablissement_id)
    if not result["objet"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Modèle d'email non trouvé"
        )
    return result


# ========== MODÈLES SMS ==========

@router.get("/sms", response_model=List[ModeleSMSResponse])
def get_all_modeles_sms(
    etablissement_id: Optional[int] = None,
    type_destinataire: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère tous les modèles de SMS"""
    if type_destinataire:
        return modele_sms_repository.get_by_type_destinataire(db, type_destinataire)
    return modele_sms_repository.get_all(db, etablissement_id)


@router.get("/sms/{modele_id}", response_model=ModeleSMSResponse)
def get_modele_sms_by_id(
    modele_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère un modèle de SMS par son ID"""
    modele = modele_sms_repository.get_by_id(db, modele_id)
    if not modele:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Modèle de SMS non trouvé"
        )
    return modele


@router.post("/sms", response_model=ModeleSMSResponse, status_code=status.HTTP_201_CREATED)
def create_modele_sms(
    modele_in: ModeleSMSCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Crée un nouveau modèle de SMS"""
    existing = modele_sms_repository.get_by_code(db, modele_in.code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Un modèle avec le code '{modele_in.code}' existe déjà"
        )
    
    return modele_sms_repository.create(db, modele_in)


@router.put("/sms/{modele_id}", response_model=ModeleSMSResponse)
def update_modele_sms(
    modele_id: int,
    modele_in: ModeleSMSUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Met à jour un modèle de SMS"""
    modele = modele_sms_repository.get_by_id(db, modele_id)
    if not modele:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Modèle de SMS non trouvé"
        )
    
    return modele_sms_repository.update(db, modele, modele_in)


@router.delete("/sms/{modele_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_modele_sms(
    modele_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Supprime un modèle de SMS"""
    if not modele_sms_repository.delete(db, modele_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Modèle de SMS non trouvé"
        )


@router.post("/sms/{modele_id}/preview", response_model=ModeleSMSPreviewResponse)
def preview_modele_sms(
    modele_id: int,
    preview_data: ModeleSMSPreviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Génère un aperçu du SMS avec les variables fournies"""
    result = modele_sms_repository.render_sms(db, modele_id, preview_data.variables)
    if not result["message"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Modèle de SMS non trouvé"
        )
    return result


@router.post("/sms/code/{code}/render")
def render_sms_by_code(
    code: str,
    preview_data: ModeleSMSPreviewRequest,
    etablissement_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Génère le SMS à partir du code du modèle"""
    message = render_sms(db, code, preview_data.variables, etablissement_id)
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Modèle de SMS non trouvé"
        )
    return {"message": message, "longueur": len(message)}


# ========== TYPES DE DESTINATAIRES ==========

@router.get("/types-destinataires")
def get_types_destinataires(
    current_user: User = Depends(get_current_active_user)
):
    """Récupère la liste des types de destinataires"""
    return [
        {"code": "etudiant", "libelle": "Étudiant"},
        {"code": "enseignant", "libelle": "Enseignant"},
        {"code": "parent", "libelle": "Parent/Tuteur"},
        {"code": "personnel", "libelle": "Personnel administratif"}
    ]
