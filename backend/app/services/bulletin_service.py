"""
Service pour la génération des bulletins
"""

from typing import Optional
from datetime import datetime
from io import BytesIO

from sqlalchemy.orm import Session

from app.repositories import (
    etudiant_repository,
    inscription_repository,
    resultat_matiere_repository,
    resultat_semestre_repository,
    resultat_annuel_repository,
    session_examen_repository,
)
from app.models.inscription_matiere import InscriptionMatiere
from app.models.matiere import Matiere


def generer_bulletin_semestre(
    db: Session,
    etudiant_id: int,
    session_id: int,
    semestre: int
) -> dict:
    """
    Génère les données du bulletin semestriel.
    
    Args:
        db: Session de base de données
        etudiant_id: ID de l'étudiant
        session_id: ID de la session
        semestre: Numéro du semestre
        
    Returns:
        Dictionnaire structuré avec toutes les données du bulletin
    """
    # Récupérer l'étudiant
    etudiant = etudiant_repository.get_by_id(db, etudiant_id)
    if not etudiant:
        raise ValueError(f"Étudiant {etudiant_id} non trouvé")
    
    # Récupérer la session
    session = session_examen_repository.get_by_id(db, session_id)
    if not session:
        raise ValueError(f"Session {session_id} non trouvée")
    
    # Récupérer les résultats matières
    resultats_matieres = resultat_matiere_repository.get_by_etudiant(
        db, etudiant_id, session_id=session_id
    )
    
    # Récupérer le résultat semestriel
    resultats_semestres = resultat_semestre_repository.get_by_etudiant(db, etudiant_id)
    resultat_semestre = next(
        (r for r in resultats_semestres if r.session_id == session_id and r.semestre == semestre),
        None
    )
    
    # Récupérer l'inscription
    inscription = None
    if resultat_semestre:
        inscription = inscription_repository.get_by_id(db, resultat_semestre.inscription_id)
    
    # Construire les données des matières
    matieres_data = []
    for rm in resultats_matieres:
        matiere_info = {
            "id": rm.id,
            "matiere_id": rm.matiere_id,
            "code": None,
            "libelle": None,
            "credit": rm.credit_matiere,
            "note_cc": rm.note_cc,
            "note_tp": rm.note_tp,
            "note_examen": rm.note_examen,
            "moyenne": rm.moyenne_matiere,
            "credit_obtenu": rm.credit_obtenu,
            "statut": rm.statut,
            "decision": rm.decision,
        }
        
        # Récupérer les infos de la matière
        if rm.matiere_id:
            matiere = db.query(Matiere).filter(Matiere.id == rm.matiere_id).first()
            if matiere:
                matiere_info["code"] = matiere.code
                matiere_info["libelle"] = matiere.libelle
        
        matieres_data.append(matiere_info)
    
    # Construire le bulletin
    bulletin = {
        "type": "semestre",
        "date_generation": datetime.utcnow().isoformat(),
        "etudiant": {
            "id": etudiant.id,
            "matricule": etudiant.matricule,
            "nom": etudiant.nom,
            "prenom": etudiant.prenom,
            "date_naissance": str(etudiant.date_naissance) if etudiant.date_naissance else None,
            "lieu_naissance": etudiant.lieu_naissance,
            "sexe": etudiant.sexe,
        },
        "session": {
            "id": session.id,
            "code": session.code,
            "libelle": session.libelle,
            "type_session": session.type_session,
            "semestre": session.semestre,
        },
        "inscription": None,
        "matieres": matieres_data,
        "resultat": None,
    }
    
    if inscription:
        bulletin["inscription"] = {
            "id": inscription.id,
            "annee_academique": inscription.annee_academique,
            "filiere_id": inscription.filiere_id,
            "niveau_id": inscription.niveau_id,
        }
    
    if resultat_semestre:
        bulletin["resultat"] = {
            "moyenne_generale": resultat_semestre.moyenne_generale,
            "total_credits_inscrits": resultat_semestre.total_credits_inscrits,
            "total_credits_obtenus": resultat_semestre.total_credits_obtenus,
            "total_credits_capitalises": resultat_semestre.total_credits_capitalises,
            "nombre_matieres": resultat_semestre.nombre_matieres,
            "nombre_matieres_validees": resultat_semestre.nombre_matieres_validees,
            "mention": resultat_semestre.mention,
            "decision": resultat_semestre.decision,
            "rang": resultat_semestre.rang,
            "effectif": resultat_semestre.effectif,
        }
    
    return bulletin


def generer_bulletin_annuel(
    db: Session,
    etudiant_id: int,
    annee_id: int
) -> dict:
    """
    Génère les données du bulletin annuel.
    
    Args:
        db: Session de base de données
        etudiant_id: ID de l'étudiant
        annee_id: ID de l'année académique
        
    Returns:
        Dictionnaire structuré avec toutes les données du bulletin
    """
    # Récupérer l'étudiant
    etudiant = etudiant_repository.get_by_id(db, etudiant_id)
    if not etudiant:
        raise ValueError(f"Étudiant {etudiant_id} non trouvé")
    
    # Récupérer le résultat annuel
    resultats_annuels = resultat_annuel_repository.get_by_etudiant(
        db, etudiant_id, annee_id=annee_id
    )
    resultat_annuel = resultats_annuels[0] if resultats_annuels else None
    
    # Récupérer les résultats semestriels
    resultats_semestres = resultat_semestre_repository.get_by_etudiant(db, etudiant_id)
    
    # Récupérer l'inscription
    inscription = None
    if resultat_annuel:
        inscription = inscription_repository.get_by_id(db, resultat_annuel.inscription_id)
    
    # Construire le bulletin
    bulletin = {
        "type": "annuel",
        "date_generation": datetime.utcnow().isoformat(),
        "etudiant": {
            "id": etudiant.id,
            "matricule": etudiant.matricule,
            "nom": etudiant.nom,
            "prenom": etudiant.prenom,
            "date_naissance": str(etudiant.date_naissance) if etudiant.date_naissance else None,
            "lieu_naissance": etudiant.lieu_naissance,
            "sexe": etudiant.sexe,
        },
        "annee_academique_id": annee_id,
        "inscription": None,
        "semestres": [],
        "resultat": None,
    }
    
    if inscription:
        bulletin["inscription"] = {
            "id": inscription.id,
            "annee_academique": inscription.annee_academique,
            "filiere_id": inscription.filiere_id,
            "niveau_id": inscription.niveau_id,
        }
    
    # Ajouter les résultats semestriels
    for rs in resultats_semestres:
        bulletin["semestres"].append({
            "semestre": rs.semestre,
            "moyenne_generale": rs.moyenne_generale,
            "total_credits_obtenus": rs.total_credits_obtenus,
            "total_credits_inscrits": rs.total_credits_inscrits,
            "mention": rs.mention,
            "decision": rs.decision,
            "rang": rs.rang,
            "effectif": rs.effectif,
        })
    
    if resultat_annuel:
        bulletin["resultat"] = {
            "moyenne_annuelle": resultat_annuel.moyenne_annuelle,
            "moyenne_semestre1": resultat_annuel.moyenne_semestre1,
            "moyenne_semestre2": resultat_annuel.moyenne_semestre2,
            "total_credits_inscrits": resultat_annuel.total_credits_inscrits,
            "total_credits_obtenus": resultat_annuel.total_credits_obtenus,
            "total_credits_capitalises": resultat_annuel.total_credits_capitalises,
            "mention": resultat_annuel.mention,
            "decision": resultat_annuel.decision,
            "passage_niveau_superieur": resultat_annuel.passage_niveau_superieur,
            "rang": resultat_annuel.rang,
            "effectif": resultat_annuel.effectif,
        }
    
    return bulletin


def generer_releve_notes(
    db: Session,
    etudiant_id: int,
    annee_id: Optional[int] = None
) -> dict:
    """
    Génère le relevé de notes complet d'un étudiant.
    
    Args:
        db: Session de base de données
        etudiant_id: ID de l'étudiant
        annee_id: ID de l'année académique (optionnel, toutes si None)
        
    Returns:
        Dictionnaire structuré avec le relevé complet
    """
    # Récupérer l'étudiant
    etudiant = etudiant_repository.get_by_id(db, etudiant_id)
    if not etudiant:
        raise ValueError(f"Étudiant {etudiant_id} non trouvé")
    
    # Récupérer toutes les inscriptions
    inscriptions = inscription_repository.get_by_etudiant(db, etudiant_id)
    
    # Récupérer tous les résultats matières
    resultats_matieres = resultat_matiere_repository.get_by_etudiant(db, etudiant_id)
    
    # Récupérer tous les résultats semestriels
    resultats_semestres = resultat_semestre_repository.get_by_etudiant(db, etudiant_id)
    
    # Récupérer tous les résultats annuels
    resultats_annuels = resultat_annuel_repository.get_by_etudiant(
        db, etudiant_id, annee_id=annee_id
    )
    
    # Construire le relevé
    releve = {
        "type": "releve_notes",
        "date_generation": datetime.utcnow().isoformat(),
        "etudiant": {
            "id": etudiant.id,
            "matricule": etudiant.matricule,
            "nom": etudiant.nom,
            "prenom": etudiant.prenom,
            "date_naissance": str(etudiant.date_naissance) if etudiant.date_naissance else None,
            "lieu_naissance": etudiant.lieu_naissance,
            "sexe": etudiant.sexe,
            "nationalite": etudiant.nationalite,
        },
        "parcours": [],
        "total_credits_obtenus": 0,
    }
    
    # Organiser par année/inscription
    for inscription in inscriptions:
        annee_data = {
            "inscription_id": inscription.id,
            "annee_academique": inscription.annee_academique,
            "filiere_id": inscription.filiere_id,
            "niveau_id": inscription.niveau_id,
            "matieres": [],
            "semestres": [],
            "resultat_annuel": None,
        }
        
        # Ajouter les matières
        for rm in resultats_matieres:
            if rm.inscription_matiere_id:
                im = db.query(InscriptionMatiere).filter(
                    InscriptionMatiere.id == rm.inscription_matiere_id
                ).first()
                if im and im.inscription_id == inscription.id:
                    matiere = db.query(Matiere).filter(Matiere.id == rm.matiere_id).first()
                    annee_data["matieres"].append({
                        "code": matiere.code if matiere else None,
                        "libelle": matiere.libelle if matiere else None,
                        "credit": rm.credit_matiere,
                        "moyenne": rm.moyenne_matiere,
                        "credit_obtenu": rm.credit_obtenu,
                        "statut": rm.statut,
                    })
        
        # Ajouter les résultats semestriels
        for rs in resultats_semestres:
            if rs.inscription_id == inscription.id:
                annee_data["semestres"].append({
                    "semestre": rs.semestre,
                    "moyenne": rs.moyenne_generale,
                    "credits_obtenus": rs.total_credits_obtenus,
                    "mention": rs.mention,
                    "decision": rs.decision,
                })
        
        # Ajouter le résultat annuel
        for ra in resultats_annuels:
            if ra.inscription_id == inscription.id:
                annee_data["resultat_annuel"] = {
                    "moyenne": ra.moyenne_annuelle,
                    "credits_obtenus": ra.total_credits_obtenus,
                    "mention": ra.mention,
                    "decision": ra.decision,
                    "passage": ra.passage_niveau_superieur,
                }
                releve["total_credits_obtenus"] += ra.total_credits_obtenus or 0
        
        releve["parcours"].append(annee_data)
    
    return releve


def generer_bulletin_pdf(bulletin_data: dict, type_bulletin: str = "semestre") -> bytes:
    """
    Génère un PDF à partir des données du bulletin.
    
    Args:
        bulletin_data: Données du bulletin
        type_bulletin: Type de bulletin (semestre, annuel)
        
    Returns:
        Contenu du PDF en bytes
    """
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1*cm, bottomMargin=1*cm)
        
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'Title',
            parent=styles['Heading1'],
            fontSize=16,
            alignment=1,  # Center
            spaceAfter=20
        )
        
        elements = []
        
        # Titre
        if type_bulletin == "semestre":
            titre = f"BULLETIN DE NOTES - SEMESTRE {bulletin_data.get('session', {}).get('semestre', '')}"
        else:
            titre = "BULLETIN DE NOTES ANNUEL"
        
        elements.append(Paragraph(titre, title_style))
        elements.append(Spacer(1, 0.5*cm))
        
        # Informations étudiant
        etudiant = bulletin_data.get("etudiant", {})
        info_etudiant = f"""
        <b>Matricule:</b> {etudiant.get('matricule', 'N/A')}<br/>
        <b>Nom:</b> {etudiant.get('nom', '')} {etudiant.get('prenom', '')}<br/>
        <b>Date de naissance:</b> {etudiant.get('date_naissance', 'N/A')}<br/>
        """
        elements.append(Paragraph(info_etudiant, styles['Normal']))
        elements.append(Spacer(1, 0.5*cm))
        
        # Tableau des notes (pour bulletin semestriel)
        if type_bulletin == "semestre" and bulletin_data.get("matieres"):
            data = [["Code", "Matière", "CC", "TP", "Examen", "Moyenne", "Crédit", "Statut"]]
            
            for m in bulletin_data["matieres"]:
                data.append([
                    m.get("code", ""),
                    m.get("libelle", "")[:30],
                    str(m.get("note_cc", "-")),
                    str(m.get("note_tp", "-")),
                    str(m.get("note_examen", "-")),
                    str(m.get("moyenne", "-")),
                    str(m.get("credit_obtenu", 0)),
                    m.get("statut", ""),
                ])
            
            table = Table(data, colWidths=[2*cm, 5*cm, 1.5*cm, 1.5*cm, 1.5*cm, 2*cm, 1.5*cm, 2*cm])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
            ]))
            elements.append(table)
            elements.append(Spacer(1, 0.5*cm))
        
        # Résultat global
        resultat = bulletin_data.get("resultat", {})
        if resultat:
            if type_bulletin == "semestre":
                resultat_text = f"""
                <b>Moyenne Générale:</b> {resultat.get('moyenne_generale', 'N/A')}/20<br/>
                <b>Crédits Obtenus:</b> {resultat.get('total_credits_obtenus', 0)}/{resultat.get('total_credits_inscrits', 0)}<br/>
                <b>Mention:</b> {resultat.get('mention', 'N/A')}<br/>
                <b>Décision:</b> {resultat.get('decision', 'N/A')}<br/>
                <b>Rang:</b> {resultat.get('rang', 'N/A')}/{resultat.get('effectif', 'N/A')}<br/>
                """
            else:
                resultat_text = f"""
                <b>Moyenne Annuelle:</b> {resultat.get('moyenne_annuelle', 'N/A')}/20<br/>
                <b>Moyenne S1:</b> {resultat.get('moyenne_semestre1', 'N/A')}/20<br/>
                <b>Moyenne S2:</b> {resultat.get('moyenne_semestre2', 'N/A')}/20<br/>
                <b>Crédits Obtenus:</b> {resultat.get('total_credits_obtenus', 0)}/{resultat.get('total_credits_inscrits', 0)}<br/>
                <b>Mention:</b> {resultat.get('mention', 'N/A')}<br/>
                <b>Décision:</b> {resultat.get('decision', 'N/A')}<br/>
                <b>Passage:</b> {'Oui' if resultat.get('passage_niveau_superieur') else 'Non'}<br/>
                """
            
            elements.append(Paragraph("<b>RÉSULTAT</b>", styles['Heading2']))
            elements.append(Paragraph(resultat_text, styles['Normal']))
        
        # Générer le PDF
        doc.build(elements)
        
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        return pdf_bytes
        
    except ImportError:
        # Si reportlab n'est pas installé, retourner un PDF vide avec un message
        return b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n199\n%%EOF"
