"""
Repository pour la gestion des réservations de salles
"""
from datetime import date, datetime
from typing import List, Optional, Union

from sqlalchemy.orm import Session

from app.models.reservation_salle import ReservationSalle
from app.repositories.base_repository import BaseRepository
from app.schemas.reservation_salle import ReservationSalleCreate, ReservationSalleUpdate
from app.utils.emploi_temps_utils import verifier_disponibilite_salle, generer_numero_reservation


class ReservationSalleRepository(BaseRepository[ReservationSalle, ReservationSalleCreate, ReservationSalleUpdate]):
    """Repository pour les opérations CRUD sur les réservations de salles"""

    def __init__(self):
        super().__init__(ReservationSalle)

    def get_by_salle(
        self,
        db: Session,
        salle_id: int,
        date_reservation: Optional[date] = None
    ) -> List[ReservationSalle]:
        """Retourne les réservations d'une salle"""
        query = db.query(ReservationSalle).filter(
            ReservationSalle.salle_id == salle_id
        )
        
        if date_reservation:
            query = query.filter(ReservationSalle.date_reservation == date_reservation)
        
        return query.order_by(ReservationSalle.date_reservation.desc()).all()

    def get_by_demandeur(
        self,
        db: Session,
        demandeur_id: int,
        statut: Optional[str] = None
    ) -> List[ReservationSalle]:
        """Retourne les réservations d'un demandeur"""
        query = db.query(ReservationSalle).filter(
            ReservationSalle.demandeur_id == demandeur_id
        )
        
        if statut:
            query = query.filter(ReservationSalle.statut == statut)
        
        return query.order_by(ReservationSalle.created_at.desc()).all()

    def get_en_attente(self, db: Session) -> List[ReservationSalle]:
        """Retourne les réservations en attente d'approbation"""
        return db.query(ReservationSalle).filter(
            ReservationSalle.statut == "en_attente"
        ).order_by(ReservationSalle.created_at).all()

    def get_by_statut(
        self,
        db: Session,
        statut: str,
        skip: int = 0,
        limit: int = 100,
    ) -> List[ReservationSalle]:
        """Retourne les réservations filtrées par statut."""
        return (
            db.query(ReservationSalle)
            .filter(ReservationSalle.statut == statut)
            .order_by(ReservationSalle.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def create_with_verification(
        self,
        db: Session,
        reservation: ReservationSalleCreate,
        demandeur_id: int
    ) -> Union[ReservationSalle, dict]:
        """Crée une réservation après vérification de la disponibilité"""
        # Vérifier disponibilité de la salle
        if not verifier_disponibilite_salle(
            db,
            reservation.salle_id,
            reservation.date_reservation,
            reservation.heure_debut,
            reservation.heure_fin
        ):
            return {"errors": ["La salle n'est pas disponible sur ce créneau"]}
        
        # Générer le numéro de réservation
        numero = generer_numero_reservation()
        
        # Créer la réservation
        reservation_data = reservation.model_dump()
        reservation_data["numero_reservation"] = numero
        reservation_data["demandeur_id"] = demandeur_id
        reservation_data["statut"] = "en_attente"
        
        reservation_obj = ReservationSalle(**reservation_data)
        db.add(reservation_obj)
        db.commit()
        db.refresh(reservation_obj)
        
        return reservation_obj

    _PLANNING_FIELDS = ("salle_id", "date_reservation", "heure_debut", "heure_fin")

    def update_with_verification(
        self,
        db: Session,
        id: int,
        reservation_in: ReservationSalleUpdate,
    ) -> Union[ReservationSalle, dict, None]:
        """Met à jour une réservation en revalidant la disponibilité si le créneau change."""
        reservation = self.get_by_id(db, id)
        if not reservation:
            return None

        update_data = reservation_in.model_dump(exclude_unset=True)
        needs_validation = any(
            field in update_data for field in self._PLANNING_FIELDS
        )

        effective_salle = update_data.get("salle_id", reservation.salle_id)
        effective_date = update_data.get("date_reservation", reservation.date_reservation)
        effective_debut = update_data.get("heure_debut", reservation.heure_debut)
        effective_fin = update_data.get("heure_fin", reservation.heure_fin)

        if needs_validation and not verifier_disponibilite_salle(
            db,
            effective_salle,
            effective_date,
            effective_debut,
            effective_fin,
            reservation_id_exclue=reservation.id
            if reservation.statut == "approuvee"
            else None,
        ):
            return {"errors": ["La salle n'est pas disponible sur ce créneau"]}

        for field, value in update_data.items():
            setattr(reservation, field, value)

        db.commit()
        db.refresh(reservation)
        return reservation

    def approuver(
        self,
        db: Session,
        id: int,
        user_id: int
    ) -> Union[ReservationSalle, dict, None]:
        """Approuve une réservation après vérification de disponibilité."""
        reservation = self.get_by_id(db, id)
        if not reservation or reservation.statut != "en_attente":
            return None

        if not verifier_disponibilite_salle(
            db,
            reservation.salle_id,
            reservation.date_reservation,
            reservation.heure_debut,
            reservation.heure_fin,
        ):
            return {"errors": ["La salle n'est pas disponible sur ce créneau"]}

        reservation.statut = "approuvee"
        reservation.approuve_par = user_id
        reservation.date_approbation = datetime.utcnow()
        db.commit()
        db.refresh(reservation)
        return reservation

    def refuser(
        self,
        db: Session,
        id: int,
        user_id: int,
        motif_refus: str
    ) -> Optional[ReservationSalle]:
        """Refuse une réservation"""
        reservation = self.get_by_id(db, id)
        if reservation and reservation.statut == "en_attente":
            reservation.statut = "refusee"
            reservation.approuve_par = user_id
            reservation.date_approbation = datetime.utcnow()
            reservation.motif_refus = motif_refus
            db.commit()
            db.refresh(reservation)
        return reservation

    def annuler(self, db: Session, id: int) -> Optional[ReservationSalle]:
        """Annule une réservation"""
        reservation = self.get_by_id(db, id)
        if reservation and reservation.statut in ["en_attente", "approuvee"]:
            reservation.statut = "annulee"
            db.commit()
            db.refresh(reservation)
        return reservation

    def get_by_numero(self, db: Session, numero: str) -> Optional[ReservationSalle]:
        """Retourne une réservation par son numéro"""
        return db.query(ReservationSalle).filter(
            ReservationSalle.numero_reservation == numero
        ).first()


reservation_salle_repository = ReservationSalleRepository()
