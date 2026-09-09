"""Tests du module PDF partagé et exports."""

from datetime import date, datetime

import pytest
from reportlab.platypus import Paragraph, Spacer

from app.utils.pdf_generator import (
    PDFGenerationError,
    build_reportlab_pdf,
    create_title_style,
    html_to_pdf,
    is_pdf_bytes,
)
from app.utils.pdf_formatters import (
    format_seance_edt_cell,
    format_statut_facture,
    pdf_display_value,
    sanitize_html_for_pdf,
)


def _seed_annee_academique(db):
    from app.models.annee_academique import AnneeAcademique

    annee = AnneeAcademique(
        code="2025-2026",
        libelle="Année 2025-2026",
        date_debut=date(2025, 9, 1),
        date_fin=date(2026, 8, 31),
        date_debut_inscriptions=date(2025, 7, 1),
        date_fin_inscriptions=date(2025, 9, 30),
        is_active=True,
        is_current=True,
        statut="en_cours",
    )
    db.add(annee)
    db.commit()
    db.refresh(annee)
    return annee


def _seed_etudiant(db):
    from app.models.etudiant import Etudiant

    etudiant = Etudiant(nom="Dupont", prenom="Jean", matricule="ETU-PDF-001")
    db.add(etudiant)
    db.commit()
    db.refresh(etudiant)
    return etudiant


def _seed_facture(db, etudiant, annee):
    from app.models.facture import Facture

    facture = Facture(
        numero_facture="FAC-2026-PDF-001",
        etudiant_id=etudiant.id,
        annee_academique_id=annee.id,
        date_emission=date.today(),
        date_echeance=date(2026, 12, 31),
        montant_total=150000,
        montant_paye=0,
        montant_restant=150000,
        devise="XOF",
        statut="en_attente",
        type_facture="scolarite",
    )
    db.add(facture)
    db.commit()
    db.refresh(facture)
    return facture


def _seed_paiement(db, facture, etudiant):
    from app.models.paiement_facture import PaiementFacture

    paiement = PaiementFacture(
        numero_paiement="PAY-PDF-001",
        numero_recu="RECU-2026-PDF-001",
        facture_id=facture.id,
        etudiant_id=etudiant.id,
        date_paiement=datetime.utcnow(),
        montant=75000,
        devise="XOF",
        mode_paiement="especes",
        statut="valide",
    )
    db.add(paiement)
    db.commit()
    db.refresh(paiement)
    return paiement


def _seed_emploi_temps(db, annee):
    from app.models.emploi_temps import EmploiTemps
    from app.models.niveau import Niveau

    niveau = Niveau(id=1, code="L1", libelle="Licence 1")
    db.add(niveau)
    db.flush()

    emploi = EmploiTemps(
        code="EDT-PDF-001",
        libelle="EDT L1 S1",
        niveau_id=niveau.id,
        semestre=1,
        annee_academique_id=annee.id,
        date_debut=date(2025, 9, 1),
        date_fin=date(2026, 1, 31),
        statut="publie",
    )
    db.add(emploi)
    db.commit()
    db.refresh(emploi)
    return emploi


class TestPdfGeneratorUnit:
    def test_is_pdf_bytes_valid(self):
        assert is_pdf_bytes(b"%PDF-1.4 fake content")

    def test_is_pdf_bytes_invalid(self):
        assert not is_pdf_bytes(b"not a pdf")

    def test_build_reportlab_pdf_produces_valid_pdf(self):
        title = create_title_style()
        pdf = build_reportlab_pdf([Paragraph("Test GestSco PDF", title), Spacer(1, 12)])
        assert is_pdf_bytes(pdf)
        assert len(pdf) > 100

    def test_html_to_pdf_simple(self):
        html = "<html><body><h1>Attestation test</h1><p>Contenu</p></body></html>"
        pdf = html_to_pdf(html)
        assert is_pdf_bytes(pdf)
        assert len(pdf) > 200

    def test_html_to_pdf_empty_raises(self):
        with pytest.raises(PDFGenerationError):
            html_to_pdf("   ")

    def test_sanitize_html_removes_empty_logo(self):
        html = '<html><body><img src="" alt="Logo"/><p>Contenu</p></body></html>'
        cleaned = sanitize_html_for_pdf(html)
        assert "<img" not in cleaned
        assert "Contenu" in cleaned

    def test_sanitize_html_removes_unreplaced_logo_var(self):
        html = '<html><body><img src="{{ logo_url }}" alt="Logo"/><p>OK</p></body></html>'
        cleaned = sanitize_html_for_pdf(html)
        assert "<img" not in cleaned

    def test_format_statut_facture_humanized(self):
        assert format_statut_facture("partiellement_payee") == "Partiellement payée"

    def test_format_seance_edt_cell_no_none(self):
        cell = format_seance_edt_cell(
            {"matiere_libelle": "Algèbre", "type_seance": "cours", "salle_code": None}
        )
        assert "None" not in cell
        assert "-" in cell
        assert "Algèbre" in cell
        assert "CO -" in cell


class TestTemplatePdfEndpoint:
    def test_export_template_pdf(
        self, client, admin_token: str, db
    ):
        from app.models.template_document import TemplateDocument

        tpl = TemplateDocument(
            code="PDF_TEST_TPL",
            libelle="Template PDF test",
            type_document="autre",
            template_html="<h1>{{ nom }}</h1><p>Document test</p>",
            format_papier="A4",
            orientation="portrait",
        )
        db.add(tpl)
        db.commit()
        db.refresh(tpl)

        response = client.post(
            f"/api/v1/templates/{tpl.id}/pdf",
            json={"variables": {"nom": "Dupont"}},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200, response.text
        assert response.headers["content-type"] == "application/pdf"
        assert is_pdf_bytes(response.content)
        assert len(response.content) > 200


class TestFinancesPdfEndpoints:
    def test_export_facture_pdf(self, client, admin_token: str, db):
        annee = _seed_annee_academique(db)
        etudiant = _seed_etudiant(db)
        facture = _seed_facture(db, etudiant, annee)

        response = client.get(
            f"/api/v1/factures/{facture.id}/pdf",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200, response.text
        assert response.headers["content-type"] == "application/pdf"
        assert is_pdf_bytes(response.content)
        assert len(response.content) > 200

    def test_export_recu_paiement_pdf(self, client, admin_token: str, db):
        annee = _seed_annee_academique(db)
        etudiant = _seed_etudiant(db)
        facture = _seed_facture(db, etudiant, annee)
        paiement = _seed_paiement(db, facture, etudiant)

        response = client.get(
            f"/api/v1/paiements-factures/{paiement.id}/recu",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200, response.text
        assert response.headers["content-type"] == "application/pdf"
        assert is_pdf_bytes(response.content)
        assert len(response.content) > 200


class TestEmploiTempsPdfEndpoint:
    def test_export_emploi_temps_pdf(self, client, admin_token: str, db):
        annee = _seed_annee_academique(db)
        emploi = _seed_emploi_temps(db, annee)

        response = client.get(
            f"/api/v1/emplois-temps/{emploi.id}/export/pdf",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200, response.text
        assert response.headers["content-type"] == "application/pdf"
        assert is_pdf_bytes(response.content)
        assert len(response.content) > 200
