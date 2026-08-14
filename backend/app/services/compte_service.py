"""
Service pour la gestion des comptes étudiants
"""

from datetime import date, datetime
from decimal import Decimal
from io import BytesIO
from sqlalchemy.orm import Session

from app.models.compte_etudiant import CompteEtudiant
from app.models.mouvement_compte import MouvementCompte
from app.models.etudiant import Etudiant
from app.models.annee_academique import AnneeAcademique


def creer_mouvement_compte(
    db: Session,
    compte_id: int,
    type_mouvement: str,
    montant: float,
    libelle: str,
    description: str = None,
    facture_id: int = None,
    paiement_id: int = None,
    user_id: int = None,
) -> MouvementCompte:
    """
    Crée un mouvement de compte.
    
    Args:
        db: Session de base de données
        compte_id: ID du compte
        type_mouvement: Type de mouvement (debit, credit)
        montant: Montant du mouvement
        libelle: Libellé du mouvement
        description: Description (optionnel)
        facture_id: ID de la facture liée (optionnel)
        paiement_id: ID du paiement lié (optionnel)
        user_id: ID de l'utilisateur (optionnel)
        
    Returns:
        Le mouvement créé
    """
    compte = db.query(CompteEtudiant).filter(CompteEtudiant.id == compte_id).first()
    if not compte:
        raise ValueError("Compte non trouvé")
    
    montant_decimal = Decimal(str(montant))
    solde_avant = compte.solde_actuel
    
    if type_mouvement == "debit":
        solde_apres = solde_avant - montant_decimal
    else:  # credit
        solde_apres = solde_avant + montant_decimal
    
    mouvement = MouvementCompte(
        compte_id=compte_id,
        type_mouvement=type_mouvement,
        montant=montant_decimal,
        solde_avant=solde_avant,
        solde_apres=solde_apres,
        libelle=libelle,
        description=description,
        facture_id=facture_id,
        paiement_id=paiement_id,
        effectue_par=user_id,
    )
    db.add(mouvement)
    
    # Mettre à jour le compte
    compte.solde_actuel = solde_apres
    compte.date_derniere_operation = datetime.utcnow()
    
    if type_mouvement == "debit":
        compte.total_facture += montant_decimal
    else:
        compte.total_paye += montant_decimal
    
    compte.total_restant = compte.total_facture - compte.total_paye
    
    db.commit()
    db.refresh(mouvement)
    
    return mouvement


def generer_releve_compte_pdf(
    db: Session,
    compte_id: int,
    date_debut: date = None,
    date_fin: date = None,
) -> bytes:
    """
    Génère un PDF du relevé de compte.
    
    Args:
        db: Session de base de données
        compte_id: ID du compte
        date_debut: Date de début (optionnel)
        date_fin: Date de fin (optionnel)
        
    Returns:
        Contenu du PDF en bytes
    """
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    
    # Récupérer le compte avec ses relations
    compte = db.query(CompteEtudiant).filter(CompteEtudiant.id == compte_id).first()
    if not compte:
        return b""
    
    etudiant = db.query(Etudiant).filter(Etudiant.id == compte.etudiant_id).first()
    annee = db.query(AnneeAcademique).filter(AnneeAcademique.id == compte.annee_academique_id).first()
    
    # Récupérer les mouvements
    query = db.query(MouvementCompte).filter(MouvementCompte.compte_id == compte_id)
    if date_debut:
        query = query.filter(MouvementCompte.date_mouvement >= date_debut)
    if date_fin:
        query = query.filter(MouvementCompte.date_mouvement <= date_fin)
    mouvements = query.order_by(MouvementCompte.date_mouvement.asc()).all()
    
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
    elements.append(Paragraph("RELEVÉ DE COMPTE", title_style))
    elements.append(Spacer(1, 0.5*cm))
    
    # Informations du compte
    info_data = [
        ["Année académique:", annee.code if annee else ""],
        ["Statut du compte:", compte.statut_compte.upper()],
    ]
    
    if date_debut or date_fin:
        periode = ""
        if date_debut:
            periode += f"Du {date_debut.strftime('%d/%m/%Y')}"
        if date_fin:
            periode += f" au {date_fin.strftime('%d/%m/%Y')}"
        info_data.append(["Période:", periode])
    
    info_table = Table(info_data, colWidths=[4*cm, 8*cm])
    info_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
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
        elements.append(Spacer(1, 0.5*cm))
    
    # Solde actuel
    solde_color = "green" if compte.solde_actuel >= 0 else "red"
    elements.append(Paragraph(
        f"<b>Solde actuel:</b> <font color='{solde_color}'>{compte.solde_actuel:,.0f} {compte.devise}</font>",
        styles['Normal']
    ))
    elements.append(Spacer(1, 0.5*cm))
    
    # Mouvements
    elements.append(Paragraph("<b>Historique des mouvements:</b>", styles['Normal']))
    elements.append(Spacer(1, 0.3*cm))
    
    if mouvements:
        mvt_data = [["Date", "Libellé", "Débit", "Crédit", "Solde"]]
        
        for mvt in mouvements:
            debit = f"{mvt.montant:,.0f}" if mvt.type_mouvement == "debit" else ""
            credit = f"{mvt.montant:,.0f}" if mvt.type_mouvement == "credit" else ""
            
            mvt_data.append([
                mvt.date_mouvement.strftime("%d/%m/%Y"),
                mvt.libelle[:30],
                debit,
                credit,
                f"{mvt.solde_apres:,.0f}",
            ])
        
        mvt_table = Table(mvt_data, colWidths=[2.5*cm, 6*cm, 2.5*cm, 2.5*cm, 2.5*cm])
        mvt_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('ALIGN', (1, 1), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
        ]))
        elements.append(mvt_table)
    else:
        elements.append(Paragraph("Aucun mouvement pour cette période.", styles['Normal']))
    
    elements.append(Spacer(1, 0.5*cm))
    
    # Résumé
    resume_data = [
        ["Total facturé:", f"{compte.total_facture:,.0f} {compte.devise}"],
        ["Total payé:", f"{compte.total_paye:,.0f} {compte.devise}"],
        ["Reste à payer:", f"{compte.total_restant:,.0f} {compte.devise}"],
    ]
    
    resume_table = Table(resume_data, colWidths=[10*cm, 6*cm])
    resume_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
    ]))
    elements.append(resume_table)
    
    # Générer le PDF
    doc.build(elements)
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    
    return pdf_bytes
