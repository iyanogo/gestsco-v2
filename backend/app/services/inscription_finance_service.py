"""
Génération automatique de factures à partir d'une inscription validée.
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from app.models.annee_academique import AnneeAcademique
from app.models.facture import Facture
from app.models.inscription import Inscription
from app.repositories.facture_repository import facture_repository
from app.repositories.frais_scolarite_repository import frais_scolarite_repository
from app.schemas.facture import FactureCreate
from app.schemas.ligne_facture import LigneFactureCreate


def resolve_annee_academique_id(db: Session, annee_code: str) -> Optional[int]:
    """Résout l'ID LMD à partir du code/libellé stocké sur l'inscription."""
    annee = (
        db.query(AnneeAcademique)
        .filter(
            (AnneeAcademique.code == annee_code) | (AnneeAcademique.libelle == annee_code)
        )
        .first()
    )
    return annee.id if annee else None


def get_frais_for_inscription(
    db: Session,
    niveau_id: int,
    filiere_id: int,
    annee_id: int,
):
    """Frais par filière+niveau, repli sur niveau seul."""
    frais = frais_scolarite_repository.get_by_niveau_filiere(
        db, niveau_id, filiere_id, annee_id
    )
    if frais:
        return frais
    return frais_scolarite_repository.get_by_niveau(db, niveau_id, annee_id)


def facture_inscription_exists(
    db: Session,
    etudiant_id: int,
    annee_id: int,
    type_facture: str,
) -> bool:
    existing = (
        db.query(Facture)
        .filter(
            Facture.etudiant_id == etudiant_id,
            Facture.annee_academique_id == annee_id,
            Facture.type_facture == type_facture,
            Facture.statut != "annulee",
        )
        .first()
    )
    return existing is not None


def _build_facture_from_frais(
    db: Session,
    etudiant_id: int,
    annee_id: int,
    niveau_id: int,
    filiere_id: int,
    user_id: int,
    type_facture: str,
    description: str,
) -> Optional[Facture]:
    if facture_inscription_exists(db, etudiant_id, annee_id, type_facture):
        return None

    frais_list = get_frais_for_inscription(db, niveau_id, filiere_id, annee_id)
    if not frais_list:
        return None

    lignes = [
        LigneFactureCreate(
            libelle=frais.type_frais.libelle if frais.type_frais else f"Frais #{frais.id}",
            description=frais.description,
            quantite=1,
            prix_unitaire=frais.montant,
            tva_taux=0,
            frais_scolarite_id=frais.id,
        )
        for frais in frais_list
    ]

    facture_create = FactureCreate(
        etudiant_id=etudiant_id,
        annee_academique_id=annee_id,
        date_echeance=date.today() + timedelta(days=30),
        type_facture=type_facture,
        description=description,
        lignes=lignes,
    )
    return facture_repository.create_with_lignes(db, facture_create, user_id)


def generer_facture_automatique_from_inscription(
    db: Session,
    inscription: Inscription,
    user_id: int,
    type_facture: str = "inscription",
) -> Optional[Facture]:
    """
    Génère une facture d'inscription si des frais existent et qu'aucune facture active n'existe.

    Retourne None si année introuvable, frais absents ou facture déjà présente.
    """
    annee_id = resolve_annee_academique_id(db, inscription.annee_academique)
    if not annee_id:
        return None

    return _build_facture_from_frais(
        db,
        inscription.etudiant_id,
        annee_id,
        inscription.niveau_id,
        inscription.filiere_id,
        user_id,
        type_facture,
        f"Facture {type_facture} - inscription {inscription.annee_academique}",
    )


def generer_facture_automatique_for_etudiant(
    db: Session,
    etudiant_id: int,
    annee_id: int,
    user_id: int,
    type_facture: str = "scolarite",
    niveau_id: Optional[int] = None,
    filiere_id: Optional[int] = None,
) -> Optional[Facture]:
    """Génération manuelle (API) - résout niveau/filière via inscription si absent."""
    if niveau_id is None or filiere_id is None:
        inscription = (
            db.query(Inscription)
            .filter(Inscription.etudiant_id == etudiant_id)
            .order_by(Inscription.annee_academique.desc())
            .first()
        )
        if not inscription:
            return None
        niveau_id = niveau_id or inscription.niveau_id
        filiere_id = filiere_id or inscription.filiere_id

    return _build_facture_from_frais(
        db,
        etudiant_id,
        annee_id,
        niveau_id,
        filiere_id,
        user_id,
        type_facture,
        f"Facture {type_facture} générée automatiquement",
    )
