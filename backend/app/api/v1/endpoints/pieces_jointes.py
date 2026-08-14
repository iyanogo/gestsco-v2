"""
Endpoints API pour la gestion des pièces jointes
"""

import os
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user, get_current_scolarite_user
from app.models.user import User
from app.repositories.piece_jointe_repository import piece_jointe_repository
from app.schemas.piece_jointe import (
    PieceJointe,
    PieceJointeCreate,
)

router = APIRouter(prefix="/pieces-jointes", tags=["Pièces Jointes"])

# Dossier de stockage des fichiers
UPLOAD_DIR = "uploads/pieces_jointes"


class CommentaireRequest(BaseModel):
    commentaire: str | None = None


class RefusRequest(BaseModel):
    commentaire: str


@router.get("/dossier/{dossier_id}", response_model=list[PieceJointe])
def list_pieces_by_dossier(
    dossier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Liste les pièces jointes d'un dossier."""
    return piece_jointe_repository.get_by_dossier(db, dossier_id)


@router.post("/", response_model=PieceJointe, status_code=status.HTTP_201_CREATED)
def create_piece_jointe(
    piece_in: PieceJointeCreate,
    db: Session = Depends(get_db),
):
    """
    Ajoute une pièce jointe à un dossier.
    Endpoint public - pas d'authentification requise.
    """
    return piece_jointe_repository.create(db, piece_in)


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    dossier_id: int = Form(...),
    type_piece: str = Form(...),
    libelle: str = Form(...),
    db: Session = Depends(get_db),
):
    """
    Upload un fichier et crée une pièce jointe.
    Endpoint public - pas d'authentification requise.
    """
    # Créer le dossier de stockage s'il n'existe pas
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    # Générer un nom de fichier unique
    file_extension = os.path.splitext(file.filename)[1] if file.filename else ""
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Sauvegarder le fichier
    try:
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'upload du fichier: {str(e)}"
        )
    
    # Créer la pièce jointe en base
    piece_data = PieceJointeCreate(
        dossier_id=dossier_id,
        type_piece=type_piece,
        libelle=libelle,
        fichier_url=f"/{UPLOAD_DIR}/{unique_filename}",
        format_fichier=file_extension.lstrip(".") if file_extension else None,
        taille_fichier=len(contents),
        is_required=True
    )
    
    piece = piece_jointe_repository.create(db, piece_data)
    
    return {
        "id": piece.id,
        "fichier_url": piece.fichier_url,
        "message": "Fichier uploadé avec succès"
    }


@router.patch("/{piece_id}/valider", response_model=PieceJointe)
def valider_piece(
    piece_id: int,
    request: CommentaireRequest = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """Valide une pièce jointe."""
    commentaire = request.commentaire if request else None
    piece = piece_jointe_repository.valider_piece(db, piece_id, commentaire)
    if not piece:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pièce jointe non trouvée"
        )
    return piece


@router.patch("/{piece_id}/refuser", response_model=PieceJointe)
def refuser_piece(
    piece_id: int,
    request: RefusRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """Refuse une pièce jointe."""
    piece = piece_jointe_repository.refuser_piece(db, piece_id, request.commentaire)
    if not piece:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pièce jointe non trouvée"
        )
    return piece


@router.delete("/{piece_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_piece(
    piece_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Supprime une pièce jointe."""
    # Récupérer la pièce pour supprimer le fichier
    piece = piece_jointe_repository.get_by_id(db, piece_id)
    if not piece:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pièce jointe non trouvée"
        )
    
    # Supprimer le fichier physique si existe
    if piece.fichier_url:
        file_path = piece.fichier_url.lstrip("/")
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass  # Ignorer les erreurs de suppression de fichier
    
    # Supprimer l'enregistrement
    success = piece_jointe_repository.hard_delete(db, piece_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pièce jointe non trouvée"
        )
    return None
