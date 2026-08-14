"""
Endpoints publics pour l'inscription en ligne
Ces endpoints sont accessibles sans authentification
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
import os
import uuid

from app.api.deps import get_db
from app.repositories.campagne_inscription_repository import campagne_inscription_repository
from app.repositories.dossier_candidature_repository import dossier_candidature_repository
from app.repositories.piece_jointe_repository import piece_jointe_repository
from app.repositories.paiement_repository import paiement_repository
from app.models.type_piece_requise import TypePieceRequise
from app.schemas.campagne_inscription import CampagneInscription
from app.schemas.dossier_candidature import DossierCandidature, DossierCandidatureCreate
from app.schemas.piece_jointe import PieceJointe, PieceJointeCreate
from app.schemas.paiement import Paiement, PaiementCreate
from app.schemas.type_piece_requise import TypePieceRequise as TypePieceRequiseSchema

router = APIRouter(prefix="/public/inscription", tags=["Inscription Publique"])

# Dossier de stockage des fichiers
UPLOAD_DIR = "uploads/pieces_jointes"


@router.get("/campagnes", response_model=list[CampagneInscription])
def list_campagnes_ouvertes(
    db: Session = Depends(get_db),
):
    """
    Liste les campagnes d'inscription ouvertes.
    Endpoint public - pas d'authentification requise.
    """
    return campagne_inscription_repository.get_ouvertes(db)


@router.get("/campagnes/{campagne_id}", response_model=CampagneInscription)
def get_campagne_details(
    campagne_id: int,
    db: Session = Depends(get_db),
):
    """
    Récupère les détails d'une campagne d'inscription.
    Endpoint public - pas d'authentification requise.
    """
    campagne = campagne_inscription_repository.get_by_id(db, campagne_id)
    if not campagne:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campagne non trouvée"
        )
    
    # Vérifier que la campagne est ouverte
    if not campagne.is_open():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cette campagne n'est pas ouverte aux inscriptions"
        )
    
    return campagne


@router.get("/campagnes/{campagne_id}/pieces-requises", response_model=list[TypePieceRequiseSchema])
def get_pieces_requises(
    campagne_id: int,
    db: Session = Depends(get_db),
):
    """
    Liste les pièces requises pour une campagne.
    Endpoint public - pas d'authentification requise.
    """
    campagne = campagne_inscription_repository.get_by_id(db, campagne_id)
    if not campagne:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campagne non trouvée"
        )
    
    pieces_requises = db.query(TypePieceRequise).filter(
        TypePieceRequise.campagne_id == campagne_id
    ).order_by(TypePieceRequise.ordre).all()
    
    return pieces_requises


@router.get("/campagnes/{campagne_id}/places-restantes")
def get_places_restantes(
    campagne_id: int,
    db: Session = Depends(get_db),
):
    """
    Récupère le nombre de places restantes pour une campagne.
    Endpoint public - pas d'authentification requise.
    """
    campagne = campagne_inscription_repository.get_by_id(db, campagne_id)
    if not campagne:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campagne non trouvée"
        )
    
    places_restantes = campagne_inscription_repository.get_places_restantes(db, campagne_id)
    
    return {
        "places_totales": campagne.nombre_places,
        "places_restantes": places_restantes
    }


@router.post("/dossiers", response_model=DossierCandidature, status_code=status.HTTP_201_CREATED)
def create_dossier_candidature(
    dossier_in: DossierCandidatureCreate,
    db: Session = Depends(get_db),
):
    """
    Crée un nouveau dossier de candidature.
    Endpoint public - pas d'authentification requise.
    """
    # Vérifier que la campagne existe et est ouverte
    campagne = campagne_inscription_repository.get_by_id(db, dossier_in.campagne_id)
    if not campagne:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campagne non trouvée"
        )
    
    if not campagne.is_open():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cette campagne n'est pas ouverte aux inscriptions"
        )
    
    # Vérifier s'il reste des places
    places_restantes = campagne_inscription_repository.get_places_restantes(db, campagne.id)
    if places_restantes is not None and places_restantes <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Il n'y a plus de places disponibles pour cette campagne"
        )
    
    # Vérifier si le candidat n'a pas déjà un dossier pour cette campagne
    existing = dossier_candidature_repository.get_by_email(db, dossier_in.candidat_email)
    for dossier in existing:
        if dossier.campagne_id == dossier_in.campagne_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vous avez déjà un dossier pour cette campagne"
            )
    
    return dossier_candidature_repository.create_with_numero(db, dossier_in)


@router.get("/dossiers/{numero}", response_model=DossierCandidature)
def get_dossier_by_numero(
    numero: str,
    db: Session = Depends(get_db),
):
    """
    Consulte un dossier de candidature par son numéro.
    Endpoint public - pas d'authentification requise.
    """
    dossier = dossier_candidature_repository.get_by_numero(db, numero)
    if not dossier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dossier non trouvé"
        )
    return dossier


@router.get("/dossiers/{numero}/details")
def get_dossier_details(
    numero: str,
    db: Session = Depends(get_db),
):
    """
    Consulte un dossier avec ses pièces jointes et paiements.
    Endpoint public - pas d'authentification requise.
    """
    dossier = dossier_candidature_repository.get_by_numero(db, numero)
    if not dossier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dossier non trouvé"
        )
    
    # Récupérer les détails
    dossier_details = dossier_candidature_repository.get_with_details(db, dossier.id)
    pieces = piece_jointe_repository.get_by_dossier(db, dossier.id)
    paiements = paiement_repository.get_by_dossier(db, dossier.id)
    montant_total = paiement_repository.get_montant_total_by_dossier(db, dossier.id)
    
    return {
        "dossier": dossier_details,
        "pieces_jointes": pieces,
        "paiements": paiements,
        "montant_total_paye": montant_total
    }


@router.post("/dossiers/{dossier_id}/pieces")
async def upload_piece_jointe(
    dossier_id: int,
    file: UploadFile = File(...),
    type_piece: str = Form(...),
    libelle: str = Form(...),
    db: Session = Depends(get_db),
):
    """
    Upload une pièce jointe pour un dossier.
    Endpoint public - pas d'authentification requise.
    """
    # Vérifier que le dossier existe
    dossier = dossier_candidature_repository.get_by_id(db, dossier_id)
    if not dossier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dossier non trouvé"
        )
    
    # Vérifier que le dossier n'est pas déjà soumis
    if dossier.statut_dossier not in ["en_cours"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible d'ajouter des pièces à un dossier déjà soumis"
        )
    
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
    
    # Vérifier si une pièce de ce type existe déjà pour ce dossier
    existing_piece = piece_jointe_repository.get_by_type(db, dossier_id, type_piece)
    if existing_piece:
        # Supprimer l'ancienne pièce
        piece_jointe_repository.hard_delete(db, existing_piece.id)
    
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
        "type_piece": piece.type_piece,
        "fichier_url": piece.fichier_url,
        "message": "Pièce jointe uploadée avec succès"
    }


@router.post("/dossiers/{dossier_id}/soumettre", response_model=DossierCandidature)
def soumettre_dossier(
    dossier_id: int,
    db: Session = Depends(get_db),
):
    """
    Soumet un dossier de candidature.
    Vérifie que toutes les pièces requises sont fournies.
    Endpoint public - pas d'authentification requise.
    """
    try:
        dossier = dossier_candidature_repository.soumettre_dossier(db, dossier_id)
        if not dossier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dossier non trouvé"
            )
        return dossier
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/paiements", response_model=Paiement, status_code=status.HTTP_201_CREATED)
def create_paiement(
    paiement_in: PaiementCreate,
    db: Session = Depends(get_db),
):
    """
    Enregistre un paiement pour un dossier.
    Endpoint public - pas d'authentification requise.
    """
    # Vérifier que le dossier existe
    if paiement_in.dossier_id:
        dossier = dossier_candidature_repository.get_by_id(db, paiement_in.dossier_id)
        if not dossier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dossier non trouvé"
            )
    
    return paiement_repository.create_with_numero(db, paiement_in)


@router.get("/paiements/dossier/{dossier_id}", response_model=list[Paiement])
def get_paiements_dossier(
    dossier_id: int,
    db: Session = Depends(get_db),
):
    """
    Liste les paiements d'un dossier.
    Endpoint public - pas d'authentification requise.
    """
    return paiement_repository.get_by_dossier(db, dossier_id)
