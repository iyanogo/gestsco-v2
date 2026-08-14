"""
Script pour exécuter la migration SQL des tables LMD.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy import text
from app.core.database import engine

def run_migration():
    """Exécute le script de migration SQL."""
    
    migration_sql = """
    -- Table: semestres
    CREATE TABLE IF NOT EXISTS semestres (
        id SERIAL PRIMARY KEY,
        code VARCHAR(20) UNIQUE NOT NULL,
        libelle VARCHAR(100) NOT NULL,
        cycle_id INTEGER NOT NULL REFERENCES cycle(id),
        numero_semestre INTEGER NOT NULL,
        annee_dans_cycle INTEGER NOT NULL,
        semestre_dans_annee INTEGER NOT NULL,
        credits_requis INTEGER NOT NULL DEFAULT 30,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_semestre_cycle_numero UNIQUE (cycle_id, numero_semestre)
    );

    -- Table: modules_systeme
    CREATE TABLE IF NOT EXISTS modules_systeme (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        libelle VARCHAR(255) NOT NULL,
        description TEXT,
        icone VARCHAR(50),
        ordre INTEGER NOT NULL DEFAULT 0,
        est_obligatoire BOOLEAN DEFAULT FALSE,
        permissions_requises JSONB,
        dependances JSONB,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Table: modules_actifs
    CREATE TABLE IF NOT EXISTS modules_actifs (
        id SERIAL PRIMARY KEY,
        module_id INTEGER NOT NULL REFERENCES modules_systeme(id),
        universite_id INTEGER REFERENCES universite(id),
        annee_academique_id INTEGER REFERENCES annees_academiques(id),
        est_actif BOOLEAN DEFAULT TRUE,
        date_activation TIMESTAMP,
        date_desactivation TIMESTAMP,
        active_par INTEGER REFERENCES users(id),
        desactive_par INTEGER REFERENCES users(id),
        configuration JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_module_actif_unique UNIQUE (module_id, universite_id, annee_academique_id)
    );

    -- Table: periodes_comptables
    CREATE TABLE IF NOT EXISTS periodes_comptables (
        id SERIAL PRIMARY KEY,
        code VARCHAR(20) UNIQUE NOT NULL,
        libelle VARCHAR(255) NOT NULL,
        annee_academique_id INTEGER NOT NULL REFERENCES annees_academiques(id),
        date_debut DATE NOT NULL,
        date_fin DATE NOT NULL,
        statut VARCHAR(50) NOT NULL DEFAULT 'ouverte',
        est_periode_courante BOOLEAN DEFAULT FALSE,
        date_cloture TIMESTAMP,
        cloturee_par INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Table: stages
    CREATE TABLE IF NOT EXISTS stages (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        etudiant_id INTEGER NOT NULL REFERENCES etudiant(id),
        matiere_id INTEGER NOT NULL REFERENCES matiere(id),
        niveau_id INTEGER NOT NULL REFERENCES niveau(id),
        annee_academique_id INTEGER NOT NULL REFERENCES annees_academiques(id),
        type_stage VARCHAR(50) NOT NULL,
        duree_semaines INTEGER NOT NULL,
        date_debut DATE NOT NULL,
        date_fin DATE NOT NULL,
        entreprise_nom VARCHAR(255) NOT NULL,
        entreprise_adresse VARCHAR(500),
        entreprise_telephone VARCHAR(50),
        entreprise_email VARCHAR(255),
        maitre_stage_nom VARCHAR(255) NOT NULL,
        maitre_stage_fonction VARCHAR(255),
        maitre_stage_email VARCHAR(255),
        encadrant_academique_id INTEGER REFERENCES users(id),
        theme TEXT NOT NULL,
        objectifs TEXT,
        statut VARCHAR(50) NOT NULL DEFAULT 'en_cours',
        rapport_url VARCHAR(500),
        date_depot_rapport DATE,
        note_entreprise NUMERIC(5, 2),
        note_rapport NUMERIC(5, 2),
        note_soutenance NUMERIC(5, 2),
        note_finale NUMERIC(5, 2),
        observations TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Table: soutenances
    CREATE TABLE IF NOT EXISTS soutenances (
        id SERIAL PRIMARY KEY,
        stage_id INTEGER UNIQUE NOT NULL REFERENCES stages(id),
        date_soutenance TIMESTAMP NOT NULL,
        lieu VARCHAR(255) NOT NULL,
        salle_id INTEGER REFERENCES salles(id),
        duree_minutes INTEGER NOT NULL DEFAULT 30,
        president_jury_id INTEGER NOT NULL REFERENCES users(id),
        rapporteur_id INTEGER NOT NULL REFERENCES users(id),
        examinateur_id INTEGER REFERENCES users(id),
        note_presentation NUMERIC(5, 2),
        note_defense NUMERIC(5, 2),
        note_jury NUMERIC(5, 2),
        note_finale NUMERIC(5, 2),
        appreciation VARCHAR(50),
        mention VARCHAR(50),
        observations_jury TEXT,
        statut VARCHAR(50) NOT NULL DEFAULT 'programmee',
        proces_verbal_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Table: configurations_deliberation
    CREATE TABLE IF NOT EXISTS configurations_deliberation (
        id SERIAL PRIMARY KEY,
        annee_academique_id INTEGER NOT NULL REFERENCES annees_academiques(id),
        niveau_id INTEGER REFERENCES niveau(id),
        periodicite VARCHAR(50) NOT NULL DEFAULT 'semestrielle',
        compensation_semestres BOOLEAN DEFAULT TRUE,
        note_eliminatoire NUMERIC(5, 2),
        nombre_matieres_dette_max INTEGER DEFAULT 2,
        moyenne_validation NUMERIC(5, 2) NOT NULL DEFAULT 10.0,
        moyenne_passage_conditionnel NUMERIC(5, 2) DEFAULT 8.0,
        credits_min_passage INTEGER,
        taux_presence_min NUMERIC(5, 2) DEFAULT 75.0,
        autoriser_rattrapage BOOLEAN DEFAULT TRUE,
        nombre_sessions_max INTEGER NOT NULL DEFAULT 2,
        regles_specifiques JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_config_deliberation_annee_niveau UNIQUE (annee_academique_id, niveau_id)
    );
    """
    
    # Exécuter les modifications de tables existantes séparément
    alter_statements = [
        "ALTER TABLE annees_academiques ADD COLUMN IF NOT EXISTS semestre_actif INTEGER",
        "ALTER TABLE annees_academiques ADD COLUMN IF NOT EXISTS date_debut_semestre1 DATE",
        "ALTER TABLE annees_academiques ADD COLUMN IF NOT EXISTS date_fin_semestre1 DATE",
        "ALTER TABLE annees_academiques ADD COLUMN IF NOT EXISTS date_debut_semestre2 DATE",
        "ALTER TABLE annees_academiques ADD COLUMN IF NOT EXISTS date_fin_semestre2 DATE",
        "ALTER TABLE annees_academiques ADD COLUMN IF NOT EXISTS statut VARCHAR(50) DEFAULT 'brouillon'",
        "ALTER TABLE annees_academiques ADD COLUMN IF NOT EXISTS annee_precedente_id INTEGER REFERENCES annees_academiques(id)",
        "ALTER TABLE annees_academiques ADD COLUMN IF NOT EXISTS est_reconduite BOOLEAN DEFAULT FALSE",
        "ALTER TABLE annees_academiques ADD COLUMN IF NOT EXISTS date_ouverture TIMESTAMP",
        "ALTER TABLE annees_academiques ADD COLUMN IF NOT EXISTS date_cloture TIMESTAMP",
        "ALTER TABLE annees_academiques ADD COLUMN IF NOT EXISTS ouverte_par INTEGER REFERENCES users(id)",
        "ALTER TABLE annees_academiques ADD COLUMN IF NOT EXISTS cloturee_par INTEGER REFERENCES users(id)",
        "ALTER TABLE niveau ADD COLUMN IF NOT EXISTS semestre_id INTEGER REFERENCES semestres(id)",
    ]
    
    # Créer les index
    index_statements = [
        "CREATE INDEX IF NOT EXISTS ix_semestres_code ON semestres(code)",
        "CREATE INDEX IF NOT EXISTS ix_semestres_cycle_id ON semestres(cycle_id)",
        "CREATE INDEX IF NOT EXISTS ix_modules_systeme_code ON modules_systeme(code)",
        "CREATE INDEX IF NOT EXISTS ix_modules_actifs_module_id ON modules_actifs(module_id)",
        "CREATE INDEX IF NOT EXISTS ix_modules_actifs_universite_id ON modules_actifs(universite_id)",
        "CREATE INDEX IF NOT EXISTS ix_modules_actifs_annee_id ON modules_actifs(annee_academique_id)",
        "CREATE INDEX IF NOT EXISTS ix_periodes_comptables_code ON periodes_comptables(code)",
        "CREATE INDEX IF NOT EXISTS ix_periodes_comptables_annee_id ON periodes_comptables(annee_academique_id)",
        "CREATE INDEX IF NOT EXISTS ix_stages_code ON stages(code)",
        "CREATE INDEX IF NOT EXISTS ix_stages_etudiant_id ON stages(etudiant_id)",
        "CREATE INDEX IF NOT EXISTS ix_stages_niveau_id ON stages(niveau_id)",
        "CREATE INDEX IF NOT EXISTS ix_stages_annee_id ON stages(annee_academique_id)",
        "CREATE INDEX IF NOT EXISTS ix_soutenances_stage_id ON soutenances(stage_id)",
        "CREATE INDEX IF NOT EXISTS ix_config_deliberation_annee_id ON configurations_deliberation(annee_academique_id)",
        "CREATE INDEX IF NOT EXISTS ix_annees_academiques_statut ON annees_academiques(statut)",
    ]
    
    print("=== Exécution de la migration LMD ===\n")
    
    with engine.connect() as conn:
        # Créer les tables principales
        print("Création des tables...")
        try:
            conn.execute(text(migration_sql))
            conn.commit()
            print("✓ Tables créées avec succès")
        except Exception as e:
            print(f"Note: {e}")
            conn.rollback()
        
        # Exécuter les ALTER TABLE
        print("\nModification des tables existantes...")
        for stmt in alter_statements:
            try:
                conn.execute(text(stmt))
                conn.commit()
                print(f"✓ {stmt[:60]}...")
            except Exception as e:
                if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
                    print(f"- Colonne déjà existante, ignorée")
                else:
                    print(f"Note: {e}")
                conn.rollback()
        
        # Créer les index
        print("\nCréation des index...")
        for stmt in index_statements:
            try:
                conn.execute(text(stmt))
                conn.commit()
                print(f"✓ Index créé")
            except Exception as e:
                if "already exists" in str(e).lower():
                    print(f"- Index déjà existant, ignoré")
                else:
                    print(f"Note: {e}")
                conn.rollback()
    
    print("\n=== Migration terminée ===")


if __name__ == "__main__":
    run_migration()
