"""
Endpoints API pour la gestion des présences
"""
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.core.permissions import get_current_scolarite_user
from app.models.user import User
from app.repositories.presence_repository import presence_repository
from app.schemas.presence import (
    Presence,
    PresenceCreate,
    PresenceUpdate,
    PresenceWithEtudiant,
    PresenceBulkCreate,
    StatistiquesPresence,
)

router = APIRouter(prefix="/presences", tags=["Présences"])


@router.get("/", response_model=List[Presence])
def get_presences(
    skip: int = 0,
    limit: int = 100,
    seance_id: Optional[int] = None,
    etudiant_id: Optional[int] = None,
    date_debut: Optional[date] = None,
    date_fin: Optional[date] = None,
    statut: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Liste toutes les présences avec filtres"""
    if seance_id:
        return presence_repository.get_by_seance(db, seance_id)
    
    if etudiant_id:
        return presence_repository.get_by_etudiant(db, etudiant_id, date_debut, date_fin)
    
    return presence_repository.get_all(db, skip=skip, limit=limit)


@router.get("/seance/{seance_id}")
def get_presences_seance(
    seance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Présences d'une séance avec infos étudiant"""
    presences = presence_repository.get_by_seance(db, seance_id)
    
    result = []
    for presence in presences:
        etudiant = presence.etudiant
        result.append({
            "id": presence.id,
            "seance_id": presence.seance_id,
            "etudiant_id": presence.etudiant_id,
            "statut": presence.statut,
            "heure_arrivee": presence.heure_arrivee,
            "justificatif_url": presence.justificatif_url,
            "observation": presence.observation,
            "saisie_par": presence.saisie_par,
            "date_saisie": presence.date_saisie,
            "created_at": presence.created_at,
            "updated_at": presence.updated_at,
            "etudiant_nom": etudiant.nom if etudiant else None,
            "etudiant_prenom": etudiant.prenom if etudiant else None,
            "etudiant_matricule": etudiant.matricule if etudiant else None,
        })
    
    return result


@router.get("/etudiant/{etudiant_id}")
def get_presences_etudiant(
    etudiant_id: int,
    date_debut: Optional[date] = None,
    date_fin: Optional[date] = None,
    matiere_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Présences d'un étudiant"""
    presences = presence_repository.get_by_etudiant(db, etudiant_id, date_debut, date_fin)
    
    # Filtrer par matière si spécifié
    if matiere_id:
        presences = [p for p in presences if p.seance and p.seance.matiere_id == matiere_id]
    
    return presences


@router.get("/etudiant/{etudiant_id}/taux", response_model=StatistiquesPresence)
def get_taux_presence_etudiant(
    etudiant_id: int,
    matiere_id: Optional[int] = None,
    date_debut: Optional[date] = None,
    date_fin: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Taux de présence d'un étudiant"""
    return presence_repository.calculer_taux_presence_etudiant(
        db, etudiant_id, matiere_id, date_debut, date_fin
    )


@router.get("/statistiques/seance/{seance_id}")
def get_statistiques_seance(
    seance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Statistiques de présence d'une séance"""
    return presence_repository.get_statistiques_seance(db, seance_id)


@router.get("/absents-frequents")
def get_absents_frequents(
    niveau_id: int = Query(...),
    seuil_absence: int = Query(3),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user)
):
    """Étudiants avec absences fréquentes"""
    return presence_repository.get_etudiants_absents_frequents(db, niveau_id, seuil_absence)


@router.post("/", response_model=Presence, status_code=status.HTTP_201_CREATED)
def create_presence(
    presence_in: PresenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Crée une présence"""
    return presence_repository.create(db, presence_in)


@router.post("/bulk", status_code=status.HTTP_201_CREATED)
def create_presences_bulk(
    presences_data: PresenceBulkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Saisie en masse des présences"""
    presences = presence_repository.create_bulk(db, presences_data, current_user.id)
    return {
        "message": f"{len(presences)} présences enregistrées",
        "presences": presences
    }


@router.put("/{presence_id}", response_model=Presence)
def update_presence(
    presence_id: int,
    presence_in: PresenceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Met à jour une présence"""
    presence = presence_repository.get_by_id(db, presence_id)
    if not presence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Présence non trouvée"
        )
    return presence_repository.update(db, presence_id, presence_in)


@router.delete("/{presence_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_presence(
    presence_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user)
):
    """Supprime une présence"""
    presence = presence_repository.get_by_id(db, presence_id)
    if not presence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Présence non trouvée"
        )
    presence_repository.delete(db, presence_id)
    return None
