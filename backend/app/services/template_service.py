import re
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.repositories.template_document_repository import template_document_repository
from app.repositories.modele_email_repository import modele_email_repository
from app.repositories.modele_sms_repository import modele_sms_repository
from app.utils.pdf_generator import html_to_pdf, PDFGenerationError, get_active_etablissement_config


def enrich_template_variables(
    db: Session,
    variables: Dict[str, Any],
    etablissement_id: Optional[int] = None,
) -> Dict[str, Any]:
    """Complète les variables template avec la configuration établissement active."""
    merged = dict(variables)
    config = None
    if etablissement_id:
        from app.repositories.configuration_etablissement_repository import (
            configuration_etablissement_repository,
        )

        config = configuration_etablissement_repository.get_active(db, etablissement_id)
    if not config:
        config = get_active_etablissement_config(db)

    if not config:
        merged.setdefault("logo_url", "")
        return merged

    defaults = {
        "logo_url": config.logo_url or "",
        "nom_etablissement": config.nom_complet,
        "sigle_etablissement": config.sigle or config.nom_court,
        "adresse_etablissement": config.adresse_complete or "",
        "telephone_etablissement": config.telephone_principal or "",
        "email_etablissement": config.email_principal or config.email_scolarite or "",
        "ville": config.ville or "",
    }
    for key, value in defaults.items():
        if key not in merged or merged.get(key) in (None, ""):
            merged[key] = value
    return merged


def render_document(db: Session, code_template: str, variables: Dict[str, Any], etablissement_id: Optional[int] = None) -> str:
    """Génère le HTML à partir du template"""
    template = template_document_repository.get_by_code(db, code_template, etablissement_id)
    if not template:
        return ""
    
    enriched = enrich_template_variables(db, variables, etablissement_id)
    return template_document_repository.render_template(db, template.id, enriched)


def render_document_pdf(db: Session, code_template: str, variables: Dict[str, Any], etablissement_id: Optional[int] = None) -> bytes:
    """Génère un PDF à partir du template HTML (weasyprint)."""
    html = render_document(db, code_template, variables, etablissement_id)
    if not html:
        return b""
    return html_to_pdf(html)


def render_email(db: Session, code_modele: str, variables: Dict[str, Any], etablissement_id: Optional[int] = None) -> Dict[str, str]:
    """Génère un email à partir du modèle"""
    modele = modele_email_repository.get_by_code(db, code_modele, etablissement_id)
    if not modele:
        return {"objet": "", "corps_html": "", "corps_texte": ""}
    
    return modele_email_repository.render_email(db, modele.id, variables)


def render_sms(db: Session, code_modele: str, variables: Dict[str, Any], etablissement_id: Optional[int] = None) -> str:
    """Génère un SMS à partir du modèle"""
    modele = modele_sms_repository.get_by_code(db, code_modele, etablissement_id)
    if not modele:
        return ""
    
    result = modele_sms_repository.render_sms(db, modele.id, variables)
    return result.get("message", "")


def get_variables_disponibles(type_document: str) -> list:
    """Retourne la liste des variables disponibles pour un type de document"""
    variables_communes = [
        {"nom": "date_jour", "description": "Date du jour"},
        {"nom": "annee_academique", "description": "Année académique en cours"},
        {"nom": "nom_etablissement", "description": "Nom de l'établissement"},
        {"nom": "sigle_etablissement", "description": "Sigle de l'établissement"},
        {"nom": "adresse_etablissement", "description": "Adresse de l'établissement"},
        {"nom": "telephone_etablissement", "description": "Téléphone de l'établissement"},
        {"nom": "email_etablissement", "description": "Email de l'établissement"},
        {"nom": "logo_url", "description": "URL du logo"},
    ]
    
    variables_etudiant = [
        {"nom": "matricule", "description": "Matricule de l'étudiant"},
        {"nom": "nom_etudiant", "description": "Nom de l'étudiant"},
        {"nom": "prenom_etudiant", "description": "Prénom de l'étudiant"},
        {"nom": "nom_complet", "description": "Nom complet de l'étudiant"},
        {"nom": "date_naissance", "description": "Date de naissance"},
        {"nom": "lieu_naissance", "description": "Lieu de naissance"},
        {"nom": "filiere", "description": "Filière de l'étudiant"},
        {"nom": "niveau", "description": "Niveau de l'étudiant"},
        {"nom": "email_etudiant", "description": "Email de l'étudiant"},
    ]
    
    variables_notes = [
        {"nom": "moyenne_generale", "description": "Moyenne générale"},
        {"nom": "mention", "description": "Mention obtenue"},
        {"nom": "rang", "description": "Rang de l'étudiant"},
        {"nom": "credits_obtenus", "description": "Crédits obtenus"},
        {"nom": "credits_total", "description": "Total des crédits"},
        {"nom": "decision", "description": "Décision du jury"},
    ]
    
    variables_finance = [
        {"nom": "numero_facture", "description": "Numéro de facture"},
        {"nom": "date_facture", "description": "Date de la facture"},
        {"nom": "montant_total", "description": "Montant total"},
        {"nom": "montant_paye", "description": "Montant payé"},
        {"nom": "montant_restant", "description": "Montant restant"},
        {"nom": "date_echeance", "description": "Date d'échéance"},
        {"nom": "numero_recu", "description": "Numéro de reçu"},
        {"nom": "mode_paiement", "description": "Mode de paiement"},
    ]
    
    if type_document in ["bulletin", "releve_notes", "attestation"]:
        return variables_communes + variables_etudiant + variables_notes
    elif type_document in ["facture", "recu"]:
        return variables_communes + variables_etudiant + variables_finance
    elif type_document == "certificat":
        return variables_communes + variables_etudiant
    else:
        return variables_communes + variables_etudiant
