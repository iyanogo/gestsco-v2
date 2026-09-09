"""
Génération PDF partagée - GestSco v2.

Stratégie :
- **reportlab** : documents programmatiques (factures, reçus, grilles EDT, bulletins).
- **weasyprint** : conversion HTML→PDF fidèle (templates documents avec CSS, Linux/prod).
- **xhtml2pdf** : fallback pure Python si weasyprint indisponible (dev Windows).
"""

from __future__ import annotations

from io import BytesIO
from typing import Any, Optional, Sequence

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate
from sqlalchemy.orm import Session

from app.utils.pdf_formatters import sanitize_html_for_pdf


class PDFGenerationError(RuntimeError):
    """Erreur lors de la génération d'un PDF."""


def is_pdf_bytes(data: bytes) -> bool:
    """Vérifie que les octets commencent par la signature PDF."""
    return len(data) >= 4 and data[:4] == b"%PDF"


def get_active_etablissement_config(db: Session):
    """Retourne la première configuration établissement active (usage PDF)."""
    from app.models.configuration_etablissement import ConfigurationEtablissement

    return (
        db.query(ConfigurationEtablissement)
        .filter(ConfigurationEtablissement.is_active == True)
        .order_by(ConfigurationEtablissement.id)
        .first()
    )


def build_reportlab_pdf(
    elements: Sequence[Any],
    *,
    pagesize=A4,
    top_margin: float = 1 * cm,
    bottom_margin: float = 1 * cm,
    left_margin: float = 1 * cm,
    right_margin: float = 1 * cm,
    footer_text: Optional[str] = None,
) -> bytes:
    """Assemble un PDF reportlab à partir d'une liste de flowables."""
    if footer_text:
        bottom_margin = max(bottom_margin, 1.5 * cm)

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=pagesize,
        topMargin=top_margin,
        bottomMargin=bottom_margin,
        leftMargin=left_margin,
        rightMargin=right_margin,
    )

    def _draw_footer(canvas, document) -> None:
        if not footer_text:
            return
        canvas.saveState()
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(colors.grey)
        page_width, _ = pagesize
        y = 0.75 * cm
        canvas.drawString(left_margin, y, footer_text)
        canvas.drawRightString(page_width - right_margin, y, f"Page {document.page}")
        canvas.restoreState()

    doc.build(
        list(elements),
        onFirstPage=_draw_footer,
        onLaterPages=_draw_footer,
    ) if footer_text else doc.build(list(elements))
    buffer.seek(0)
    pdf_bytes = buffer.getvalue()
    if not is_pdf_bytes(pdf_bytes):
        raise PDFGenerationError("La génération reportlab n'a pas produit un PDF valide")
    return pdf_bytes


def create_title_style(
    font_size: int = 18,
    alignment=TA_CENTER,
    space_after: float = 20,
) -> ParagraphStyle:
    styles = getSampleStyleSheet()
    return ParagraphStyle(
        "GestScoTitle",
        parent=styles["Heading1"],
        fontSize=font_size,
        alignment=alignment,
        spaceAfter=space_after,
    )


def create_subtitle_style(
    font_size: int = 10,
    alignment=TA_CENTER,
    space_after: float = 20,
) -> ParagraphStyle:
    styles = getSampleStyleSheet()
    return ParagraphStyle(
        "GestScoSubtitle",
        parent=styles["Normal"],
        fontSize=font_size,
        alignment=alignment,
        spaceAfter=space_after,
    )


def create_body_style(font_size: int = 9) -> ParagraphStyle:
    styles = getSampleStyleSheet()
    return ParagraphStyle(
        "GestScoBody",
        parent=styles["Normal"],
        fontSize=font_size,
    )


def html_to_pdf(html: str) -> bytes:
    """
    Convertit du HTML en PDF.

    Ordre de préférence :
    1. **weasyprint** - rendu CSS fidèle (Linux/prod, dépendances Cairo/Pango).
    2. **xhtml2pdf** - fallback pure Python (dev Windows, CSS limité).
    """
    if not html.strip():
        raise PDFGenerationError("HTML vide - impossible de générer le PDF")

    html = sanitize_html_for_pdf(html)

    # 1. weasyprint (meilleure fidélité CSS - Linux/prod)
    try:
        from weasyprint import HTML  # type: ignore[import-untyped]

        pdf_bytes = HTML(string=html).write_pdf()
        if pdf_bytes and is_pdf_bytes(pdf_bytes):
            return pdf_bytes
    except Exception:
        pass

    # 2. xhtml2pdf (fallback Windows / env sans GTK)
    try:
        from io import BytesIO

        from xhtml2pdf import pisa  # type: ignore[import-untyped]

        result = BytesIO()
        status = pisa.CreatePDF(html, dest=result, encoding="utf-8")
        if status.err:
            raise PDFGenerationError("Échec de la conversion xhtml2pdf")
        pdf_bytes = result.getvalue()
        if pdf_bytes and is_pdf_bytes(pdf_bytes):
            return pdf_bytes
    except ImportError as exc:
        raise PDFGenerationError(
            "weasyprint (Linux/prod) ou xhtml2pdf requis pour convertir du HTML en PDF."
        ) from exc

    raise PDFGenerationError("Échec de la conversion HTML→PDF")
