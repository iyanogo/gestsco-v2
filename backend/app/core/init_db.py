from sqlalchemy.orm import Session

from app.core.database import engine, Base, SessionLocal
from app.core.security import get_password_hash
from app.models.user import User


def create_tables() -> None:
    """Crée toutes les tables dans la base de données."""
    Base.metadata.create_all(bind=engine)


def init_db() -> None:
    """Initialise la base de données avec des utilisateurs par défaut."""
    db: Session = SessionLocal()
    try:
        defaults = [
            {
                "email": "admin@gestsco.com",
                "password": "Admin@123",
                "full_name": "Administrateur",
                "is_superuser": True,
                "role": "admin",
            },
            {
                "email": "scolarite@gestsco.com",
                "password": "Scolarite@123",
                "full_name": "Agent Scolarité",
                "is_superuser": False,
                "role": "scolarite",
            },
            {
                "email": "comptable@gestsco.com",
                "password": "Comptable@123",
                "full_name": "Agent Comptable",
                "is_superuser": False,
                "role": "comptable",
            },
        ]

        for account in defaults:
            user = db.query(User).filter(User.email == account["email"]).first()
            if not user:
                db.add(
                    User(
                        email=account["email"],
                        hashed_password=get_password_hash(account["password"]),
                        full_name=account["full_name"],
                        is_active=True,
                        is_superuser=account["is_superuser"],
                        role=account["role"],
                    )
                )
                print(f"Utilisateur créé : {account['email']}")
            else:
                print(f"Utilisateur existe déjà : {account['email']}")

        db.commit()
    finally:
        db.close()


def init() -> None:
    """Initialise la base de données complète."""
    print("Création des tables...")
    create_tables()
    print("Tables créées avec succès.")
    print("Initialisation des données...")
    init_db()
    print("Base de données initialisée avec succès.")
