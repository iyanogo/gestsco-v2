"""

Service pour la gestion des factures

"""



from datetime import datetime

from decimal import Decimal

from sqlalchemy.orm import Session



from app.models.facture import Facture

from app.models.etudiant import Etudiant

from app.models.annee_academique import AnneeAcademique

from app.utils.pdf_formatters import format_statut_facture, pdf_display_value

from app.utils.pdf_generator import (

    build_reportlab_pdf,

    create_subtitle_style,

    create_title_style,

    get_active_etablissement_config,

)





def generer_numero_facture(db: Session) -> str:

    """

    Génère un numéro de facture unique.

    

    Format: FAC-YYYY-XXXXX

    """

    year = datetime.now().year

    prefix = f"FAC-{year}-"

    

    last_facture = db.query(Facture).filter(

        Facture.numero_facture.like(f"{prefix}%")

    ).order_by(Facture.numero_facture.desc()).first()

    

    if last_facture:

        last_num = int(last_facture.numero_facture.split("-")[-1])

        new_num = last_num + 1

    else:

        new_num = 1

    

    return f"{prefix}{new_num:05d}"





def calculer_montant_ligne(quantite: int, prix_unitaire: float, tva_taux: float) -> dict:

    """

    Calcule les montants d'une ligne de facture.

    

    Returns:

        {montant_ligne, tva_montant, montant_ttc}

    """

    montant_ligne = Decimal(str(prix_unitaire)) * quantite

    tva_montant = montant_ligne * (Decimal(str(tva_taux)) / Decimal("100"))

    montant_ttc = montant_ligne + tva_montant

    

    return {

        "montant_ligne": float(montant_ligne),

        "tva_montant": float(tva_montant),

        "montant_ttc": float(montant_ttc),

    }





def _append_etablissement_header(elements, config, styles) -> None:

    """En-tête établissement (configuration active si disponible)."""

    from reportlab.platypus import Paragraph, Spacer

    from reportlab.lib.units import cm



    if not config:

        return



    header_style = create_subtitle_style(font_size=11, space_after=4)

    elements.append(Paragraph(f"<b>{config.nom_complet}</b>", header_style))



    if config.adresse_complete:

        elements.append(Paragraph(config.adresse_complete, styles["Normal"]))

    contact_parts = []

    if config.telephone_principal:

        contact_parts.append(f"Tél: {config.telephone_principal}")

    if config.email_principal:

        contact_parts.append(f"Email: {config.email_principal}")

    if contact_parts:

        elements.append(Paragraph(" | ".join(contact_parts), styles["Normal"]))

    elements.append(Spacer(1, 0.4 * cm))





def generer_facture_pdf(db: Session, facture_id: int) -> bytes:

    """

    Génère un PDF de la facture.

    

    Args:

        db: Session de base de données

        facture_id: ID de la facture

        

    Returns:

        Contenu du PDF en bytes

    """

    from reportlab.lib import colors

    from reportlab.lib.pagesizes import A4

    from reportlab.lib.styles import getSampleStyleSheet

    from reportlab.lib.units import cm

    from reportlab.platypus import Paragraph, Spacer, Table, TableStyle

    

    # Récupérer la facture avec ses relations

    facture = db.query(Facture).filter(Facture.id == facture_id).first()

    if not facture:

        return b""

    

    etudiant = db.query(Etudiant).filter(Etudiant.id == facture.etudiant_id).first()

    annee = db.query(AnneeAcademique).filter(AnneeAcademique.id == facture.annee_academique_id).first()

    config = get_active_etablissement_config(db)

    

    styles = getSampleStyleSheet()

    title_style = create_title_style()

    

    elements = []

    _append_etablissement_header(elements, config, styles)

    

    # Titre

    elements.append(Paragraph("FACTURE", title_style))

    elements.append(Spacer(1, 0.5*cm))

    

    # Informations de la facture

    info_data = [

        ["Numéro:", facture.numero_facture],

        ["Date d'émission:", facture.date_emission.strftime("%d/%m/%Y") if facture.date_emission else ""],

        ["Date d'échéance:", facture.date_echeance.strftime("%d/%m/%Y") if facture.date_echeance else ""],

        ["Année académique:", pdf_display_value(annee.code if annee else None)],

        ["Statut:", format_statut_facture(facture.statut)],

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

        elements.append(Spacer(1, 0.5*cm))

    

    # Lignes de facture

    elements.append(Paragraph("<b>Détail de la facture:</b>", styles['Normal']))

    elements.append(Spacer(1, 0.3*cm))

    

    lignes_data = [["Désignation", "Qté", "Prix Unit.", "TVA", "Total TTC"]]

    

    for ligne in facture.lignes_facture:

        lignes_data.append([

            ligne.libelle,

            str(ligne.quantite),

            f"{ligne.prix_unitaire:,.0f} XOF",

            f"{ligne.tva_taux}%",

            f"{ligne.montant_ttc:,.0f} XOF",

        ])

    

    lignes_table = Table(lignes_data, colWidths=[7*cm, 1.5*cm, 3*cm, 1.5*cm, 3*cm])

    lignes_table.setStyle(TableStyle([

        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),

        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),

        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),

        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),

        ('FONTSIZE', (0, 0), (-1, 0), 10),

        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),

        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),

        ('GRID', (0, 0), (-1, -1), 1, colors.black),

    ]))

    elements.append(lignes_table)

    elements.append(Spacer(1, 0.5*cm))

    

    # Totaux

    totaux_data = [

        ["Montant Total:", f"{facture.montant_total:,.0f} XOF"],

        ["Montant Payé:", f"{facture.montant_paye:,.0f} XOF"],

        ["Montant Restant:", f"{facture.montant_restant:,.0f} XOF"],

    ]

    

    totaux_table = Table(totaux_data, colWidths=[10*cm, 6*cm])

    totaux_table.setStyle(TableStyle([

        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),

        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),

        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),

        ('FONTSIZE', (0, -1), (-1, -1), 12),

        ('TEXTCOLOR', (0, -1), (-1, -1), colors.red if facture.montant_restant > 0 else colors.green),

    ]))

    elements.append(totaux_table)



    footer_label = config.nom_court if config else "GestSco"

    footer_text = (

        f"{footer_label} - Document généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')}"

    )

    

    return build_reportlab_pdf(

        elements,

        pagesize=A4,

        top_margin=1*cm,

        bottom_margin=1*cm,

        footer_text=footer_text,

    )


