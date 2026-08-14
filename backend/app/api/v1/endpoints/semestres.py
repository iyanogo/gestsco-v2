"""
Endpoints pour la gestion des semestres LMD.
Structure CAMES : L (S1-S6), M (S7-S10), D (S11-S16).
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.semestre import Semestre
from app.repositories.semestre_repository import SemestreRepository

router = APIRouter()


# Schémas Pydantic

class SemestreCreate(BaseModel):
    """Schéma pour créer un semestre."""
    code: str
    libelle: str
    cycle_id: int
    numero_semestre: int
    annee_dans_cycle: int
    semestre_dans_annee: int
    credits_requis: int = 30
    description: Optional[str] = None


class SemestreUpdate(BaseModel):
    """Schéma pour mettre à jour un semestre."""
    libelle: Optional[str] = None
    credits_requis: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class SemestreResponse(BaseModel):
    """Schéma de réponse pour un semestre."""
    id: int
    code: str
    libelle: str
    cycle_id: int
    numero_semestre: int
    annee_dans_cycle: int
    semestre_dans_annee: int
    credits_requis: int
    description: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


# Endpoints

@router.get("/", response_model=List[SemestreResponse], summary="Liste des semestres")
async def list_semestres(
    cycle_id: Optional[int] = Query(None, description="Filtrer par cycle"),
    is_active: bool = Query(True, description="Filtrer par statut actif"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère la liste des semestres.
    """
    query = db.query(Semestre)
    
    if cycle_id:
        query = query.filter(Semestre.cycle_id == cycle_id)
    if is_active is not None:
        query = query.filter(Semestre.is_active == is_active)
    
    semestres = query.order_by(Semestre.numero_semestre).all()
    return semestres


@router.post("/", response_model=SemestreResponse, summary="Créer un semestre")
async def create_semestre(
    semestre_data: SemestreCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Crée un nouveau semestre.
    
    **Permissions requises**: Admin
    """
    # Vérifier l'unicité du code
    existing = db.query(Semestre).filter(Semestre.code == semestre_data.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Le code {semestre_data.code} existe déjà"
        )
    
    semestre = Semestre(**semestre_data.dict())
    db.add(semestre)
    db.commit()
    db.refresh(semestre)
    
    return semestre


@router.get("/lmd", summary="Structure LMD complète")
async def get_structure_lmd(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère la structure LMD complète.
    
    Retourne les semestres organisés par cycle :
    - Licence (L) : S1-S6
    - Master (M) : S7-S10
    - Doctorat (D) : S11-S16
    """
    repo = SemestreRepository(db)
    structure = repo.get_semestres_lmd()
    
    return {
        "licence": {
            "code": "L",
            "libelle": "Licence",
            "duree_annees": 3,
            "credits_total": 180,
            "semestres": [
                {
                    "id": s.id,
                    "code": s.code,
                    "libelle": s.libelle,
                    "numero": s.numero_semestre,
                    "annee": s.annee_dans_cycle,
                    "credits": s.credits_requis
                }
                for s in structure["licence"]
            ]
        },
        "master": {
            "code": "M",
            "libelle": "Master",
            "duree_annees": 2,
            "credits_total": 120,
            "semestres": [
                {
                    "id": s.id,
                    "code": s.code,
                    "libelle": s.libelle,
                    "numero": s.numero_semestre,
                    "annee": s.annee_dans_cycle,
                    "credits": s.credits_requis
                }
                for s in structure["master"]
            ]
        },
        "doctorat": {
            "code": "D",
            "libelle": "Doctorat",
            "duree_annees": 3,
            "credits_total": 180,
            "semestres": [
                {
                    "id": s.id,
                    "code": s.code,
                    "libelle": s.libelle,
                    "numero": s.numero_semestre,
                    "annee": s.annee_dans_cycle,
                    "credits": s.credits_requis
                }
                for s in structure["doctorat"]
            ]
        }
    }


@router.get("/par-cycle/{cycle_id}", response_model=List[SemestreResponse], summary="Semestres par cycle")
async def get_semestres_par_cycle(
    cycle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère les semestres d'un cycle spécifique.
    """
    repo = SemestreRepository(db)
    semestres = repo.get_by_cycle(cycle_id)
    return semestres


@router.get("/{semestre_id}", response_model=SemestreResponse, summary="Détails d'un semestre")
async def get_semestre(
    semestre_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère les détails d'un semestre.
    """
    semestre = db.query(Semestre).filter(Semestre.id == semestre_id).first()
    if not semestre:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Semestre {semestre_id} non trouvé"
        )
    return semestre


@router.put("/{semestre_id}", response_model=SemestreResponse, summary="Modifier un semestre")
async def update_semestre(
    semestre_id: int,
    semestre_data: SemestreUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Met à jour un semestre.
    
    **Permissions requises**: Admin
    """
    semestre = db.query(Semestre).filter(Semestre.id == semestre_id).first()
    if not semestre:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Semestre {semestre_id} non trouvé"
        )
    
    update_data = semestre_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(semestre, field, value)
    
    db.commit()
    db.refresh(semestre)
    return semestre


@router.delete("/{semestre_id}", summary="Supprimer un semestre")
async def delete_semestre(
    semestre_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Supprime un semestre (désactivation).
    
    **Permissions requises**: Admin
    """
    semestre = db.query(Semestre).filter(Semestre.id == semestre_id).first()
    if not semestre:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Semestre {semestre_id} non trouvé"
        )
    
    semestre.is_active = False
    db.commit()
    
    return {"message": f"Semestre {semestre.code} désactivé"}
