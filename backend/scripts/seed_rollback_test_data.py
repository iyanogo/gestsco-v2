"""Seed minimal pour test rollback - matière + examen legacy simulé."""
from sqlalchemy import create_engine, text

from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

with engine.begin() as conn:
    conn.execute(
        text(
            "INSERT INTO matiere (code, libelle, credit, obligatoire) "
            "VALUES ('TEST-ROLLBACK', 'Matière test rollback', 5, false) "
            "ON CONFLICT DO NOTHING"
        )
    )
    # Examen sans FK complets : on vérifie seulement la restauration des types si des lignes existent.
    # Insérer une ligne brute si la table est vide (nécessite session/matiere/niveau valides).
    matiere_id = conn.execute(
        text("SELECT id FROM matiere WHERE code = 'TEST-ROLLBACK' LIMIT 1")
    ).scalar()
    print(f"matiere_id={matiere_id}")

    # Simuler un examen déjà normalisé (controle_continu) si les FK existent
    session_id = conn.execute(text("SELECT id FROM sessions_examen LIMIT 1")).scalar()
    niveau_id = conn.execute(text("SELECT id FROM niveau LIMIT 1")).scalar()
    if session_id and niveau_id and matiere_id:
        conn.execute(
            text(
                "INSERT INTO examens (session_id, matiere_id, niveau_id, type_evaluation, coefficient, note_sur, bareme, statut) "
                "VALUES (:sid, :mid, :nid, 'controle_continu', 1, 20, 20, 'planifie')"
            ),
            {"sid": session_id, "mid": matiere_id, "nid": niveau_id},
        )
        conn.execute(
            text(
                "INSERT INTO examens (session_id, matiere_id, niveau_id, type_evaluation, coefficient, note_sur, bareme, statut) "
                "VALUES (:sid, :mid, :nid, 'examen_partiel', 1, 20, 20, 'planifie')"
            ),
            {"sid": session_id, "mid": matiere_id, "nid": niveau_id},
        )
        print("examens test insérés")
    else:
        print("skip examens (FK manquantes) - test schéma seulement")
