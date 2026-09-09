"""
Génère 3 PDF réels (facture, EDT, template) pour revue visuelle en dev.
Usage: python scripts/generate_pdf_preview_samples.py
"""
from __future__ import annotations

import json
import os
import sys
from datetime import date, datetime, time
from decimal import Decimal
from pathlib import Path

# backend/ on PYTHONPATH
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.annee_academique import AnneeAcademique
from app.models.creneau_horaire import CreneauHoraire
from app.models.emploi_temps import EmploiTemps
from app.models.etudiant import Etudiant
from app.models.facture import Facture
from app.models.ligne_facture import LigneFacture
from app.models.matiere import Matiere
from app.models.niveau import Niveau
from app.models.seance import Seance
from app.models.template_document import TemplateDocument
from app.models.user import User
from app.scripts.init_templates import TEMPLATES_DEFAUT
from app.services.emploi_temps_service import generer_emploi_temps_pdf
from app.services.facture_service import generer_facture_pdf
from app.services.template_service import render_document_pdf
from app.utils.pdf_generator import html_to_pdf, is_pdf_bytes


OUTPUT_DIR = Path(os.environ.get("TEMP", "/tmp")) / "gestsco-pdf-review"
SAMPLE_PREFIX = "PDF_PREVIEW_"


def _ensure_facture(db: Session) -> Facture:
    existing = (
        db.query(Facture)
        .filter(Facture.numero_facture.like(f"{SAMPLE_PREFIX}%"))
        .first()
    )
    if existing:
        return existing

    etudiant = db.query(Etudiant).filter(Etudiant.matricule == "E2E-MANUAL-001").first()
    if not etudiant:
        etudiant = db.query(Etudiant).first()
    if not etudiant:
        etudiant = Etudiant(nom="Kaboré", prenom="Aminata", matricule="ETU-2026-0042")
        db.add(etudiant)
        db.flush()

    annee = db.query(AnneeAcademique).filter(AnneeAcademique.is_current == True).first()
    if not annee:
        annee = db.query(AnneeAcademique).first()
    if not annee:
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
        db.flush()

    facture = Facture(
        numero_facture=f"{SAMPLE_PREFIX}FAC-2026-00001",
        etudiant_id=etudiant.id,
        annee_academique_id=annee.id,
        date_emission=date(2026, 3, 1),
        date_echeance=date(2026, 3, 31),
        montant_total=Decimal("185000"),
        montant_paye=Decimal("50000"),
        montant_restant=Decimal("135000"),
        devise="XOF",
        statut="partiellement_payee",
        type_facture="scolarite",
        description="Frais de scolarité semestre 1",
    )
    db.add(facture)
    db.flush()

    lignes = [
        ("Frais d'inscription", 1, 25000, 0),
        ("Scolarité semestre 1", 1, 150000, 0),
        ("Assurance étudiante", 1, 10000, 0),
    ]
    for libelle, qte, prix, tva in lignes:
        montant_ligne = Decimal(str(prix)) * qte
        tva_m = montant_ligne * Decimal(str(tva)) / 100
        db.add(
            LigneFacture(
                facture_id=facture.id,
                libelle=libelle,
                quantite=qte,
                prix_unitaire=Decimal(str(prix)),
                montant_ligne=montant_ligne,
                tva_taux=Decimal(str(tva)),
                tva_montant=tva_m,
                montant_ttc=montant_ligne + tva_m,
            )
        )
    db.commit()
    db.refresh(facture)
    return facture


def _ensure_creneaux(db: Session) -> list[CreneauHoraire]:
    creneaux = (
        db.query(CreneauHoraire)
        .filter(CreneauHoraire.is_active == True)
        .order_by(CreneauHoraire.ordre)
        .all()
    )
    if len(creneaux) >= 2:
        return creneaux

    defaults = [
        ("M1", "Matin 1 : 08h-10h", time(8, 0), time(10, 0), "matin", 1),
        ("M2", "Matin 2 : 10h-12h", time(10, 0), time(12, 0), "matin", 2),
        ("S1", "Après-midi 1 : 14h-16h", time(14, 0), time(16, 0), "apres_midi", 3),
    ]
    for code, libelle, hd, hf, periode, ordre in defaults:
        if not db.query(CreneauHoraire).filter(CreneauHoraire.code == code).first():
            c = CreneauHoraire(
                code=code,
                libelle=libelle,
                heure_debut=hd,
                heure_fin=hf,
                periode=periode,
                ordre=ordre,
                duree_minutes=120,
                is_active=True,
            )
            db.add(c)
    db.commit()
    return (
        db.query(CreneauHoraire)
        .filter(CreneauHoraire.is_active == True)
        .order_by(CreneauHoraire.ordre)
        .all()
    )


def _ensure_emploi_temps(db: Session) -> EmploiTemps:
    existing = (
        db.query(EmploiTemps)
        .filter(EmploiTemps.code == f"{SAMPLE_PREFIX}EDT-L1-S1")
        .first()
    )
    if existing:
        return existing

    annee = db.query(AnneeAcademique).filter(AnneeAcademique.is_current == True).first()
    if not annee:
        annee = db.query(AnneeAcademique).first()

    niveau = db.query(Niveau).first()
    if not niveau:
        niveau = Niveau(id=9001, code="L1", libelle="Licence 1")
        db.add(niveau)
        db.flush()

    enseignant = db.query(User).first()
    if not enseignant:
        raise RuntimeError("Aucun utilisateur en base - impossible de créer des séances.")

    matieres = db.query(Matiere).limit(4).all()
    if len(matieres) < 2:
        raise RuntimeError("Pas assez de matières en base pour peupler la grille EDT.")

    creneaux = _ensure_creneaux(db)

    emploi = EmploiTemps(
        code=f"{SAMPLE_PREFIX}EDT-L1-S1",
        libelle="EDT Licence 1 - Semestre 1 (aperçu PDF)",
        niveau_id=niveau.id,
        semestre=1,
        annee_academique_id=annee.id,
        date_debut=date(2025, 9, 15),
        date_fin=date(2026, 1, 15),
        statut="publie",
    )
    db.add(emploi)
    db.flush()

    # Grille : 4 séances réparties sur la semaine
    plan = [
        (matieres[0], creneaux[0], 1, "cours"),      # Lundi matin
        (matieres[1], creneaux[1], 2, "td"),          # Mardi matin 2
        (matieres[2] if len(matieres) > 2 else matieres[0], creneaux[0], 3, "tp"),  # Mercredi
        (matieres[3] if len(matieres) > 3 else matieres[1], creneaux[-1], 5, "cours"),  # Vendredi
    ]
    for idx, (mat, creneau, jour, type_seance) in enumerate(plan, start=1):
        db.add(
            Seance(
                code=f"{SAMPLE_PREFIX}SEANCE-{idx:02d}",
                matiere_id=mat.id,
                niveau_id=niveau.id,
                enseignant_id=enseignant.id,
                creneau_id=creneau.id,
                type_seance=type_seance,
                date_seance=date(2025, 9, 15 + jour - 1),
                jour_semaine=jour,
                semestre=1,
                annee_academique_id=annee.id,
                duree_minutes=120,
                statut="confirmee",
            )
        )
    db.commit()
    db.refresh(emploi)
    return emploi


def _ensure_template(db: Session) -> TemplateDocument:
    code = "ATTESTATION_INSCRIPTION"
    raw = next(t for t in TEMPLATES_DEFAUT if t["code"] == code)
    tpl = (
        db.query(TemplateDocument)
        .filter(
            TemplateDocument.code == code,
            TemplateDocument.etablissement_id == None,
        )
        .first()
    )
    if tpl:
        # Resynchroniser le template système (corrections texte/CSS)
        tpl.template_html = raw["template_html"]
        tpl.template_css = raw.get("template_css")
        db.commit()
        db.refresh(tpl)
        return tpl

    tpl = TemplateDocument(
        code=raw["code"],
        libelle=raw["libelle"],
        type_document=raw["type_document"],
        description=raw.get("description"),
        template_html=raw["template_html"],
        template_css=raw.get("template_css"),
        variables_disponibles=raw.get("variables_disponibles"),
        format_papier=raw.get("format_papier", "A4"),
        orientation=raw.get("orientation", "portrait"),
        est_systeme_defaut=raw.get("est_systeme_defaut", True),
        is_active=True,
    )
    db.add(tpl)
    db.commit()
    db.refresh(tpl)
    return tpl


def _analyze_pdf(path: Path) -> dict:
    from pypdf import PdfReader

    reader = PdfReader(str(path))
    pages = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        box = page.mediabox
        pages.append(
            {
                "page": i + 1,
                "width_pt": float(box.width),
                "height_pt": float(box.height),
                "text_lines": [ln.strip() for ln in text.splitlines() if ln.strip()],
                "char_count": len(text),
            }
        )
    return {
        "file": str(path),
        "size_bytes": path.stat().st_size,
        "page_count": len(pages),
        "pages": pages,
    }


def main() -> int:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    db = SessionLocal()
    results: dict[str, object] = {"output_dir": str(OUTPUT_DIR), "files": {}}

    try:
        # 1 - Facture (reportlab)
        facture = _ensure_facture(db)
        pdf_facture = generer_facture_pdf(db, facture.id)
        path_facture = OUTPUT_DIR / "01_facture_reportlab.pdf"
        path_facture.write_bytes(pdf_facture)
        results["files"]["facture"] = {
            "source_id": facture.id,
            "numero": facture.numero_facture,
            "engine": "reportlab",
            "analysis": _analyze_pdf(path_facture),
        }

        # 2 - EDT (reportlab landscape)
        emploi = _ensure_emploi_temps(db)
        pdf_edt = generer_emploi_temps_pdf(db, emploi.id)
        path_edt = OUTPUT_DIR / "02_emploi_temps_reportlab.pdf"
        path_edt.write_bytes(pdf_edt)
        results["files"]["emploi_temps"] = {
            "source_id": emploi.id,
            "code": emploi.code,
            "engine": "reportlab",
            "analysis": _analyze_pdf(path_edt),
        }

        # 3 - Template attestation (xhtml2pdf en dev Windows)
        tpl = _ensure_template(db)
        variables = {
            "numero_attestation": "ATT-2026-0042",
            "civilite": "Mme",
            "nom_complet": "Aminata Kaboré",
            "date_naissance": "12/04/2002",
            "lieu_naissance": "Ouagadougou",
            "annee_academique": "2025-2026",
            "filiere": "Gestion des Entreprises",
            "niveau": "Licence 1",
            "matricule": "ETU-2026-0042",
            "ville": "Ouagadougou",
            "date_jour": "07/09/2026",
        }
        from app.utils.pdf_generator import get_active_etablissement_config

        if not get_active_etablissement_config(db):
            # Données de démo si aucune ConfigurationEtablissement en base
            variables.update(
                {
                    "nom_etablissement": "Institut Supérieur de Gestion - Ouagadougou",
                    "adresse_etablissement": "Avenue de la Nation, Secteur 15, Ouagadougou",
                    "telephone_etablissement": "+226 25 30 00 00",
                    "email_etablissement": "contact@isg-ouaga.bf",
                    "logo_url": "",
                }
            )
        pdf_tpl = render_document_pdf(db, tpl.code, variables)
        path_tpl = OUTPUT_DIR / "03_template_attestation_xhtml2pdf.pdf"
        path_tpl.write_bytes(pdf_tpl)

        # Sauvegarde HTML rendu pour comparaison preview
        from app.services.template_service import render_document

        html_preview = render_document(db, tpl.code, variables)
        (OUTPUT_DIR / "03_template_attestation_preview.html").write_text(
            html_preview, encoding="utf-8"
        )

        # Détecter moteur HTML→PDF utilisé
        html_engine = "xhtml2pdf"
        try:
            from weasyprint import HTML  # noqa: F401

            test = html_to_pdf("<html><body>test</body></html>")
            if test and is_pdf_bytes(test):
                html_engine = "weasyprint"
        except Exception:
            pass

        results["files"]["template"] = {
            "source_code": tpl.code,
            "engine": html_engine,
            "analysis": _analyze_pdf(path_tpl),
        }

    finally:
        db.close()

    report_path = OUTPUT_DIR / "analysis_report.json"
    report_path.write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"PDFs générés dans: {OUTPUT_DIR}")
    for key, info in results["files"].items():
        analysis = info["analysis"]
        print(
            f"  - {key}: {analysis['page_count']} page(s), "
            f"{analysis['size_bytes']} octets, moteur={info['engine']}"
        )
    print(f"Rapport JSON: {report_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
