"""
Service pour la gestion des paiements
"""

from datetime import datetime
from io import BytesIO
from sqlalchemy.orm import Session

from app.models.paiement_facture import PaiementFacture
from app.models.facture import Facture
from app.models.etudiant import Etudiant


def generer_numero_paiement(db: Session) -> str:
    """
    Génère un numéro de paiement unique.
    
    Format: PAY-YYYY-XXXXX
    """
    year = datetime.now().year
    prefix = f"PAY-{year}-"
    
    last_paiement = db.query(PaiementFacture).filter(
        PaiementFacture.numero_paiement.like(f"{prefix}%")
    ).order_by(PaiementFacture.numero_paiement.desc()).first()
    
    if last_paiement:
        last_num = int(last_paiement.numero_paiement.split("-")[-1])
        new_num = last_num + 1
    else:
        new_num = 1
    
    return f"{prefix}{new_num:05d}"


def generer_numero_recu(db: Session) -> str:
    """
    Génère un numéro de reçu unique.
    
    Format: RECU-YYYY-XXXXX
    """
    year = datetime.now().year
    prefix = f"RECU-{year}-"
    
    last_paiement = db.query(PaiementFacture).filter(
        PaiementFacture.numero_recu.like(f"{prefix}%")
    ).order_by(PaiementFacture.numero_recu.desc()).first()
    
    if last_paiement:
        last_num = int(last_paiement.numero_recu.split("-")[-1])
        new_num = last_num + 1
    else:
        new_num = 1
    
    return f"{prefix}{new_num:05d}"


def generer_recu_pdf(db: Session, paiement_id: int) -> bytes:
    """
    Génère un PDF du reçu de paiement.
    
    Args:
        db: Session de base de données
        paiement_id: ID du paiement
        
    Returns:
        Contenu du PDF en bytes
    """
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    
    # Récupérer le paiement avec ses relations
    paiement = db.query(PaiementFacture).filter(PaiementFacture.id == paiement_id).first()
    if not paiement:
        return b""
    
    facture = db.query(Facture).filter(Facture.id == paiement.facture_id).first()
    etudiant = db.query(Etudiant).filter(Etudiant.id == paiement.etudiant_id).first()
    
    # Créer le PDF
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1*cm, bottomMargin=1*cm)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=18,
        alignment=1,
        spaceAfter=20
    )
    
    elements = []
    
    # Titre
    elements.append(Paragraph("REÇU DE PAIEMENT", title_style))
    elements.append(Spacer(1, 0.5*cm))
    
    # Informations du reçu
    info_data = [
        ["Numéro de reçu:", paiement.numero_recu or ""],
        ["Numéro de paiement:", paiement.numero_paiement],
        ["Date de paiement:", paiement.date_paiement.strftime("%d/%m/%Y %H:%M") if paiement.date_paiement else ""],
        ["Date de validation:", paiement.date_validation.strftime("%d/%m/%Y %H:%M") if paiement.date_validation else ""],
    ]
    
    info_table = Table(info_data, colWidths=[4*cm, 8*cm])
    info_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 0.5*cm))
    
    # Informations étudiant
    if etudiant:
        elements.append(Paragraph("<b>Étudiant:</b>", styles['Normal']))
        etudiant_info = f"{etudiant.nom} {etudiant.prenom}"
        if hasattr(etudiant, 'matricule') and etudiant.matricule:
            etudiant_info += f" (Matricule: {etudiant.matricule})"
        elements.append(Paragraph(etudiant_info, styles['Normal']))
        elements.append(Spacer(1, 0.3*cm))
    
    # Informations facture
    if facture:
        elements.append(Paragraph(f"<b>Facture:</b> {facture.numero_facture}", styles['Normal']))
        elements.append(Spacer(1, 0.5*cm))
    
    # Détails du paiement
    elements.append(Paragraph("<b>Détails du paiement:</b>", styles['Normal']))
    elements.append(Spacer(1, 0.3*cm))
    
    paiement_data = [
        ["Montant:", f"{paiement.montant:,.0f} {paiement.devise}"],
        ["Mode de paiement:", paiement.mode_paiement.replace("_", " ").title()],
    ]
    
    if paiement.reference_transaction:
        paiement_data.append(["Référence:", paiement.reference_transaction])
    if paiement.banque:
        paiement_data.append(["Banque:", paiement.banque])
    if paiement.numero_cheque:
        paiement_data.append(["N° Chèque:", paiement.numero_cheque])
    
    paiement_table = Table(paiement_data, colWidths=[4*cm, 8*cm])
    paiement_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTSIZE', (0, 0), (-1, 0), 14),
        ('TEXTCOLOR', (1, 0), (1, 0), colors.green),
    ]))
    elements.append(paiement_table)
    elements.append(Spacer(1, 1*cm))
    
    # Statut
    elements.append(Paragraph(
        f"<b>Statut:</b> <font color='green'>VALIDÉ</font>",
        styles['Normal']
    ))
    
    # Générer le PDF
    doc.build(elements)
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    
    return pdf_bytes


def traiter_validation_paiement(db: Session, paiement_id: int, user_id: int) -> dict:
    """
    Traite la validation complète d'un paiement.
    
    Args:
        db: Session de base de données
        paiement_id: ID du paiement
        user_id: ID de l'utilisateur validateur
        
    Returns:
        Dictionnaire avec les résultats
    """
    from app.repositories.paiement_facture_repository import paiement_facture_repository
    
    paiement = paiement_facture_repository.valider_paiement(db, paiement_id, user_id)
    
    if not paiement:
        return {"success": False, "error": "Paiement non trouvé ou déjà traité"}
    
    facture = db.query(Facture).filter(Facture.id == paiement.facture_id).first()
    
    return {
        "success": True,
        "paiement": paiement,
        "facture": facture,
    }
