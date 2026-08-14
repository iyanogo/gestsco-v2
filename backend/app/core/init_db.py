from sqlalchemy.orm import Session

from app.core.database import engine, Base, SessionLocal
from app.core.security import get_password_hash
from app.models.user import User


def create_tables() -> None:
    """Crée toutes les tables dans la base de données."""
    Base.metadata.create_all(bind=engine)


def init_db() -> None:
    """Initialise la base de données avec un super utilisateur par défaut."""
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "admin@gestsco.com").first()
        if not user:
            superuser = User(
                email="admin@gestsco.com",
                hashed_password=get_password_hash("Admin@123"),
                full_name="Administrateur",
                is_active=True,
                is_superuser=True,
                role="admin",
            )
            db.add(superuser)
            db.commit()
            print("Super utilisateur créé : admin@gestsco.com")
        else:
            print("Super utilisateur existe déjà.")
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
