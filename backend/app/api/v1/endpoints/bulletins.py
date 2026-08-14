"""
Endpoints API pour la gestion des bulletins
"""

from typing import Optional
from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.repositories import (
    etudiant_repository,
    resultat_semestre_repository,
    resultat_annuel_repository,
    resultat_matiere_repository,
    inscription_repository,
    deliberation_repository,
)
from app.services.bulletin_service import (
    generer_bulletin_semestre,
    generer_bulletin_annuel,
    generer_releve_notes,
    generer_bulletin_pdf,
)

router = APIRouter(prefix="/bulletins", tags=["Bulletins"])


def verifier_acces_etudiant(current_user: User, etudiant_id: int) -> bool:
    """
    Vérifie si l'utilisateur a accès aux données de l'étudiant.
    - Admin/Scolarité : accès à tous
    - Étudiant : accès uniquement à ses propres données
    """
    if current_user.role in ("admin", "superuser", "scolarite"):
        return True
    
    # Vérifier si l'utilisateur est l'étudiant lui-même
    if hasattr(current_user, 'etudiant_id') and current_user.etudiant_id == etudiant_id:
        return True
    
    return False


@router.get("/etudiant/{etudiant_id}/semestre", summary="Bulletin semestriel")
async def get_bulletin_semestre(
    etudiant_id: int,
    session_id: int = Query(..., description="ID de la session"),
    semestre: int = Query(..., ge=1, le=2, description="Numéro du semestre"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère le bulletin semestriel d'un étudiant.
    
    L'étudiant peut consulter son propre bulletin.
    """
    # Vérifier l'accès
    if not verifier_acces_etudiant(current_user, etudiant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas accès à ce bulletin"
        )
    
    # Vérifier que l'étudiant existe
    etudiant = etudiant_repository.get_by_id(db, etudiant_id)
    if not etudiant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Étudiant non trouvé"
        )
    
    # Vérifier si les résultats sont publiés (sauf pour admin/scolarité)
    if current_user.role not in ("admin", "superuser", "scolarite"):
        # Vérifier qu'une délibération publiée existe
        # (logique simplifiée - à adapter selon les besoins)
        pass
    
    try:
        bulletin = generer_bulletin_semestre(db, etudiant_id, session_id, semestre)
        return bulletin
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la génération du bulletin: {str(e)}"
        )


@router.get("/etudiant/{etudiant_id}/annuel", summary="Bulletin annuel")
async def get_bulletin_annuel(
    etudiant_id: int,
    annee_id: int = Query(..., description="ID de l'année académique"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère le bulletin annuel d'un étudiant.
    
    L'étudiant peut consulter son propre bulletin.
    """
    # Vérifier l'accès
    if not verifier_acces_etudiant(current_user, etudiant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas accès à ce bulletin"
        )
    
    # Vérifier que l'étudiant existe
    etudiant = etudiant_repository.get_by_id(db, etudiant_id)
    if not etudiant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Étudiant non trouvé"
        )
    
    try:
        bulletin = generer_bulletin_annuel(db, etudiant_id, annee_id)
        return bulletin
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la génération du bulletin: {str(e)}"
        )


@router.get("/etudiant/{etudiant_id}/releve-notes", summary="Relevé de notes")
async def get_releve_notes(
    etudiant_id: int,
    annee_id: Optional[int] = Query(None, description="ID de l'année académique"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère le relevé de notes complet d'un étudiant.
    
    L'étudiant peut consulter son propre relevé.
    """
    # Vérifier l'accès
    if not verifier_acces_etudiant(current_user, etudiant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas accès à ce relevé"
        )
    
    # Vérifier que l'étudiant existe
    etudiant = etudiant_repository.get_by_id(db, etudiant_id)
    if not etudiant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Étudiant non trouvé"
        )
    
    try:
        releve = generer_releve_notes(db, etudiant_id, annee_id)
        return releve
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la génération du relevé: {str(e)}"
        )


@router.get("/etudiant/{etudiant_id}/attestation-reussite", summary="Attestation de réussite")
async def get_attestation_reussite(
    etudiant_id: int,
    annee_id: int = Query(..., description="ID de l'année académique"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Génère une attestation de réussite pour un étudiant.
    
    L'étudiant peut consulter sa propre attestation.
    """
    # Vérifier l'accès
    if not verifier_acces_etudiant(current_user, etudiant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas accès à cette attestation"
        )
    
    # Vérifier que l'étudiant existe
    etudiant = etudiant_repository.get_by_id(db, etudiant_id)
    if not etudiant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Étudiant non trouvé"
        )
    
    # Vérifier que l'étudiant a réussi
    resultats = resultat_annuel_repository.get_by_etudiant(db, etudiant_id, annee_id=annee_id)
    if not resultats:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucun résultat trouvé pour cette année"
        )
    
    resultat = resultats[0]
    if resultat.decision != "admis":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="L'étudiant n'a pas réussi cette année académique"
        )
    
    return {
        "etudiant": {
            "id": etudiant.id,
            "matricule": etudiant.matricule,
            "nom": etudiant.nom,
            "prenom": etudiant.prenom,
            "date_naissance": str(etudiant.date_naissance) if etudiant.date_naissance else None,
            "lieu_naissance": etudiant.lieu_naissance,
        },
        "resultat": {
            "moyenne_annuelle": resultat.moyenne_annuelle,
            "mention": resultat.mention,
            "decision": resultat.decision,
            "total_credits_obtenus": resultat.total_credits_obtenus,
        },
        "attestation": {
            "type": "attestation_reussite",
            "annee_academique_id": annee_id,
            "niveau_id": resultat.niveau_id,
        }
    }


@router.get("/etudiant/{etudiant_id}/download/bulletin-semestre", summary="Télécharger bulletin semestriel PDF")
async def download_bulletin_semestre(
    etudiant_id: int,
    session_id: int = Query(..., description="ID de la session"),
    semestre: int = Query(..., ge=1, le=2, description="Numéro du semestre"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Télécharge le bulletin semestriel en PDF.
    """
    # Vérifier l'accès
    if not verifier_acces_etudiant(current_user, etudiant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas accès à ce bulletin"
        )
    
    # Vérifier que l'étudiant existe
    etudiant = etudiant_repository.get_by_id(db, etudiant_id)
    if not etudiant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Étudiant non trouvé"
        )
    
    try:
        # Générer les données du bulletin
        bulletin_data = generer_bulletin_semestre(db, etudiant_id, session_id, semestre)
        
        # Générer le PDF
        pdf_bytes = generer_bulletin_pdf(bulletin_data, "semestre")
        
        # Retourner le PDF
        filename = f"bulletin_S{semestre}_{etudiant.matricule}.pdf"
        return StreamingResponse(
            BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la génération du PDF: {str(e)}"
        )


@router.get("/etudiant/{etudiant_id}/download/bulletin-annuel", summary="Télécharger bulletin annuel PDF")
async def download_bulletin_annuel(
    etudiant_id: int,
    annee_id: int = Query(..., description="ID de l'année académique"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Télécharge le bulletin annuel en PDF.
    """
    # Vérifier l'accès
    if not verifier_acces_etudiant(current_user, etudiant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas accès à ce bulletin"
        )
    
    # Vérifier que l'étudiant existe
    etudiant = etudiant_repository.get_by_id(db, etudiant_id)
    if not etudiant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Étudiant non trouvé"
        )
    
    try:
        # Générer les données du bulletin
        bulletin_data = generer_bulletin_annuel(db, etudiant_id, annee_id)
        
        # Générer le PDF
        pdf_bytes = generer_bulletin_pdf(bulletin_data, "annuel")
        
        # Retourner le PDF
        filename = f"bulletin_annuel_{etudiant.matricule}.pdf"
        return StreamingResponse(
            BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la génération du PDF: {str(e)}"
        )
