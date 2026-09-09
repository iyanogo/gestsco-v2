"""Snapshots légers pour le trail d'audit (sans données sensibles)."""

from __future__ import annotations

from decimal import Decimal
from typing import Any

from app.models.deliberation import Deliberation
from app.models.etudiant import Etudiant
from app.models.examen import Examen
from app.models.facture import Facture
from app.models.inscription import Inscription
from app.models.note import Note
from app.models.paiement_facture import PaiementFacture
from app.models.remise import Remise


def _json_value(value: Any) -> Any:
    if isinstance(value, Decimal):
        return float(value)
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return value


def inscription_snapshot(inscription: Inscription) -> dict[str, Any]:
    return {
        "etudiant_id": inscription.etudiant_id,
        "filiere_id": inscription.filiere_id,
        "niveau_id": inscription.niveau_id,
        "annee_academique": inscription.annee_academique,
        "statut_inscription": inscription.statut_inscription,
        "type_inscription": inscription.type_inscription,
        "is_active": inscription.is_active,
    }


def etudiant_snapshot(etudiant: Etudiant) -> dict[str, Any]:
    return {
        "matricule": etudiant.matricule,
        "nom": etudiant.nom,
        "prenom": etudiant.prenom,
        "email": etudiant.email,
        "statut": etudiant.statut,
        "is_active": etudiant.is_active,
    }


def facture_snapshot(facture: Facture) -> dict[str, Any]:
    return {
        "numero_facture": facture.numero_facture,
        "etudiant_id": facture.etudiant_id,
        "montant_total": _json_value(facture.montant_total),
        "montant_paye": _json_value(facture.montant_paye),
        "statut": facture.statut,
        "type_facture": facture.type_facture,
    }


def paiement_snapshot(paiement: PaiementFacture) -> dict[str, Any]:
    return {
        "numero_paiement": paiement.numero_paiement,
        "facture_id": paiement.facture_id,
        "etudiant_id": paiement.etudiant_id,
        "montant": _json_value(paiement.montant),
        "mode_paiement": paiement.mode_paiement,
        "statut": paiement.statut,
    }


def remise_snapshot(remise: Remise) -> dict[str, Any]:
    return {
        "code": remise.code,
        "libelle": remise.libelle,
        "type_remise": remise.type_remise,
        "valeur": _json_value(remise.valeur),
        "is_active": remise.is_active,
    }


def fields_snapshot(obj: Any, *field_names: str) -> dict[str, Any]:
    """Snapshot générique par liste de champs ORM."""
    if obj is None:
        return {}
    return {
        name: _json_value(getattr(obj, name, None))
        for name in field_names
        if hasattr(obj, name)
    }


def note_snapshot(note: Note) -> dict[str, Any]:
    return {
        "examen_id": note.examen_id,
        "etudiant_id": note.etudiant_id,
        "note": note.note,
        "note_sur_20": note.note_sur_20,
        "statut_presence": note.statut_presence,
        "is_valide": note.is_valide,
    }


def examen_snapshot(examen: Examen) -> dict[str, Any]:
    return {
        "session_id": examen.session_id,
        "matiere_id": examen.matiere_id,
        "niveau_id": examen.niveau_id,
        "type_evaluation": examen.type_evaluation,
        "statut": examen.statut,
        "coefficient": examen.coefficient,
    }


def deliberation_snapshot(deliberation: Deliberation) -> dict[str, Any]:
    return {
        "session_id": deliberation.session_id,
        "niveau_id": deliberation.niveau_id,
        "filiere_id": deliberation.filiere_id,
        "type_deliberation": deliberation.type_deliberation,
        "statut": deliberation.statut,
        "publiee": deliberation.publiee,
        "nombre_admis": deliberation.nombre_admis,
        "nombre_ajournes": deliberation.nombre_ajournes,
    }
