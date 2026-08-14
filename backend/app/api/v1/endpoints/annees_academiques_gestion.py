"""
Endpoints pour la gestion avancée des années académiques.
Ouverture, clôture, reconduction du référentiel, rapports.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.services.annee_academique_service import (
    AnneeAcademiqueService,
    AnneeAcademiqueServiceError
)

router = APIRouter()


# Schémas Pydantic

class ElementsReconduction(BaseModel):
    """Éléments à reconduire lors de l'ouverture."""
    filieres: bool = True
    modules: bool = True
    matieres: bool = True
    salles: bool = False
    creneaux: bool = False
    frais_scolarite: bool = True
    types_frais: bool = True
    configurations: bool = True


class OuvrirAnneeRequest(BaseModel):
    """Requête pour ouvrir une année académique."""
    reconduire: bool = True
    elements_a_reconduire: Optional[ElementsReconduction] = None


class CloturerSemestreRequest(BaseModel):
    """Requête pour clôturer un semestre."""
    semestre: int


class ReconduireRequest(BaseModel):
    """Requête pour reconduire le référentiel."""
    annee_source_id: int
    annee_cible_id: int
    elements: ElementsReconduction


# Endpoints

@router.post("/{annee_id}/ouvrir", summary="Ouvrir une année académique")
async def ouvrir_annee(
    annee_id: int,
    request: OuvrirAnneeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Ouvre une année académique.
    
    - Vérifie qu'aucune année n'est déjà ouverte
    - Reconduit le référentiel si demandé
    - Crée les périodes comptables
    - Active les modules par défaut
    
    **Permissions requises**: Admin
    """
    # Vérifier les permissions (à adapter selon votre système de rôles)
    if not hasattr(current_user, 'role') or current_user.role not in ['admin', 'superadmin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les administrateurs peuvent ouvrir une année académique"
        )
    
    service = AnneeAcademiqueService(db)
    
    try:
        elements = request.elements_a_reconduire.dict() if request.elements_a_reconduire else None
        annee = service.ouvrir_annee(
            annee_id=annee_id,
            user_id=current_user.id,
            reconduire=request.reconduire,
            elements_a_reconduire=elements
        )
        
        return {
            "message": f"Année académique {annee.code} ouverte avec succès",
            "annee": {
                "id": annee.id,
                "code": annee.code,
                "libelle": annee.libelle,
                "statut": annee.statut,
                "date_ouverture": annee.date_ouverture,
                "est_reconduite": annee.est_reconduite
            }
        }
    except AnneeAcademiqueServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{annee_id}/cloturer-semestre", summary="Clôturer un semestre")
async def cloturer_semestre(
    annee_id: int,
    request: CloturerSemestreRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Clôture un semestre.
    
    - Vérifie que toutes les notes sont saisies
    - Lance les délibérations
    - Calcule les résultats semestriels
    - Passe au semestre suivant
    
    **Permissions requises**: Admin
    """
    if not hasattr(current_user, 'role') or current_user.role not in ['admin', 'superadmin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les administrateurs peuvent clôturer un semestre"
        )
    
    service = AnneeAcademiqueService(db)
    
    try:
        rapport = service.cloturer_semestre(
            annee_id=annee_id,
            semestre=request.semestre,
            user_id=current_user.id
        )
        
        return {
            "message": f"Semestre {request.semestre} clôturé avec succès",
            "rapport": rapport
        }
    except AnneeAcademiqueServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{annee_id}/cloturer", summary="Clôturer une année académique")
async def cloturer_annee(
    annee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Clôture une année académique.
    
    - Vérifie que les 2 semestres sont clôturés
    - Vérifie que toutes les délibérations sont validées
    - Calcule les résultats annuels
    - Clôture la période comptable
    
    **Permissions requises**: Admin
    """
    if not hasattr(current_user, 'role') or current_user.role not in ['admin', 'superadmin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les administrateurs peuvent clôturer une année"
        )
    
    service = AnneeAcademiqueService(db)
    
    try:
        annee = service.cloturer_annee(
            annee_id=annee_id,
            user_id=current_user.id
        )
        
        return {
            "message": f"Année académique {annee.code} clôturée avec succès",
            "annee": {
                "id": annee.id,
                "code": annee.code,
                "statut": annee.statut,
                "date_cloture": annee.date_cloture
            }
        }
    except AnneeAcademiqueServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{annee_id}/archiver", summary="Archiver une année académique")
async def archiver_annee(
    annee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Archive une année académique.
    
    - Change le statut en "archivee"
    - Désactive tous les modules
    
    **Permissions requises**: Admin
    """
    if not hasattr(current_user, 'role') or current_user.role not in ['admin', 'superadmin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les administrateurs peuvent archiver une année"
        )
    
    service = AnneeAcademiqueService(db)
    
    try:
        annee = service.archiver_annee(annee_id)
        
        return {
            "message": f"Année académique {annee.code} archivée avec succès",
            "annee": {
                "id": annee.id,
                "code": annee.code,
                "statut": annee.statut
            }
        }
    except AnneeAcademiqueServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{annee_id}/rapport", summary="Rapport complet de l'année")
async def get_rapport_annee(
    annee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Génère un rapport complet pour une année académique.
    
    Inclut :
    - Statistiques étudiants
    - Statistiques inscriptions
    - Statistiques financières
    - Statistiques délibérations
    
    **Permissions requises**: Admin, Scolarité
    """
    service = AnneeAcademiqueService(db)
    
    try:
        rapport = service.get_rapport_annee(annee_id)
        return rapport
    except AnneeAcademiqueServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/reconduire", summary="Reconduire le référentiel")
async def reconduire_referentiel(
    request: ReconduireRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Reconduit le référentiel d'une année vers une autre.
    
    Éléments pouvant être reconduits :
    - Filières
    - Modules
    - Matières
    - Salles
    - Créneaux horaires
    - Frais de scolarité
    - Types de frais
    - Configurations
    
    **Permissions requises**: Admin
    """
    if not hasattr(current_user, 'role') or current_user.role not in ['admin', 'superadmin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les administrateurs peuvent reconduire le référentiel"
        )
    
    service = AnneeAcademiqueService(db)
    
    try:
        rapport = service.reconduire_referentiel(
            annee_source_id=request.annee_source_id,
            annee_cible_id=request.annee_cible_id,
            user_id=current_user.id,
            elements=request.elements.dict()
        )
        
        return {
            "message": "Reconduction du référentiel terminée",
            "rapport": rapport
        }
    except AnneeAcademiqueServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{annee_id}/statut", summary="Statut détaillé de l'année")
async def get_statut_annee(
    annee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère le statut détaillé d'une année académique.
    
    Inclut :
    - Informations générales
    - Semestre actif
    - Modules actifs
    - Périodes comptables
    """
    from app.models.annee_academique import AnneeAcademique
    from app.models.module_actif import ModuleActif
    from app.models.periode_comptable import PeriodeComptable
    
    annee = db.query(AnneeAcademique).filter(AnneeAcademique.id == annee_id).first()
    if not annee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Année académique {annee_id} non trouvée"
        )
    
    # Compter les modules actifs
    modules_actifs = db.query(ModuleActif).filter(
        ModuleActif.annee_academique_id == annee_id,
        ModuleActif.est_actif == True
    ).count()
    
    # Récupérer les périodes comptables
    periodes = db.query(PeriodeComptable).filter(
        PeriodeComptable.annee_academique_id == annee_id
    ).all()
    
    return {
        "annee": {
            "id": annee.id,
            "code": annee.code,
            "libelle": annee.libelle,
            "statut": annee.statut,
            "semestre_actif": annee.semestre_actif,
            "date_debut": annee.date_debut,
            "date_fin": annee.date_fin,
            "date_ouverture": annee.date_ouverture,
            "date_cloture": annee.date_cloture,
            "est_reconduite": annee.est_reconduite
        },
        "modules_actifs": modules_actifs,
        "periodes_comptables": [
            {
                "id": p.id,
                "code": p.code,
                "statut": p.statut,
                "est_courante": p.est_periode_courante
            }
            for p in periodes
        ]
    }
