"""
Repository pour la gestion des notes
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.note import Note
from app.models.etudiant import Etudiant
from app.models.examen import Examen
from app.schemas.note import NoteCreate, NoteUpdate
from app.repositories.base_repository import BaseRepository


class NoteRepository(BaseRepository[Note, NoteCreate, NoteUpdate]):
    """Repository pour les opérations CRUD sur les notes."""

    def __init__(self):
        super().__init__(Note)

    def get_by_examen(
        self,
        db: Session,
        examen_id: int,
        skip: int = 0,
        limit: int = 500
    ) -> list[Note]:
        """
        Liste les notes d'un examen.
        
        Args:
            db: Session de base de données
            examen_id: ID de l'examen
            skip: Nombre d'éléments à ignorer
            limit: Nombre maximum d'éléments
            
        Returns:
            Liste des notes de l'examen
        """
        return db.query(Note).filter(
            Note.examen_id == examen_id
        ).offset(skip).limit(limit).all()

    def get_by_examen_with_etudiant(
        self,
        db: Session,
        examen_id: int
    ) -> list[Note]:
        """
        Liste les notes d'un examen avec les infos étudiant.
        
        Args:
            db: Session de base de données
            examen_id: ID de l'examen
            
        Returns:
            Liste des notes avec infos étudiant
        """
        return db.query(Note).options(
            joinedload(Note.etudiant)
        ).filter(
            Note.examen_id == examen_id
        ).all()

    def get_by_etudiant(
        self,
        db: Session,
        etudiant_id: int,
        session_id: Optional[int] = None
    ) -> list[Note]:
        """
        Liste les notes d'un étudiant.
        
        Args:
            db: Session de base de données
            etudiant_id: ID de l'étudiant
            session_id: ID de la session (optionnel)
            
        Returns:
            Liste des notes de l'étudiant
        """
        query = db.query(Note).filter(Note.etudiant_id == etudiant_id)
        
        if session_id:
            query = query.join(Examen).filter(Examen.session_id == session_id)
        
        return query.all()

    def get_by_inscription_matiere(
        self,
        db: Session,
        inscription_matiere_id: int
    ) -> list[Note]:
        """
        Liste les notes d'une inscription matière.
        
        Args:
            db: Session de base de données
            inscription_matiere_id: ID de l'inscription matière
            
        Returns:
            Liste des notes de l'inscription matière
        """
        return db.query(Note).filter(
            Note.inscription_matiere_id == inscription_matiere_id
        ).all()

    def get_note_examen_etudiant(
        self,
        db: Session,
        examen_id: int,
        etudiant_id: int
    ) -> Optional[Note]:
        """
        Récupère la note d'un étudiant pour un examen.
        
        Args:
            db: Session de base de données
            examen_id: ID de l'examen
            etudiant_id: ID de l'étudiant
            
        Returns:
            La note ou None
        """
        return db.query(Note).filter(
            Note.examen_id == examen_id,
            Note.etudiant_id == etudiant_id
        ).first()

    def create_bulk(
        self,
        db: Session,
        notes_data: list[dict],
        user_id: int
    ) -> list[Note]:
        """
        Crée plusieurs notes en une fois.
        
        Args:
            db: Session de base de données
            notes_data: Liste des données de notes
            user_id: ID de l'utilisateur qui saisit
            
        Returns:
            Liste des notes créées
        """
        created_notes = []
        now = datetime.utcnow()
        
        for note_data in notes_data:
            # Calculer note_sur_20 si note_sur différent de 20
            note_sur = note_data.get("note_sur", 20.0)
            note_value = note_data.get("note")
            note_sur_20 = None
            
            if note_value is not None and note_sur != 20.0:
                note_sur_20 = round((note_value / note_sur) * 20, 2)
            elif note_value is not None:
                note_sur_20 = note_value
            
            db_note = Note(
                examen_id=note_data["examen_id"],
                inscription_matiere_id=note_data["inscription_matiere_id"],
                etudiant_id=note_data["etudiant_id"],
                note=note_value,
                note_sur=note_sur,
                note_sur_20=note_sur_20,
                statut_presence=note_data.get("statut_presence", "present"),
                numero_anonymat=note_data.get("numero_anonymat"),
                observation=note_data.get("observation"),
                saisie_par=user_id,
                date_saisie=now,
                is_valide=False,
                created_at=now,
                updated_at=now
            )
            db.add(db_note)
            created_notes.append(db_note)
        
        db.commit()
        for note in created_notes:
            db.refresh(note)
        
        return created_notes

    def update_note(
        self,
        db: Session,
        id: int,
        note: float,
        user_id: int
    ) -> Optional[Note]:
        """
        Met à jour une note.
        
        Args:
            db: Session de base de données
            id: ID de la note
            note: Nouvelle valeur de la note
            user_id: ID de l'utilisateur qui modifie
            
        Returns:
            La note mise à jour ou None
        """
        db_obj = self.get_by_id(db, id)
        if not db_obj:
            return None
        
        db_obj.note = note
        
        # Recalculer note_sur_20
        if db_obj.note_sur != 20.0:
            db_obj.note_sur_20 = round((note / db_obj.note_sur) * 20, 2)
        else:
            db_obj.note_sur_20 = note
        
        db_obj.saisie_par = user_id
        db_obj.date_saisie = datetime.utcnow()
        db_obj.is_valide = False  # Invalider si modifiée
        db_obj.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def valider_notes_examen(
        self,
        db: Session,
        examen_id: int,
        user_id: int
    ) -> list[Note]:
        """
        Valide toutes les notes d'un examen.
        
        Args:
            db: Session de base de données
            examen_id: ID de l'examen
            user_id: ID du validateur
            
        Returns:
            Liste des notes validées
        """
        now = datetime.utcnow()
        notes = db.query(Note).filter(
            Note.examen_id == examen_id,
            Note.is_valide == False
        ).all()
        
        for note in notes:
            note.is_valide = True
            note.validee_par = user_id
            note.date_validation = now
            note.updated_at = now
        
        db.commit()
        return notes

    def get_notes_non_validees(
        self,
        db: Session,
        examen_id: Optional[int] = None
    ) -> list[Note]:
        """
        Liste les notes non validées.
        
        Args:
            db: Session de base de données
            examen_id: ID de l'examen (optionnel)
            
        Returns:
            Liste des notes non validées
        """
        query = db.query(Note).filter(Note.is_valide == False)
        
        if examen_id:
            query = query.filter(Note.examen_id == examen_id)
        
        return query.all()

    def get_statistiques_examen(self, db: Session, examen_id: int) -> dict:
        """
        Calcule les statistiques d'un examen.
        
        Args:
            db: Session de base de données
            examen_id: ID de l'examen
            
        Returns:
            Dictionnaire avec moyenne, min, max, présents, absents, taux_reussite
        """
        notes = db.query(Note).filter(Note.examen_id == examen_id).all()
        
        if not notes:
            return {
                "moyenne": None,
                "min": None,
                "max": None,
                "nombre_presents": 0,
                "nombre_absents": 0,
                "taux_reussite": None,
                "total": 0
            }
        
        presents = [n for n in notes if n.statut_presence == "present" and n.note is not None]
        absents = [n for n in notes if n.statut_presence in ("absent", "absent_justifie")]
        
        notes_values = [n.note_sur_20 for n in presents if n.note_sur_20 is not None]
        
        moyenne = None
        min_note = None
        max_note = None
        taux_reussite = None
        
        if notes_values:
            moyenne = round(sum(notes_values) / len(notes_values), 2)
            min_note = min(notes_values)
            max_note = max(notes_values)
            reussis = len([n for n in notes_values if n >= 10])
            taux_reussite = round((reussis / len(notes_values)) * 100, 2)
        
        return {
            "moyenne": moyenne,
            "min": min_note,
            "max": max_note,
            "nombre_presents": len(presents),
            "nombre_absents": len(absents),
            "taux_reussite": taux_reussite,
            "total": len(notes)
        }


# Instance singleton du repository
note_repository = NoteRepository()
