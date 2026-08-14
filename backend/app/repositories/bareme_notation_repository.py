from decimal import Decimal
from typing import Optional, List
from sqlalchemy.orm import Session, joinedload

from app.models.bareme_notation import BaremeNotation
from app.models.mention_notation import MentionNotation
from app.schemas.bareme_notation import (
    BaremeNotationCreate,
    BaremeNotationUpdate,
    MentionNotationCreate,
    MentionNotationUpdate
)


class BaremeNotationRepository:
    
    @staticmethod
    def get_by_id(db: Session, bareme_id: int) -> Optional[BaremeNotation]:
        return db.query(BaremeNotation).filter(BaremeNotation.id == bareme_id).first()
    
    @staticmethod
    def get_by_code(db: Session, code: str) -> Optional[BaremeNotation]:
        return db.query(BaremeNotation).filter(BaremeNotation.code == code).first()
    
    @staticmethod
    def get_by_etablissement(db: Session, etablissement_id: int) -> List[BaremeNotation]:
        return db.query(BaremeNotation).filter(
            BaremeNotation.etablissement_id == etablissement_id,
            BaremeNotation.is_active == True
        ).all()
    
    @staticmethod
    def get_by_cycle(db: Session, cycle_id: int) -> Optional[BaremeNotation]:
        return db.query(BaremeNotation).filter(
            BaremeNotation.cycle_id == cycle_id,
            BaremeNotation.is_active == True
        ).first()
    
    @staticmethod
    def get_defaut(db: Session) -> Optional[BaremeNotation]:
        return db.query(BaremeNotation).filter(
            BaremeNotation.est_systeme_defaut == True,
            BaremeNotation.is_active == True
        ).first()
    
    @staticmethod
    def get_all(db: Session, etablissement_id: Optional[int] = None, cycle_id: Optional[int] = None) -> List[BaremeNotation]:
        query = db.query(BaremeNotation).filter(BaremeNotation.is_active == True)
        if etablissement_id:
            query = query.filter(BaremeNotation.etablissement_id == etablissement_id)
        if cycle_id:
            query = query.filter(BaremeNotation.cycle_id == cycle_id)
        return query.all()
    
    @staticmethod
    def get_with_mentions(db: Session, bareme_id: int) -> Optional[BaremeNotation]:
        return db.query(BaremeNotation).options(
            joinedload(BaremeNotation.mentions)
        ).filter(BaremeNotation.id == bareme_id).first()
    
    @staticmethod
    def determiner_mention(db: Session, bareme_id: int, note: float) -> Optional[MentionNotation]:
        """Détermine la mention pour une note donnée"""
        bareme = BaremeNotationRepository.get_with_mentions(db, bareme_id)
        if not bareme:
            return None
        
        note_decimal = Decimal(str(note))
        for mention in sorted(bareme.mentions, key=lambda m: m.note_min):
            if mention.is_active and mention.note_min <= note_decimal <= mention.note_max:
                return mention
        return None
    
    @staticmethod
    def create(db: Session, bareme_in: BaremeNotationCreate) -> BaremeNotation:
        bareme = BaremeNotation(**bareme_in.model_dump())
        db.add(bareme)
        db.commit()
        db.refresh(bareme)
        return bareme
    
    @staticmethod
    def update(db: Session, bareme: BaremeNotation, bareme_in: BaremeNotationUpdate) -> BaremeNotation:
        update_data = bareme_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(bareme, field, value)
        db.commit()
        db.refresh(bareme)
        return bareme
    
    @staticmethod
    def delete(db: Session, bareme_id: int) -> bool:
        bareme = BaremeNotationRepository.get_by_id(db, bareme_id)
        if bareme:
            db.delete(bareme)
            db.commit()
            return True
        return False
    
    # Méthodes pour les mentions
    @staticmethod
    def get_mention_by_id(db: Session, mention_id: int) -> Optional[MentionNotation]:
        return db.query(MentionNotation).filter(MentionNotation.id == mention_id).first()
    
    @staticmethod
    def create_mention(db: Session, mention_in: MentionNotationCreate) -> MentionNotation:
        mention = MentionNotation(**mention_in.model_dump())
        db.add(mention)
        db.commit()
        db.refresh(mention)
        return mention
    
    @staticmethod
    def update_mention(db: Session, mention: MentionNotation, mention_in: MentionNotationUpdate) -> MentionNotation:
        update_data = mention_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(mention, field, value)
        db.commit()
        db.refresh(mention)
        return mention
    
    @staticmethod
    def delete_mention(db: Session, mention_id: int) -> bool:
        mention = BaremeNotationRepository.get_mention_by_id(db, mention_id)
        if mention:
            db.delete(mention)
            db.commit()
            return True
        return False


bareme_notation_repository = BaremeNotationRepository()
