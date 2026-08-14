"""
Endpoints pour la gestion des stages.
CRUD complet avec validation et statistiques.
"""

from typing import Optional, List
from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.stage import Stage
from app.services.stage_service import StageService, StageServiceError
from app.repositories.stage_repository import StageRepository

router = APIRouter()


# Schémas Pydantic

class StageCreate(BaseModel):
    """Schéma pour créer un stage."""
    etudiant_id: int
    matiere_id: int
    niveau_id: int
    annee_academique_id: int
    type_stage: str
    duree_semaines: int
    date_debut: date
    date_fin: date
    entreprise_nom: str
    maitre_stage_nom: str
    theme: str
    entreprise_adresse: Optional[str] = None
    entreprise_telephone: Optional[str] = None
    entreprise_email: Optional[str] = None
    maitre_stage_fonction: Optional[str] = None
    maitre_stage_email: Optional[str] = None
    encadrant_academique_id: Optional[int] = None
    objectifs: Optional[str] = None


class StageUpdate(BaseModel):
    """Schéma pour mettre à jour un stage."""
    type_stage: Optional[str] = None
    duree_semaines: Optional[int] = None
    date_debut: Optional[date] = None
    date_fin: Optional[date] = None
    entreprise_nom: Optional[str] = None
    entreprise_adresse: Optional[str] = None
    entreprise_telephone: Optional[str] = None
    entreprise_email: Optional[str] = None
    maitre_stage_nom: Optional[str] = None
    maitre_stage_fonction: Optional[str] = None
    maitre_stage_email: Optional[str] = None
    encadrant_academique_id: Optional[int] = None
    theme: Optional[str] = None
    objectifs: Optional[str] = None
    rapport_url: Optional[str] = None
    date_depot_rapport: Optional[date] = None
    observations: Optional[str] = None


class ValiderStageRequest(BaseModel):
    """Schéma pour valider un stage."""
    note_entreprise: Decimal
    note_rapport: Decimal
    observations: Optional[str] = None


class StageResponse(BaseModel):
    """Schéma de réponse pour un stage."""
    id: int
    code: str
    etudiant_id: int
    matiere_id: int
    niveau_id: int
    annee_academique_id: int
    type_stage: str
    duree_semaines: int
    date_debut: date
    date_fin: date
    entreprise_nom: str
    maitre_stage_nom: str
    theme: str
    statut: str
    note_entreprise: Optional[Decimal] = None
    note_rapport: Optional[Decimal] = None
    note_soutenance: Optional[Decimal] = None
    note_finale: Optional[Decimal] = None

    class Config:
        from_attributes = True


# Endpoints

@router.get("/", response_model=List[StageResponse], summary="Liste des stages")
async def list_stages(
    annee_id: Optional[int] = Query(None, description="Filtrer par année académique"),
    niveau_id: Optional[int] = Query(None, description="Filtrer par niveau"),
    statut: Optional[str] = Query(None, description="Filtrer par statut"),
    type_stage: Optional[str] = Query(None, description="Filtrer par type"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère la liste des stages avec filtres optionnels.
    """
    query = db.query(Stage)
    
    if annee_id:
        query = query.filter(Stage.annee_academique_id == annee_id)
    if niveau_id:
        query = query.filter(Stage.niveau_id == niveau_id)
    if statut:
        query = query.filter(Stage.statut == statut)
    if type_stage:
        query = query.filter(Stage.type_stage == type_stage)
    
    stages = query.order_by(Stage.date_debut.desc()).offset(skip).limit(limit).all()
    return stages


@router.post("/", response_model=StageResponse, summary="Créer un stage")
async def create_stage(
    stage_data: StageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Crée un nouveau stage.
    """
    service = StageService(db)
    
    try:
        stage = service.creer_stage(**stage_data.dict())
        return stage
    except StageServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{stage_id}", response_model=StageResponse, summary="Détails d'un stage")
async def get_stage(
    stage_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère les détails d'un stage.
    """
    stage = db.query(Stage).filter(Stage.id == stage_id).first()
    if not stage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stage {stage_id} non trouvé"
        )
    return stage


@router.put("/{stage_id}", response_model=StageResponse, summary="Modifier un stage")
async def update_stage(
    stage_id: int,
    stage_data: StageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Met à jour un stage.
    """
    stage = db.query(Stage).filter(Stage.id == stage_id).first()
    if not stage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stage {stage_id} non trouvé"
        )
    
    update_data = stage_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(stage, field, value)
    
    db.commit()
    db.refresh(stage)
    return stage


@router.delete("/{stage_id}", summary="Supprimer un stage")
async def delete_stage(
    stage_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Supprime un stage.
    """
    stage = db.query(Stage).filter(Stage.id == stage_id).first()
    if not stage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stage {stage_id} non trouvé"
        )
    
    if stage.statut not in ["en_cours"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seuls les stages en cours peuvent être supprimés"
        )
    
    db.delete(stage)
    db.commit()
    
    return {"message": f"Stage {stage.code} supprimé"}


@router.post("/{stage_id}/valider", summary="Valider un stage")
async def valider_stage(
    stage_id: int,
    request: ValiderStageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Valide un stage avec les notes de l'entreprise et du rapport.
    """
    service = StageService(db)
    
    try:
        stage = service.valider_stage(
            stage_id=stage_id,
            note_entreprise=request.note_entreprise,
            note_rapport=request.note_rapport,
            observations=request.observations
        )
        
        return {
            "message": f"Stage {stage.code} validé",
            "stage": {
                "id": stage.id,
                "code": stage.code,
                "statut": stage.statut,
                "note_entreprise": float(stage.note_entreprise) if stage.note_entreprise else None,
                "note_rapport": float(stage.note_rapport) if stage.note_rapport else None
            }
        }
    except StageServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{stage_id}/terminer", summary="Terminer un stage")
async def terminer_stage(
    stage_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Marque un stage comme terminé.
    """
    stage = db.query(Stage).filter(Stage.id == stage_id).first()
    if not stage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stage {stage_id} non trouvé"
        )
    
    if stage.statut != "en_cours":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le stage doit être en cours pour être terminé"
        )
    
    stage.terminer()
    db.commit()
    
    return {
        "message": f"Stage {stage.code} terminé",
        "statut": stage.statut
    }


@router.get("/etudiant/{etudiant_id}", response_model=List[StageResponse], summary="Stages d'un étudiant")
async def get_stages_etudiant(
    etudiant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère tous les stages d'un étudiant.
    """
    service = StageService(db)
    stages = service.get_stages_etudiant(etudiant_id)
    return stages


@router.get("/encadrant/{encadrant_id}", response_model=List[StageResponse], summary="Stages encadrés")
async def get_stages_encadrant(
    encadrant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère tous les stages encadrés par un enseignant.
    """
    service = StageService(db)
    stages = service.get_stages_encadrant(encadrant_id)
    return stages


@router.get("/statistiques", summary="Statistiques des stages")
async def get_statistiques_stages(
    annee_id: int = Query(..., description="ID de l'année académique"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Génère les statistiques des stages pour une année académique.
    """
    service = StageService(db)
    stats = service.get_statistiques_stages(annee_id)
    return stats
