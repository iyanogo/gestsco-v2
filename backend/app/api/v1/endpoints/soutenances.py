"""
Endpoints pour la gestion des soutenances.
CRUD complet avec programmation, validation et génération de PV.
"""

from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Request, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api.deps import get_db
from app.utils.rbac_resolver import require_permission
from app.models.user import User
from app.models.soutenance import Soutenance
from app.models.stage import Stage
from app.services.stage_service import StageService, StageServiceError
from app.repositories.soutenance_repository import SoutenanceRepository
from app.utils.administration_events import audit_and_commit
from app.utils.audit_snapshots import fields_snapshot

router = APIRouter()

_SOUTENANCE_FIELDS = (
    "stage_id",
    "date_soutenance",
    "lieu",
    "statut",
    "salle_id",
    "duree_minutes",
    "note_finale",
)


# Schémas Pydantic

class SoutenanceCreate(BaseModel):
    """Schéma pour programmer une soutenance."""
    stage_id: int
    date_soutenance: datetime
    lieu: str
    president_jury_id: int
    rapporteur_id: int
    salle_id: Optional[int] = None
    examinateur_id: Optional[int] = None
    duree_minutes: int = 30


class SoutenanceUpdate(BaseModel):
    """Schéma pour mettre à jour une soutenance."""
    date_soutenance: Optional[datetime] = None
    lieu: Optional[str] = None
    salle_id: Optional[int] = None
    duree_minutes: Optional[int] = None
    president_jury_id: Optional[int] = None
    rapporteur_id: Optional[int] = None
    examinateur_id: Optional[int] = None


class ValiderSoutenanceRequest(BaseModel):
    """Schéma pour valider une soutenance."""
    note_presentation: Decimal
    note_defense: Decimal
    note_jury: Decimal
    observations_jury: Optional[str] = None


class SoutenanceResponse(BaseModel):
    """Schéma de réponse pour une soutenance."""
    id: int
    stage_id: int
    date_soutenance: datetime
    lieu: str
    salle_id: Optional[int]
    duree_minutes: int
    president_jury_id: int
    rapporteur_id: int
    examinateur_id: Optional[int]
    note_presentation: Optional[Decimal] = None
    note_defense: Optional[Decimal] = None
    note_jury: Optional[Decimal] = None
    note_finale: Optional[Decimal] = None
    appreciation: Optional[str] = None
    mention: Optional[str] = None
    statut: str
    proces_verbal_url: Optional[str] = None

    class Config:
        from_attributes = True


# Endpoints

@router.get("/", response_model=List[SoutenanceResponse], summary="Liste des soutenances")
async def list_soutenances(
    statut: Optional[str] = Query(None, description="Filtrer par statut"),
    date_debut: Optional[date] = Query(None, description="Date de début"),
    date_fin: Optional[date] = Query(None, description="Date de fin"),
    niveau_id: Optional[int] = Query(None, description="Filtrer par niveau"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("soutenances", "read")),
):
    """
    Récupère la liste des soutenances avec filtres optionnels.
    """
    repo = SoutenanceRepository(db)
    
    if date_debut and date_fin:
        soutenances = repo.get_by_date_range(date_debut, date_fin)
    elif niveau_id:
        soutenances = repo.get_by_niveau(niveau_id)
    elif statut:
        soutenances = db.query(Soutenance).filter(
            Soutenance.statut == statut
        ).order_by(Soutenance.date_soutenance).offset(skip).limit(limit).all()
    else:
        soutenances = db.query(Soutenance).order_by(
            Soutenance.date_soutenance.desc()
        ).offset(skip).limit(limit).all()
    
    return soutenances


@router.post("/", response_model=SoutenanceResponse, summary="Programmer une soutenance")
async def create_soutenance(
    soutenance_data: SoutenanceCreate,
    http_request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("soutenances", "create")),
):
    """
    Programme une nouvelle soutenance pour un stage.
    
    Vérifie :
    - Que le stage est terminé avec un rapport déposé
    - La disponibilité de la salle
    - La disponibilité des membres du jury
    """
    service = StageService(db)
    
    try:
        soutenance = service.programmer_soutenance(
            stage_id=soutenance_data.stage_id,
            date_soutenance=soutenance_data.date_soutenance,
            lieu=soutenance_data.lieu,
            president_jury_id=soutenance_data.president_jury_id,
            rapporteur_id=soutenance_data.rapporteur_id,
            salle_id=soutenance_data.salle_id,
            examinateur_id=soutenance_data.examinateur_id,
            duree_minutes=soutenance_data.duree_minutes
        )
        audit_and_commit(
            db,
            request=http_request,
            user=current_user,
            action="create",
            entity_type="soutenance",
            entity_id=soutenance.id,
            new_values=fields_snapshot(soutenance, *_SOUTENANCE_FIELDS),
        )
        return soutenance
    except StageServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/jury/{user_id}", response_model=List[SoutenanceResponse], summary="Soutenances d'un membre du jury")
async def get_soutenances_jury(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("soutenances", "read")),
):
    """
    Récupère toutes les soutenances où l'utilisateur est membre du jury.
    """
    service = StageService(db)
    soutenances = service.get_soutenances_jury(user_id)
    return soutenances


@router.get("/calendrier", summary="Calendrier des soutenances")
async def get_calendrier_soutenances(
    date_debut: date = Query(..., description="Date de début"),
    date_fin: date = Query(..., description="Date de fin"),
    niveau_id: Optional[int] = Query(None, description="Filtrer par niveau"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("soutenances", "read")),
):
    """
    Récupère le calendrier des soutenances pour une période.
    """
    service = StageService(db)
    soutenances = service.get_calendrier_soutenances(date_debut, date_fin, niveau_id)

    events = []
    for s in soutenances:
        stage = s.stage
        events.append({
            "id": s.id,
            "title": f"Soutenance - {stage.etudiant_id}",
            "start": s.date_soutenance.isoformat(),
            "end": (s.date_soutenance.replace(
                minute=s.date_soutenance.minute + s.duree_minutes
            )).isoformat(),
            "lieu": s.lieu,
            "salle_id": s.salle_id,
            "statut": s.statut,
            "stage_id": stage.id,
            "theme": stage.theme[:100] if stage.theme else None
        })

    return events


@router.get("/a-venir", response_model=List[SoutenanceResponse], summary="Soutenances à venir")
async def get_soutenances_a_venir(
    jours: int = Query(7, ge=1, le=30, description="Nombre de jours"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("soutenances", "read")),
):
    """
    Récupère les soutenances programmées dans les X prochains jours.
    """
    repo = SoutenanceRepository(db)
    soutenances = repo.get_a_venir(jours)
    return soutenances


@router.get("/{soutenance_id}", response_model=SoutenanceResponse, summary="Détails d'une soutenance")
async def get_soutenance(
    soutenance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("soutenances", "read")),
):
    """
    Récupère les détails d'une soutenance.
    """
    soutenance = db.query(Soutenance).filter(Soutenance.id == soutenance_id).first()
    if not soutenance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Soutenance {soutenance_id} non trouvée"
        )
    return soutenance


@router.put("/{soutenance_id}", response_model=SoutenanceResponse, summary="Modifier une soutenance")
async def update_soutenance(
    soutenance_id: int,
    soutenance_data: SoutenanceUpdate,
    http_request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("soutenances", "update")),
):
    """
    Met à jour une soutenance programmée.
    """
    soutenance = db.query(Soutenance).filter(Soutenance.id == soutenance_id).first()
    if not soutenance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Soutenance {soutenance_id} non trouvée"
        )
    
    if soutenance.statut != "programmee":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seules les soutenances programmées peuvent être modifiées"
        )
    
    old_snapshot = fields_snapshot(soutenance, *_SOUTENANCE_FIELDS)
    update_data = soutenance_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(soutenance, field, value)
    
    db.commit()
    db.refresh(soutenance)
    audit_and_commit(
        db,
        request=http_request,
        user=current_user,
        action="update",
        entity_type="soutenance",
        entity_id=soutenance_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(soutenance, *_SOUTENANCE_FIELDS),
    )
    return soutenance


@router.delete("/{soutenance_id}", summary="Annuler une soutenance")
async def delete_soutenance(
    soutenance_id: int,
    http_request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("soutenances", "delete")),
):
    """
    Annule une soutenance programmée.
    """
    soutenance = db.query(Soutenance).filter(Soutenance.id == soutenance_id).first()
    if not soutenance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Soutenance {soutenance_id} non trouvée"
        )
    
    if soutenance.statut != "programmee":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seules les soutenances programmées peuvent être annulées"
        )
    
    old_snapshot = fields_snapshot(soutenance, *_SOUTENANCE_FIELDS)
    db.delete(soutenance)
    db.commit()
    audit_and_commit(
        db,
        request=http_request,
        user=current_user,
        action="delete",
        entity_type="soutenance",
        entity_id=soutenance_id,
        old_values=old_snapshot,
    )
    return {"message": f"Soutenance {soutenance_id} annulée"}


@router.post("/{soutenance_id}/valider", summary="Valider une soutenance")
async def valider_soutenance(
    soutenance_id: int,
    request: ValiderSoutenanceRequest,
    http_request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("soutenances", "validate")),
):
    """
    Valide une soutenance avec les notes du jury.
    
    - Enregistre les notes
    - Calcule la note finale
    - Détermine la mention
    - Met à jour le stage
    """
    service = StageService(db)
    existing = db.query(Soutenance).filter(Soutenance.id == soutenance_id).first()
    old_snapshot = fields_snapshot(existing, *_SOUTENANCE_FIELDS) if existing else {}
    
    try:
        soutenance = service.valider_soutenance(
            soutenance_id=soutenance_id,
            note_presentation=request.note_presentation,
            note_defense=request.note_defense,
            note_jury=request.note_jury,
            observations_jury=request.observations_jury
        )
        audit_and_commit(
            db,
            request=http_request,
            user=current_user,
            action="validate",
            entity_type="soutenance",
            entity_id=soutenance_id,
            old_values=old_snapshot,
            new_values=fields_snapshot(soutenance, *_SOUTENANCE_FIELDS),
        )
        return {
            "message": "Soutenance validée avec succès",
            "soutenance": {
                "id": soutenance.id,
                "note_finale": float(soutenance.note_finale) if soutenance.note_finale else None,
                "appreciation": soutenance.appreciation,
                "mention": soutenance.mention,
                "statut": soutenance.statut
            }
        }
    except StageServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{soutenance_id}/generer-pv", summary="Générer le PV")
async def generer_pv_soutenance(
    soutenance_id: int,
    http_request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("soutenances", "validate")),
):
    """
    Génère le procès-verbal de soutenance.
    """
    service = StageService(db)
    
    try:
        pv_url = service.generer_pv_soutenance(soutenance_id)
        soutenance = db.query(Soutenance).filter(Soutenance.id == soutenance_id).first()
        audit_and_commit(
            db,
            request=http_request,
            user=current_user,
            action="publish",
            entity_type="soutenance",
            entity_id=soutenance_id,
            new_values={"proces_verbal_url": pv_url, "statut": getattr(soutenance, "statut", None)},
            details="generer_pv",
        )
        return {
            "message": "PV généré avec succès",
            "pv_url": pv_url
        }
    except StageServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
