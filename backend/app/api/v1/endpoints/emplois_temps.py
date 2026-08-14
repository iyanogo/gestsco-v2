"""
Endpoints API pour la gestion des emplois du temps
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.core.permissions import get_current_scolarite_user
from app.models.user import User
from app.models.emploi_temps import EmploiTemps as EmploiTempsModel
from app.repositories.emploi_temps_repository import emploi_temps_repository
from app.schemas.emploi_temps import (
    EmploiTemps,
    EmploiTempsCreate,
    EmploiTempsUpdate,
    EmploiTempsWithDetails,
    EmploiTempsWithSeances,
)

router = APIRouter(prefix="/emplois-temps", tags=["Emplois du Temps"])


@router.get("/", response_model=List[EmploiTemps])
def get_emplois_temps(
    skip: int = 0,
    limit: int = 100,
    niveau_id: Optional[int] = None,
    filiere_id: Optional[int] = None,
    semestre: Optional[int] = None,
    annee_id: Optional[int] = None,
    statut: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Liste tous les emplois du temps"""
    if niveau_id:
        emplois = emploi_temps_repository.get_by_niveau_filiere(
            db, niveau_id, filiere_id, semestre, annee_id
        )
        if statut:
            emplois = [e for e in emplois if e.statut == statut]
        return emplois
    
    query = db.query(EmploiTempsModel)
    if statut:
        query = query.filter(EmploiTempsModel.statut == statut)
    
    return query.offset(skip).limit(limit).all()


@router.get("/actif")
def get_emploi_temps_actif(
    niveau_id: int = Query(...),
    filiere_id: Optional[int] = None,
    semestre: int = Query(...),
    annee_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Emploi du temps actif (publié)"""
    emploi = emploi_temps_repository.get_actif(db, niveau_id, filiere_id, semestre, annee_id)
    if not emploi:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucun emploi du temps publié trouvé"
        )
    return emploi


@router.get("/{emploi_temps_id}", response_model=EmploiTemps)
def get_emploi_temps(
    emploi_temps_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère un emploi du temps par ID"""
    emploi = emploi_temps_repository.get_by_id(db, emploi_temps_id)
    if not emploi:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emploi du temps non trouvé"
        )
    return emploi


@router.get("/{emploi_temps_id}/seances")
def get_emploi_temps_with_seances(
    emploi_temps_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Emploi du temps avec toutes les séances"""
    result = emploi_temps_repository.get_with_seances(db, emploi_temps_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emploi du temps non trouvé"
        )
    return result


@router.get("/{emploi_temps_id}/export/pdf")
def export_emploi_temps_pdf(
    emploi_temps_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Exporte l'emploi du temps en PDF"""
    from app.services.emploi_temps_service import generer_emploi_temps_pdf
    
    emploi = emploi_temps_repository.get_by_id(db, emploi_temps_id)
    if not emploi:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emploi du temps non trouvé"
        )
    
    try:
        pdf_bytes = generer_emploi_temps_pdf(db, emploi_temps_id)
        
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=emploi_temps_{emploi.code}.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la génération du PDF: {str(e)}"
        )


@router.get("/{emploi_temps_id}/export/excel")
def export_emploi_temps_excel(
    emploi_temps_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Exporte l'emploi du temps en Excel"""
    from app.services.emploi_temps_service import generer_emploi_temps_excel
    
    emploi = emploi_temps_repository.get_by_id(db, emploi_temps_id)
    if not emploi:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emploi du temps non trouvé"
        )
    
    try:
        excel_bytes = generer_emploi_temps_excel(db, emploi_temps_id)
        
        return StreamingResponse(
            io.BytesIO(excel_bytes),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename=emploi_temps_{emploi.code}.xlsx"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la génération du fichier Excel: {str(e)}"
        )


@router.post("/", response_model=EmploiTemps, status_code=status.HTTP_201_CREATED)
def create_emploi_temps(
    emploi_in: EmploiTempsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user)
):
    """Crée un nouvel emploi du temps"""
    # Vérifier si le code existe déjà
    existing = emploi_temps_repository.get_by_code(db, emploi_in.code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un emploi du temps avec ce code existe déjà"
        )
    return emploi_temps_repository.create(db, emploi_in)


@router.put("/{emploi_temps_id}", response_model=EmploiTemps)
def update_emploi_temps(
    emploi_temps_id: int,
    emploi_in: EmploiTempsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user)
):
    """Met à jour un emploi du temps"""
    emploi = emploi_temps_repository.get_by_id(db, emploi_temps_id)
    if not emploi:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emploi du temps non trouvé"
        )
    
    # Ne peut modifier que si brouillon ou validé
    if emploi.statut not in ["brouillon", "valide"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seuls les emplois du temps en brouillon ou validés peuvent être modifiés"
        )
    
    # Vérifier unicité du code si modifié
    if emploi_in.code and emploi_in.code != emploi.code:
        existing = emploi_temps_repository.get_by_code(db, emploi_in.code)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un emploi du temps avec ce code existe déjà"
            )
    
    return emploi_temps_repository.update(db, emploi_temps_id, emploi_in)


@router.patch("/{emploi_temps_id}/valider", response_model=EmploiTemps)
def valider_emploi_temps(
    emploi_temps_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user)
):
    """Valide un emploi du temps"""
    emploi = emploi_temps_repository.valider(db, emploi_temps_id)
    if not emploi:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emploi du temps non trouvé ou déjà validé"
        )
    return emploi


@router.patch("/{emploi_temps_id}/publier", response_model=EmploiTemps)
def publier_emploi_temps(
    emploi_temps_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user)
):
    """Publie un emploi du temps"""
    emploi = emploi_temps_repository.publier(db, emploi_temps_id, current_user.id)
    if not emploi:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emploi du temps non trouvé ou déjà publié"
        )
    return emploi


@router.patch("/{emploi_temps_id}/archiver", response_model=EmploiTemps)
def archiver_emploi_temps(
    emploi_temps_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user)
):
    """Archive un emploi du temps"""
    emploi = emploi_temps_repository.archiver(db, emploi_temps_id)
    if not emploi:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emploi du temps non trouvé"
        )
    return emploi


@router.delete("/{emploi_temps_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_emploi_temps(
    emploi_temps_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user)
):
    """Supprime un emploi du temps"""
    emploi = emploi_temps_repository.get_by_id(db, emploi_temps_id)
    if not emploi:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emploi du temps non trouvé"
        )
    
    # Ne peut supprimer que si brouillon
    if emploi.statut != "brouillon":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seuls les emplois du temps en brouillon peuvent être supprimés"
        )
    
    emploi_temps_repository.delete(db, emploi_temps_id)
    return None
