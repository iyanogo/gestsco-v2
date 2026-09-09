"""
Helpers d'affichage partagés pour la génération PDF (reportlab et templates HTML).
"""

from __future__ import annotations

import re
from datetime import date, datetime
from typing import Any, Optional

PDF_EMPTY_PLACEHOLDER = "-"

STATUTS_FACTURE_LABELS: dict[str, str] = {
    "en_attente": "En attente",
    "partiellement_payee": "Partiellement payée",
    "payee": "Payée",
    "annulee": "Annulée",
    "expiree": "Expirée",
}

TYPE_SEANCE_ABBREVIATIONS: dict[str, str] = {
    "cours": "CO",
    "td": "TD",
    "tp": "TP",
    "examen": "EX",
    "soutenance": "SO",
}


def pdf_display_value(value: Any, placeholder: str = PDF_EMPTY_PLACEHOLDER) -> str:
    """Affiche une valeur PDF ou un placeholder si vide/None."""
    if value is None:
        return placeholder
    text = str(value).strip()
    if not text or text.lower() == "none":
        return placeholder
    return text


def format_date_fr(value: Any, placeholder: str = PDF_EMPTY_PLACEHOLDER) -> str:
    """Formate une date en jj/mm/aaaa (évite le format ISO brut)."""
    if value is None:
        return placeholder
    if isinstance(value, datetime):
        value = value.date()
    if isinstance(value, date):
        return value.strftime("%d/%m/%Y")
    if isinstance(value, str):
        stripped = value.strip()
        if not stripped:
            return placeholder
        try:
            return date.fromisoformat(stripped[:10]).strftime("%d/%m/%Y")
        except ValueError:
            return stripped
    return str(value)


def format_statut_facture(statut: str) -> str:
    """Libellé lisible d'un statut de facture (aligné frontend STATUTS_FACTURE)."""
    if not statut:
        return PDF_EMPTY_PLACEHOLDER
    return STATUTS_FACTURE_LABELS.get(statut, statut.replace("_", " ").capitalize())


def format_type_seance_abbr(type_seance: Optional[str]) -> str:
    """Abréviation du type de séance pour la grille EDT."""
    if not type_seance:
        return PDF_EMPTY_PLACEHOLDER
    key = type_seance.strip().lower()
    return TYPE_SEANCE_ABBREVIATIONS.get(key, key[:2].upper())


def format_seance_edt_cell(seance: dict[str, Any]) -> str:
    """Contenu texte d'une cellule de grille EDT (PDF / Excel)."""
    matiere = pdf_display_value(
        seance.get("matiere_libelle") or seance.get("matiere_code")
    )
    type_s = format_type_seance_abbr(seance.get("type_seance"))
    salle = pdf_display_value(
        seance.get("salle_code") or seance.get("salle_libelle")
    )
    return f"{matiere}\n{type_s} - {salle}"


def sanitize_html_for_pdf(html: str) -> str:
    """
    Nettoie le HTML avant conversion PDF.

    - Supprime les balises <img> sans src valide (évite erreurs xhtml2pdf silencieuses).
    """
    if not html:
        return html

    def _is_valid_src(match: re.Match[str]) -> bool:
        src = match.group(1).strip()
        return bool(src) and src.lower() not in ("none", "null", "{{ logo_url }}")

    pattern = re.compile(
        r'<img\b[^>]*\ssrc=(["\'])(.*?)\1[^>]*/?\s*>',
        re.IGNORECASE | re.DOTALL,
    )

    def _replace_img(match: re.Match[str]) -> str:
        src = match.group(2).strip()
        if not src or src.lower() in ("none", "null") or "{{" in src:
            return ""
        return match.group(0)

    return pattern.sub(_replace_img, html)
