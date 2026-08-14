"""
Générateur de numéros de transaction pour les paiements
"""

import threading
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.paiement import Paiement

# Lock pour garantir la thread-safety
_lock = threading.Lock()


def generate_numero_transaction(db: Session) -> str:
    """
    Génère un numéro de transaction unique.
    
    Format: TRX-{YYYYMMDD}-{HHMMSS}-{NUMERO_SEQUENTIEL:05d}
    Exemple: TRX-20250102-143025-00001
    
    Args:
        db: Session de base de données
        
    Returns:
        Numéro de transaction unique
    """
    with _lock:
        now = datetime.utcnow()
        date_str = now.strftime("%Y%m%d")
        time_str = now.strftime("%H%M%S")
        
        # Compter les transactions du jour
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        count = db.query(Paiement).filter(
            Paiement.created_at >= today_start
        ).count()
        
        # Générer le numéro séquentiel
        numero_seq = count + 1
        
        # Construire le numéro de transaction
        numero_transaction = f"TRX-{date_str}-{time_str}-{numero_seq:05d}"
        
        # Vérifier l'unicité et incrémenter si nécessaire
        while db.query(Paiement).filter(
            Paiement.numero_transaction == numero_transaction
        ).first():
            numero_seq += 1
            numero_transaction = f"TRX-{date_str}-{time_str}-{numero_seq:05d}"
        
        return numero_transaction
