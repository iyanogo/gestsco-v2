"""
Générateur de numéros de dossier de candidature
"""

import threading
from sqlalchemy.orm import Session

from app.models.dossier_candidature import DossierCandidature
from app.models.campagne_inscription import CampagneInscription

# Lock pour garantir la thread-safety
_lock = threading.Lock()


def generate_numero_dossier(db: Session, campagne_id: int) -> str:
    """
    Génère un numéro de dossier unique pour une campagne.
    
    Format: DOSS-{CODE_CAMPAGNE}-{NUMERO_SEQUENTIEL:05d}
    Exemple: DOSS-L2025-00001
    
    Args:
        db: Session de base de données
        campagne_id: ID de la campagne
        
    Returns:
        Numéro de dossier unique
        
    Raises:
        ValueError: Si la campagne n'existe pas
    """
    with _lock:
        # Récupérer le code de la campagne
        campagne = db.query(CampagneInscription).filter(
            CampagneInscription.id == campagne_id
        ).first()
        
        if not campagne:
            raise ValueError(f"Campagne avec ID {campagne_id} non trouvée")
        
        # Compter les dossiers existants pour cette campagne
        count = db.query(DossierCandidature).filter(
            DossierCandidature.campagne_id == campagne_id
        ).count()
        
        # Générer le numéro séquentiel
        numero_seq = count + 1
        
        # Construire le numéro de dossier
        numero_dossier = f"DOSS-{campagne.code}-{numero_seq:05d}"
        
        # Vérifier l'unicité et incrémenter si nécessaire
        while db.query(DossierCandidature).filter(
            DossierCandidature.numero_dossier == numero_dossier
        ).first():
            numero_seq += 1
            numero_dossier = f"DOSS-{campagne.code}-{numero_seq:05d}"
        
        return numero_dossier
