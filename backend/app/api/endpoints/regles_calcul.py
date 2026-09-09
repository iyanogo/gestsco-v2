from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_active_user
from app.utils.rbac_resolver import require_permission
from app.models.user import User
from app.utils.administration_events import audit_and_commit
from app.utils.audit_snapshots import fields_snapshot
from app.schemas.regles_calcul import (
    RegleCalculCreate,
    RegleCalculUpdate,
    RegleCalculResponse,
    RegleCalculTestRequest,
    RegleCalculTestResponse
)
from app.repositories.regle_calcul_repository import regle_calcul_repository
from app.services.calcul_service import (
    calculer_moyenne,
    determiner_mention,
    valider_credits,
    appliquer_compensation,
    verifier_passage_annee
)

router = APIRouter()

_REGLE_FIELDS = ("code", "libelle", "type_regle", "ordre_execution", "is_active")


@router.get("/", response_model=List[RegleCalculResponse])
def get_all_regles(
    type_regle: Optional[str] = None,
    cycle_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère toutes les règles de calcul"""
    return regle_calcul_repository.get_all(db, type_regle, cycle_id)


@router.get("/types")
def get_types_regles(
    current_user: User = Depends(get_current_active_user)
):
    """Récupère la liste des types de règles disponibles"""
    return [
        {"code": "moyenne_matiere", "libelle": "Calcul de moyenne matière"},
        {"code": "moyenne_semestre", "libelle": "Calcul de moyenne semestre"},
        {"code": "moyenne_annuelle", "libelle": "Calcul de moyenne annuelle"},
        {"code": "validation_credits", "libelle": "Validation des crédits"},
        {"code": "compensation", "libelle": "Règles de compensation"},
        {"code": "deliberation", "libelle": "Règles de délibération"}
    ]


@router.get("/{regle_id}", response_model=RegleCalculResponse)
def get_regle_by_id(
    regle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère une règle par son ID"""
    regle = regle_calcul_repository.get_by_id(db, regle_id)
    if not regle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Règle non trouvée"
        )
    return regle


@router.post("/", response_model=RegleCalculResponse, status_code=status.HTTP_201_CREATED)
def create_regle(
    regle_in: RegleCalculCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("parametrage", "create")),
):
    """Crée une nouvelle règle de calcul (superuser uniquement)."""
    existing = regle_calcul_repository.get_by_code(db, regle_in.code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Une règle avec le code '{regle_in.code}' existe déjà"
        )

    regle = regle_calcul_repository.create(db, regle_in)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="create",
        entity_type="regle_calcul",
        entity_id=regle.id,
        new_values=fields_snapshot(regle, *_REGLE_FIELDS),
    )
    return regle


@router.put("/{regle_id}", response_model=RegleCalculResponse)
def update_regle(
    regle_id: int,
    regle_in: RegleCalculUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("parametrage", "update")),
):
    """Met à jour une règle de calcul (superuser uniquement)."""
    regle = regle_calcul_repository.get_by_id(db, regle_id)
    if not regle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Règle non trouvée"
        )

    old_snapshot = fields_snapshot(regle, *_REGLE_FIELDS)
    updated = regle_calcul_repository.update(db, regle, regle_in)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="regle_calcul",
        entity_id=regle_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(updated, *_REGLE_FIELDS),
    )
    return updated


@router.delete("/{regle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_regle(
    regle_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("parametrage", "delete")),
):
    """Supprime une règle de calcul (superuser uniquement)."""
    regle = regle_calcul_repository.get_by_id(db, regle_id)
    if not regle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Règle non trouvée"
        )
    old_snapshot = fields_snapshot(regle, *_REGLE_FIELDS)
    regle_calcul_repository.delete(db, regle_id)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="delete",
        entity_type="regle_calcul",
        entity_id=regle_id,
        old_values=old_snapshot,
    )


@router.post("/{regle_id}/tester", response_model=RegleCalculTestResponse)
def tester_regle(
    regle_id: int,
    test_data: RegleCalculTestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("parametrage", "read")),
):
    """Teste une règle avec des données (superuser uniquement)."""
    result = regle_calcul_repository.executer_regle(db, regle_id, test_data.donnees)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible d'exécuter la règle avec les données fournies"
        )
    return {"resultat": result, "details": test_data.donnees}


# Endpoints de calcul direct
@router.post("/calculer/moyenne")
def calculer_moyenne_endpoint(
    notes: List[float],
    coefficients: List[float],
    cycle_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Calcule une moyenne pondérée"""
    if len(notes) != len(coefficients):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le nombre de notes doit correspondre au nombre de coefficients"
        )
    
    moyenne = calculer_moyenne(db, notes, coefficients, cycle_id)
    mention = determiner_mention(db, moyenne, cycle_id)
    
    return {
        "moyenne": moyenne,
        "mention": mention,
        "notes": notes,
        "coefficients": coefficients
    }


@router.post("/calculer/mention")
def calculer_mention_endpoint(
    moyenne: float,
    cycle_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Détermine la mention pour une moyenne"""
    mention = determiner_mention(db, moyenne, cycle_id)
    return {"moyenne": moyenne, "mention": mention}


@router.post("/calculer/validation-credits")
def valider_credits_endpoint(
    note: float,
    credits: int,
    cycle_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Vérifie si les crédits sont validés"""
    resultats = {"note": note, "credits": credits}
    valide = valider_credits(db, resultats, cycle_id)
    return {
        "note": note,
        "credits": credits,
        "credits_valides": credits if valide else 0,
        "valide": valide
    }


@router.post("/calculer/compensation")
def appliquer_compensation_endpoint(
    moyenne: float,
    notes: List[float],
    cycle_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Applique les règles de compensation"""
    resultats = {"moyenne": moyenne, "notes": notes}
    result = appliquer_compensation(db, resultats, cycle_id)
    return result


@router.post("/calculer/passage-annee")
def verifier_passage_endpoint(
    credits_obtenus: int,
    moyenne_annuelle: float,
    cycle_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Vérifie si l'étudiant peut passer à l'année suivante"""
    resultats = {
        "credits_obtenus": credits_obtenus,
        "moyenne_annuelle": moyenne_annuelle
    }
    result = verifier_passage_annee(db, resultats, cycle_id)
    return result
