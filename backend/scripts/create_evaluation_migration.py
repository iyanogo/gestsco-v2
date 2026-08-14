"""Script to create the evaluation module migration file."""

migration_content = '''"""Add evaluation module tables only

Revision ID: 50a0a5164551
Revises: 3e7bf9c2d45a
Create Date: 2026-01-05 12:16:22.097052

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '50a0a5164551'
down_revision: Union[str, None] = '3e7bf9c2d45a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create sessions_examen table
    op.create_table('sessions_examen',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('libelle', sa.String(length=255), nullable=False),
        sa.Column('annee_academique_id', sa.Integer(), nullable=False),
        sa.Column('type_session', sa.String(length=50), nullable=False),
        sa.Column('semestre', sa.Integer(), nullable=False),
        sa.Column('date_debut', sa.Date(), nullable=False),
        sa.Column('date_fin', sa.Date(), nullable=False),
        sa.Column('date_limite_saisie_notes', sa.Date(), nullable=False),
        sa.Column('date_deliberation', sa.Date(), nullable=True),
        sa.Column('statut', sa.String(length=50), nullable=False, server_default='planifiee'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['annee_academique_id'], ['annees_academiques.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_sessions_examen_id', 'sessions_examen', ['id'], unique=False)
    op.create_index('ix_sessions_examen_code', 'sessions_examen', ['code'], unique=True)
    op.create_index('ix_sessions_examen_annee_semestre', 'sessions_examen', ['annee_academique_id', 'semestre'], unique=False)
    op.create_index('ix_sessions_examen_statut', 'sessions_examen', ['statut'], unique=False)

    # Create examens table
    op.create_table('examens',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('session_id', sa.Integer(), nullable=False),
        sa.Column('matiere_id', sa.Integer(), nullable=False),
        sa.Column('niveau_id', sa.Integer(), nullable=False),
        sa.Column('type_evaluation', sa.String(length=50), nullable=False),
        sa.Column('date_examen', sa.DateTime(), nullable=True),
        sa.Column('duree_minutes', sa.Integer(), nullable=True),
        sa.Column('salle', sa.String(length=100), nullable=True),
        sa.Column('coefficient', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('note_sur', sa.Float(), nullable=False, server_default='20.0'),
        sa.Column('bareme', sa.Float(), nullable=False, server_default='20.0'),
        sa.Column('anonymat', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('statut', sa.String(length=50), nullable=False, server_default='planifie'),
        sa.Column('enseignant_id', sa.Integer(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['session_id'], ['sessions_examen.id'], ),
        sa.ForeignKeyConstraint(['matiere_id'], ['matiere.id'], ),
        sa.ForeignKeyConstraint(['niveau_id'], ['niveau.id'], ),
        sa.ForeignKeyConstraint(['enseignant_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_examens_id', 'examens', ['id'], unique=False)
    op.create_index('ix_examens_session_id', 'examens', ['session_id'], unique=False)
    op.create_index('ix_examens_matiere_id', 'examens', ['matiere_id'], unique=False)
    op.create_index('ix_examens_statut', 'examens', ['statut'], unique=False)
    op.create_index('ix_examens_session_matiere_niveau_type', 'examens', ['session_id', 'matiere_id', 'niveau_id', 'type_evaluation'], unique=False)

    # Create notes table
    op.create_table('notes',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('examen_id', sa.Integer(), nullable=False),
        sa.Column('inscription_matiere_id', sa.Integer(), nullable=False),
        sa.Column('etudiant_id', sa.Integer(), nullable=False),
        sa.Column('note', sa.Float(), nullable=True),
        sa.Column('note_sur', sa.Float(), nullable=False, server_default='20.0'),
        sa.Column('note_sur_20', sa.Float(), nullable=True),
        sa.Column('statut_presence', sa.String(length=50), nullable=False, server_default='present'),
        sa.Column('numero_anonymat', sa.String(length=50), nullable=True),
        sa.Column('observation', sa.Text(), nullable=True),
        sa.Column('saisie_par', sa.Integer(), nullable=True),
        sa.Column('date_saisie', sa.DateTime(), nullable=True),
        sa.Column('validee_par', sa.Integer(), nullable=True),
        sa.Column('date_validation', sa.DateTime(), nullable=True),
        sa.Column('is_valide', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['examen_id'], ['examens.id'], ),
        sa.ForeignKeyConstraint(['inscription_matiere_id'], ['inscriptions_matieres.id'], ),
        sa.ForeignKeyConstraint(['etudiant_id'], ['etudiant.id'], ),
        sa.ForeignKeyConstraint(['saisie_par'], ['users.id'], ),
        sa.ForeignKeyConstraint(['validee_par'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('examen_id', 'inscription_matiere_id', name='uq_note_examen_inscription')
    )
    op.create_index('ix_notes_id', 'notes', ['id'], unique=False)
    op.create_index('ix_notes_examen_id', 'notes', ['examen_id'], unique=False)
    op.create_index('ix_notes_etudiant_id', 'notes', ['etudiant_id'], unique=False)
    op.create_index('ix_notes_is_valide', 'notes', ['is_valide'], unique=False)

    # Create resultats_matieres table
    op.create_table('resultats_matieres',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('inscription_matiere_id', sa.Integer(), nullable=False),
        sa.Column('etudiant_id', sa.Integer(), nullable=False),
        sa.Column('matiere_id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.Integer(), nullable=False),
        sa.Column('note_cc', sa.Float(), nullable=True),
        sa.Column('note_tp', sa.Float(), nullable=True),
        sa.Column('note_examen', sa.Float(), nullable=True),
        sa.Column('moyenne_matiere', sa.Float(), nullable=True),
        sa.Column('credit_matiere', sa.Float(), nullable=False),
        sa.Column('credit_obtenu', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('statut', sa.String(length=50), nullable=False, server_default='en_cours'),
        sa.Column('decision', sa.String(length=50), nullable=True),
        sa.Column('session_obtention', sa.String(length=50), nullable=True),
        sa.Column('observation', sa.Text(), nullable=True),
        sa.Column('is_valide', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['inscription_matiere_id'], ['inscriptions_matieres.id'], ),
        sa.ForeignKeyConstraint(['etudiant_id'], ['etudiant.id'], ),
        sa.ForeignKeyConstraint(['matiere_id'], ['matiere.id'], ),
        sa.ForeignKeyConstraint(['session_id'], ['sessions_examen.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('inscription_matiere_id', name='uq_resultat_matiere_inscription')
    )
    op.create_index('ix_resultats_matieres_id', 'resultats_matieres', ['id'], unique=False)
    op.create_index('ix_resultats_matieres_etudiant_session', 'resultats_matieres', ['etudiant_id', 'session_id'], unique=False)
    op.create_index('ix_resultats_matieres_matiere_id', 'resultats_matieres', ['matiere_id'], unique=False)
    op.create_index('ix_resultats_matieres_statut', 'resultats_matieres', ['statut'], unique=False)

    # Create resultats_semestres table
    op.create_table('resultats_semestres',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('inscription_id', sa.Integer(), nullable=False),
        sa.Column('etudiant_id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.Integer(), nullable=False),
        sa.Column('semestre', sa.Integer(), nullable=False),
        sa.Column('moyenne_generale', sa.Float(), nullable=True),
        sa.Column('total_credits_inscrits', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('total_credits_obtenus', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('total_credits_capitalises', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('nombre_matieres', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('nombre_matieres_validees', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('statut', sa.String(length=50), nullable=False, server_default='en_cours'),
        sa.Column('decision', sa.String(length=50), nullable=True),
        sa.Column('mention', sa.String(length=50), nullable=True),
        sa.Column('rang', sa.Integer(), nullable=True),
        sa.Column('effectif', sa.Integer(), nullable=True),
        sa.Column('is_valide', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('date_deliberation', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['inscription_id'], ['inscriptions.id'], ),
        sa.ForeignKeyConstraint(['etudiant_id'], ['etudiant.id'], ),
        sa.ForeignKeyConstraint(['session_id'], ['sessions_examen.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('inscription_id', 'session_id', 'semestre', name='uq_resultat_semestre')
    )
    op.create_index('ix_resultats_semestres_id', 'resultats_semestres', ['id'], unique=False)
    op.create_index('ix_resultats_semestres_etudiant_id', 'resultats_semestres', ['etudiant_id'], unique=False)
    op.create_index('ix_resultats_semestres_session_id', 'resultats_semestres', ['session_id'], unique=False)
    op.create_index('ix_resultats_semestres_statut', 'resultats_semestres', ['statut'], unique=False)

    # Create resultats_annuels table
    op.create_table('resultats_annuels',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('inscription_id', sa.Integer(), nullable=False),
        sa.Column('etudiant_id', sa.Integer(), nullable=False),
        sa.Column('annee_academique_id', sa.Integer(), nullable=False),
        sa.Column('niveau_id', sa.Integer(), nullable=False),
        sa.Column('moyenne_annuelle', sa.Float(), nullable=True),
        sa.Column('moyenne_semestre1', sa.Float(), nullable=True),
        sa.Column('moyenne_semestre2', sa.Float(), nullable=True),
        sa.Column('total_credits_inscrits', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('total_credits_obtenus', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('total_credits_capitalises', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('statut', sa.String(length=50), nullable=False, server_default='en_cours'),
        sa.Column('decision', sa.String(length=50), nullable=True),
        sa.Column('mention', sa.String(length=50), nullable=True),
        sa.Column('rang', sa.Integer(), nullable=True),
        sa.Column('effectif', sa.Integer(), nullable=True),
        sa.Column('passage_niveau_superieur', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_valide', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('date_deliberation', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['inscription_id'], ['inscriptions.id'], ),
        sa.ForeignKeyConstraint(['etudiant_id'], ['etudiant.id'], ),
        sa.ForeignKeyConstraint(['annee_academique_id'], ['annees_academiques.id'], ),
        sa.ForeignKeyConstraint(['niveau_id'], ['niveau.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('inscription_id', name='uq_resultat_annuel_inscription')
    )
    op.create_index('ix_resultats_annuels_id', 'resultats_annuels', ['id'], unique=False)
    op.create_index('ix_resultats_annuels_etudiant_annee', 'resultats_annuels', ['etudiant_id', 'annee_academique_id'], unique=False)
    op.create_index('ix_resultats_annuels_niveau_id', 'resultats_annuels', ['niveau_id'], unique=False)
    op.create_index('ix_resultats_annuels_statut', 'resultats_annuels', ['statut'], unique=False)

    # Create deliberations table
    op.create_table('deliberations',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('session_id', sa.Integer(), nullable=False),
        sa.Column('niveau_id', sa.Integer(), nullable=False),
        sa.Column('filiere_id', sa.Integer(), nullable=False),
        sa.Column('date_deliberation', sa.DateTime(), nullable=False),
        sa.Column('type_deliberation', sa.String(length=50), nullable=False),
        sa.Column('semestre', sa.Integer(), nullable=True),
        sa.Column('president_jury', sa.Integer(), nullable=True),
        sa.Column('membres_jury', sa.Text(), nullable=True),
        sa.Column('nombre_etudiants', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('nombre_admis', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('nombre_ajournes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('nombre_redoublants', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('taux_reussite', sa.Float(), nullable=True),
        sa.Column('statut', sa.String(length=50), nullable=False, server_default='en_cours'),
        sa.Column('proces_verbal_url', sa.String(length=500), nullable=True),
        sa.Column('observations', sa.Text(), nullable=True),
        sa.Column('validee_par', sa.Integer(), nullable=True),
        sa.Column('date_validation', sa.DateTime(), nullable=True),
        sa.Column('publiee', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('date_publication', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['session_id'], ['sessions_examen.id'], ),
        sa.ForeignKeyConstraint(['niveau_id'], ['niveau.id'], ),
        sa.ForeignKeyConstraint(['filiere_id'], ['filiere.id'], ),
        sa.ForeignKeyConstraint(['president_jury'], ['users.id'], ),
        sa.ForeignKeyConstraint(['validee_par'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('session_id', 'niveau_id', 'filiere_id', 'semestre', name='uq_deliberation_session_niveau_filiere_semestre')
    )
    op.create_index('ix_deliberations_id', 'deliberations', ['id'], unique=False)
    op.create_index('ix_deliberations_session_id', 'deliberations', ['session_id'], unique=False)
    op.create_index('ix_deliberations_niveau_id', 'deliberations', ['niveau_id'], unique=False)
    op.create_index('ix_deliberations_filiere_id', 'deliberations', ['filiere_id'], unique=False)
    op.create_index('ix_deliberations_statut', 'deliberations', ['statut'], unique=False)


def downgrade() -> None:
    op.drop_table('deliberations')
    op.drop_table('resultats_annuels')
    op.drop_table('resultats_semestres')
    op.drop_table('resultats_matieres')
    op.drop_table('notes')
    op.drop_table('examens')
    op.drop_table('sessions_examen')
'''

# Write the migration file
migration_path = 'alembic/versions/50a0a5164551_add_evaluation_module_tables_only.py'
with open(migration_path, 'w', encoding='utf-8') as f:
    f.write(migration_content)

print(f"Migration file created: {migration_path}")

# Also delete the problematic auto-generated migration
import os
problematic_migration = 'alembic/versions/9f04fcfcc4dd_add_evaluation_module.py'
if os.path.exists(problematic_migration):
    os.remove(problematic_migration)
    print(f"Deleted problematic migration: {problematic_migration}")
