"""
Endpoints pour la gestion des stages.
CRUD complet avec validation et statistiques.
"""

from typing import Optional, List
from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Request, status, Query
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel

from app.api.deps import get_db, get_current_active_user
from app.utils.rbac_resolver import require_permission
from app.core.portal_access import (
    assert_encadrant_owner,
    assert_etudiant_owner,
    resolve_etudiant_id,
)
from app.models.user import User
from app.models.stage import Stage
from app.services.stage_service import StageService, StageServiceError
from app.repositories.stage_repository import StageRepository
from app.utils.administration_events import audit_and_commit
from app.utils.audit_snapshots import fields_snapshot

router = APIRouter()

_STAGE_FIELDS = ("code", "etudiant_id", "type_stage", "statut", "date_debut", "date_fin", "entreprise_nom")


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
    etudiant_nom: Optional[str] = None
    etudiant_prenom: Optional[str] = None
    etudiant_matricule: Optional[str] = None
    matiere_code: Optional[str] = None
    matiere_libelle: Optional[str] = None
    niveau_libelle: Optional[str] = None

    class Config:
        from_attributes = True


def _stage_to_portal_response(stage: Stage) -> StageResponse:
    """Enrichit un stage avec les libellés étudiant/matière/niveau."""
    data = StageResponse.model_validate(stage)
    updates: dict = {}
    etu = stage.etudiant
    if etu:
        updates["etudiant_nom"] = etu.nom
        updates["etudiant_prenom"] = etu.prenom
        updates["etudiant_matricule"] = etu.matricule
    matiere = stage.matiere
    if matiere:
        updates["matiere_code"] = matiere.code
        updates["matiere_libelle"] = matiere.libelle
    niveau = stage.niveau
    if niveau:
        updates["niveau_libelle"] = niveau.libelle
    return data.model_copy(update=updates) if updates else data


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
    current_user: User = Depends(require_permission("stages", "read")),
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
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("stages", "create")),
):
    """
    Crée un nouveau stage.
    """
    service = StageService(db)
    
    try:
        stage = service.creer_stage(**stage_data.dict())
        audit_and_commit(
            db,
            request=request,
            user=current_user,
            action="create",
            entity_type="stage",
            entity_id=stage.id,
            new_values=fields_snapshot(stage, *_STAGE_FIELDS),
        )
        return stage
    except StageServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/mes-stages", response_model=List[StageResponse], summary="Mes stages (portail étudiant)")
async def get_mes_stages(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Stages de l'étudiant connecté."""
    etudiant_id = resolve_etudiant_id(db, current_user)
    service = StageService(db)
    return service.get_stages_etudiant(etudiant_id)


@router.get("/mes-stages-encadres", response_model=List[StageResponse], summary="Mes stages encadrés (portail enseignant)")
async def get_mes_stages_encadres(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Stages encadrés par l'enseignant connecté."""
    stages = (
        db.query(Stage)
        .options(
            joinedload(Stage.etudiant),
            joinedload(Stage.matiere),
            joinedload(Stage.niveau),
        )
        .filter(Stage.encadrant_academique_id == current_user.id)
        .order_by(Stage.date_debut.desc())
        .all()
    )
    return [_stage_to_portal_response(s) for s in stages]


@router.get("/etudiant/{etudiant_id}", response_model=List[StageResponse], summary="Stages d'un étudiant")
async def get_stages_etudiant(
    etudiant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère tous les stages d'un étudiant.
    """
    assert_etudiant_owner(current_user, etudiant_id, db)
    service = StageService(db)
    stages = service.get_stages_etudiant(etudiant_id)
    return stages


@router.get("/encadrant/{encadrant_id}", response_model=List[StageResponse], summary="Stages encadrés")
async def get_stages_encadrant(
    encadrant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère tous les stages encadrés par un enseignant.
    """
    assert_encadrant_owner(current_user, encadrant_id)
    service = StageService(db)
    stages = service.get_stages_encadrant(encadrant_id)
    return stages


@router.get("/statistiques", summary="Statistiques des stages")
async def get_statistiques_stages(
    annee_id: int = Query(..., description="ID de l'année académique"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("stages", "read")),
):
    """
    Génère les statistiques des stages pour une année académique.
    """
    service = StageService(db)
    stats = service.get_statistiques_stages(annee_id)
    return stats


@router.get("/{stage_id}", response_model=StageResponse, summary="Détails d'un stage")
async def get_stage(
    stage_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("stages", "read")),
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
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("stages", "update")),
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

    old_snapshot = fields_snapshot(stage, *_STAGE_FIELDS)
    update_data = stage_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(stage, field, value)

    db.commit()
    db.refresh(stage)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="stage",
        entity_id=stage_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(stage, *_STAGE_FIELDS),
    )
    return stage


@router.delete("/{stage_id}", summary="Supprimer un stage")
async def delete_stage(
    stage_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("stages", "delete")),
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

    old_snapshot = fields_snapshot(stage, *_STAGE_FIELDS)
    code = stage.code
    db.delete(stage)
    db.commit()
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="delete",
        entity_type="stage",
        entity_id=stage_id,
        old_values=old_snapshot,
    )

    return {"message": f"Stage {code} supprimé"}


@router.post("/{stage_id}/valider", summary="Valider un stage")
async def valider_stage(
    stage_id: int,
    body: ValiderStageRequest,
    http_request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("stages", "validate")),
):
    """
    Valide un stage avec les notes de l'entreprise et du rapport.
    """
    service = StageService(db)
    existing = db.query(Stage).filter(Stage.id == stage_id).first()
    old_snapshot = fields_snapshot(existing, *_STAGE_FIELDS) if existing else {}

    try:
        stage = service.valider_stage(
            stage_id=stage_id,
            note_entreprise=body.note_entreprise,
            note_rapport=body.note_rapport,
            observations=body.observations
        )
        audit_and_commit(
            db,
            request=http_request,
            user=current_user,
            action="validate",
            entity_type="stage",
            entity_id=stage_id,
            old_values=old_snapshot,
            new_values=fields_snapshot(stage, *_STAGE_FIELDS),
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
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("stages", "update")),
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
    
    old_snapshot = fields_snapshot(stage, *_STAGE_FIELDS)
    stage.terminer()
    db.commit()
    db.refresh(stage)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="stage",
        entity_id=stage_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(stage, *_STAGE_FIELDS),
        details="terminer",
    )

    return {
        "message": f"Stage {stage.code} terminé",
        "statut": stage.statut
    }
