"""
Service pour l'envoi de notifications
"""

import logging
from sqlalchemy.orm import Session

from app.models.facture import Facture
from app.models.paiement_facture import PaiementFacture
from app.models.echeancier import Echeancier
from app.models.etudiant import Etudiant

logger = logging.getLogger(__name__)


def envoyer_notification_facture(db: Session, facture_id: int) -> bool:
    """
    Envoie une notification de facture à l'étudiant.
    
    Args:
        db: Session de base de données
        facture_id: ID de la facture
        
    Returns:
        True si envoyé avec succès, False sinon
    """
    try:
        facture = db.query(Facture).filter(Facture.id == facture_id).first()
        if not facture:
            return False
        
        etudiant = db.query(Etudiant).filter(Etudiant.id == facture.etudiant_id).first()
        if not etudiant:
            return False
        
        # Préparer le message
        sujet = f"Nouvelle facture {facture.numero_facture}"
        message = f"""
        Bonjour {etudiant.prenom} {etudiant.nom},
        
        Une nouvelle facture a été émise à votre nom.
        
        Numéro de facture: {facture.numero_facture}
        Montant total: {facture.montant_total:,.0f} XOF
        Date d'échéance: {facture.date_echeance.strftime('%d/%m/%Y') if facture.date_echeance else 'Non définie'}
        
        Veuillez procéder au paiement avant la date d'échéance.
        
        Cordialement,
        Le service de scolarité
        """
        
        # TODO: Implémenter l'envoi réel (email/SMS)
        # Pour l'instant, on log le message
        logger.info(f"Notification facture envoyée à {etudiant.email if hasattr(etudiant, 'email') else 'N/A'}")
        logger.debug(f"Sujet: {sujet}")
        logger.debug(f"Message: {message}")
        
        return True
        
    except Exception as e:
        logger.error(f"Erreur lors de l'envoi de notification facture: {e}")
        return False


def envoyer_notification_paiement(db: Session, paiement_id: int) -> bool:
    """
    Envoie une notification de confirmation de paiement.
    
    Args:
        db: Session de base de données
        paiement_id: ID du paiement
        
    Returns:
        True si envoyé avec succès, False sinon
    """
    try:
        paiement = db.query(PaiementFacture).filter(PaiementFacture.id == paiement_id).first()
        if not paiement:
            return False
        
        etudiant = db.query(Etudiant).filter(Etudiant.id == paiement.etudiant_id).first()
        if not etudiant:
            return False
        
        facture = db.query(Facture).filter(Facture.id == paiement.facture_id).first()
        
        sujet = f"Confirmation de paiement {paiement.numero_recu or paiement.numero_paiement}"
        message = f"""
        Bonjour {etudiant.prenom} {etudiant.nom},
        
        Nous confirmons la réception de votre paiement.
        
        Numéro de reçu: {paiement.numero_recu or 'En attente'}
        Montant: {paiement.montant:,.0f} XOF
        Mode de paiement: {paiement.mode_paiement.replace('_', ' ').title()}
        Date: {paiement.date_paiement.strftime('%d/%m/%Y %H:%M') if paiement.date_paiement else ''}
        
        Facture concernée: {facture.numero_facture if facture else 'N/A'}
        Montant restant: {facture.montant_restant:,.0f} XOF if facture else 'N/A'
        
        Merci pour votre paiement.
        
        Cordialement,
        Le service de scolarité
        """
        
        logger.info(f"Notification paiement envoyée à {etudiant.email if hasattr(etudiant, 'email') else 'N/A'}")
        logger.debug(f"Sujet: {sujet}")
        logger.debug(f"Message: {message}")
        
        return True
        
    except Exception as e:
        logger.error(f"Erreur lors de l'envoi de notification paiement: {e}")
        return False


def envoyer_rappel_echeance(db: Session, echeancier_id: int) -> bool:
    """
    Envoie un rappel d'échéance à l'étudiant.
    
    Args:
        db: Session de base de données
        echeancier_id: ID de l'échéance
        
    Returns:
        True si envoyé avec succès, False sinon
    """
    try:
        echeance = db.query(Echeancier).filter(Echeancier.id == echeancier_id).first()
        if not echeance:
            return False
        
        etudiant = db.query(Etudiant).filter(Etudiant.id == echeance.etudiant_id).first()
        if not etudiant:
            return False
        
        facture = db.query(Facture).filter(Facture.id == echeance.facture_id).first()
        
        sujet = f"Rappel: Échéance de paiement le {echeance.date_echeance.strftime('%d/%m/%Y')}"
        message = f"""
        Bonjour {etudiant.prenom} {etudiant.nom},
        
        Nous vous rappelons qu'une échéance de paiement arrive bientôt.
        
        Facture: {facture.numero_facture if facture else 'N/A'}
        Échéance n°{echeance.numero_echeance}
        Date d'échéance: {echeance.date_echeance.strftime('%d/%m/%Y')}
        Montant à payer: {echeance.montant_echeance - echeance.montant_paye:,.0f} XOF
        
        Veuillez procéder au paiement avant cette date pour éviter les pénalités.
        
        Cordialement,
        Le service de scolarité
        """
        
        logger.info(f"Rappel échéance envoyé à {etudiant.email if hasattr(etudiant, 'email') else 'N/A'}")
        logger.debug(f"Sujet: {sujet}")
        logger.debug(f"Message: {message}")
        
        return True
        
    except Exception as e:
        logger.error(f"Erreur lors de l'envoi de rappel échéance: {e}")
        return False


def envoyer_relance_impaye(db: Session, facture_id: int) -> bool:
    """
    Envoie une relance pour facture impayée.
    
    Args:
        db: Session de base de données
        facture_id: ID de la facture
        
    Returns:
        True si envoyé avec succès, False sinon
    """
    try:
        facture = db.query(Facture).filter(Facture.id == facture_id).first()
        if not facture:
            return False
        
        etudiant = db.query(Etudiant).filter(Etudiant.id == facture.etudiant_id).first()
        if not etudiant:
            return False
        
        sujet = f"RELANCE: Facture impayée {facture.numero_facture}"
        message = f"""
        Bonjour {etudiant.prenom} {etudiant.nom},
        
        Nous constatons que votre facture n'a pas encore été réglée.
        
        Numéro de facture: {facture.numero_facture}
        Montant restant dû: {facture.montant_restant:,.0f} XOF
        Date d'échéance dépassée: {facture.date_echeance.strftime('%d/%m/%Y') if facture.date_echeance else 'N/A'}
        
        Nous vous prions de bien vouloir régulariser votre situation dans les plus brefs délais.
        
        En cas de difficultés, veuillez contacter le service de scolarité pour convenir d'un échéancier.
        
        Cordialement,
        Le service de scolarité
        """
        
        logger.info(f"Relance impayé envoyée à {etudiant.email if hasattr(etudiant, 'email') else 'N/A'}")
        logger.debug(f"Sujet: {sujet}")
        logger.debug(f"Message: {message}")
        
        return True
        
    except Exception as e:
        logger.error(f"Erreur lors de l'envoi de relance impayé: {e}")
        return False


def envoyer_notifications_echeances_proches(db: Session, jours: int = 7) -> int:
    """
    Envoie des rappels pour toutes les échéances proches.
    
    Args:
        db: Session de base de données
        jours: Nombre de jours avant l'échéance
        
    Returns:
        Nombre de notifications envoyées
    """
    from datetime import date, timedelta
    
    today = date.today()
    date_limite = today + timedelta(days=jours)
    
    echeances = db.query(Echeancier).filter(
        Echeancier.date_echeance >= today,
        Echeancier.date_echeance <= date_limite,
        Echeancier.statut == "en_attente"
    ).all()
    
    count = 0
    for echeance in echeances:
        if envoyer_rappel_echeance(db, echeance.id):
            count += 1
    
    logger.info(f"{count} rappels d'échéance envoyés")
    return count


def envoyer_relances_impayes(db: Session) -> int:
    """
    Envoie des relances pour toutes les factures impayées expirées.
    
    Args:
        db: Session de base de données
        
    Returns:
        Nombre de relances envoyées
    """
    from datetime import date
    
    today = date.today()
    
    factures = db.query(Facture).filter(
        Facture.date_echeance < today,
        Facture.statut.in_(["en_attente", "partiellement_payee"])
    ).all()
    
    count = 0
    for facture in factures:
        if envoyer_relance_impaye(db, facture.id):
            count += 1
    
    logger.info(f"{count} relances d'impayés envoyées")
    return count
