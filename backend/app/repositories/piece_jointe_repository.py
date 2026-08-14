"""
Repository pour la gestion des pièces jointes
"""

from datetime import datetime
from sqlalchemy.orm import Session

from app.models.piece_jointe import PieceJointe
from app.schemas.piece_jointe import PieceJointeCreate, PieceJointeUpdate
from app.repositories.base_repository import BaseRepository


class PieceJointeRepository(BaseRepository[PieceJointe, PieceJointeCreate, PieceJointeUpdate]):
    """Repository pour les opérations sur les pièces jointes."""

    def __init__(self):
        super().__init__(PieceJointe)

    def get_by_dossier(self, db: Session, dossier_id: int) -> list[PieceJointe]:
        """
        Liste les pièces jointes d'un dossier.
        
        Args:
            db: Session de base de données
            dossier_id: ID du dossier
            
        Returns:
            Liste des pièces jointes du dossier
        """
        return db.query(self.model).filter(self.model.dossier_id == dossier_id).all()

    def get_by_type(self, db: Session, dossier_id: int, type_piece: str) -> PieceJointe | None:
        """
        Récupère une pièce jointe par type pour un dossier.
        
        Args:
            db: Session de base de données
            dossier_id: ID du dossier
            type_piece: Type de la pièce
            
        Returns:
            La pièce jointe trouvée ou None
        """
        return db.query(self.model).filter(
            self.model.dossier_id == dossier_id,
            self.model.type_piece == type_piece
        ).first()

    def valider_piece(self, db: Session, id: int, commentaire: str = None) -> PieceJointe | None:
        """
        Valide une pièce jointe (is_valide=True).
        
        Args:
            db: Session de base de données
            id: ID de la pièce
            commentaire: Commentaire de validation
            
        Returns:
            La pièce mise à jour ou None
        """
        piece = self.get_by_id(db, id)
        if not piece:
            return None

        piece.is_valide = True
        piece.commentaire = commentaire
        piece.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(piece)
        return piece

    def refuser_piece(self, db: Session, id: int, commentaire: str) -> PieceJointe | None:
        """
        Refuse une pièce jointe (is_valide=False).
        
        Args:
            db: Session de base de données
            id: ID de la pièce
            commentaire: Motif du refus
            
        Returns:
            La pièce mise à jour ou None
        """
        piece = self.get_by_id(db, id)
        if not piece:
            return None

        piece.is_valide = False
        piece.commentaire = commentaire
        piece.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(piece)
        return piece


# Instance singleton du repository
piece_jointe_repository = PieceJointeRepository()
