"""
Script pour créer le contenu de la migration
"""

migration_content = '''"""Add_student_module_tables_manual

Revision ID: d1256c99070b
Revises: 4f4a11b02f58
Create Date: 2026-01-02 11:44:53.686168

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd1256c99070b'
down_revision: Union[str, None] = '4f4a11b02f58'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Ajouter les nouvelles colonnes à la table etudiant existante
    op.add_column('etudiant', sa.Column('numero_carte', sa.String(50), nullable=True))
    op.add_column('etudiant', sa.Column('ine', sa.String(50), nullable=True))
    op.add_column('etudiant', sa.Column('photo_url', sa.String(500), nullable=True))
    op.add_column('etudiant', sa.Column('email', sa.String(255), nullable=True))
    op.add_column('etudiant', sa.Column('telephone_urgence', sa.String(50), nullable=True))
    op.add_column('etudiant', sa.Column('adresse', sa.String(500), nullable=True))
    op.add_column('etudiant', sa.Column('ville', sa.String(100), nullable=True))
    op.add_column('etudiant', sa.Column('pays', sa.String(100), nullable=True, server_default='Burkina Faso'))
    op.add_column('etudiant', sa.Column('nom_pere', sa.String(100), nullable=True))
    op.add_column('etudiant', sa.Column('profession_pere', sa.String(100), nullable=True))
    op.add_column('etudiant', sa.Column('nom_mere', sa.String(100), nullable=True))
    op.add_column('etudiant', sa.Column('profession_mere', sa.String(100), nullable=True))
    op.add_column('etudiant', sa.Column('personne_contact', sa.String(100), nullable=True))
    op.add_column('etudiant', sa.Column('telephone_contact', sa.String(50), nullable=True))
    op.add_column('etudiant', sa.Column('statut', sa.String(50), nullable=True, server_default='actif'))
    op.add_column('etudiant', sa.Column('is_active', sa.Boolean(), nullable=True, server_default='true'))
    
    # Créer les index sur etudiant
    op.create_index('ix_etudiant_email', 'etudiant', ['email'], unique=True)
    op.create_index('idx_etudiant_nom_prenom', 'etudiant', ['nom', 'prenom'])
    op.create_unique_constraint('uq_etudiant_numero_carte', 'etudiant', ['numero_carte'])
    op.create_unique_constraint('uq_etudiant_ine', 'etudiant', ['ine'])
    
    # Créer la table documents_etudiant
    op.create_table(
        'documents_etudiant',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('etudiant_id', sa.BigInteger(), nullable=False),
        sa.Column('type_document', sa.String(100), nullable=False),
        sa.Column('libelle', sa.String(255), nullable=False),
        sa.Column('numero_document', sa.String(100), nullable=True),
        sa.Column('date_delivrance', sa.Date(), nullable=True),
        sa.Column('lieu_delivrance', sa.String(255), nullable=True),
        sa.Column('fichier_url', sa.String(500), nullable=True),
        sa.Column('format_fichier', sa.String(50), nullable=True),
        sa.Column('taille_fichier', sa.Integer(), nullable=True),
        sa.Column('statut', sa.String(50), nullable=False, server_default='en_attente'),
        sa.Column('commentaire', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['etudiant_id'], ['etudiant.id'], name='fk_documents_etudiant_etudiant_id')
    )
    op.create_index('ix_documents_etudiant_id', 'documents_etudiant', ['id'])
    op.create_index('ix_documents_etudiant_etudiant_id', 'documents_etudiant', ['etudiant_id'])
    
    # Créer la table inscriptions
    op.create_table(
        'inscriptions',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('etudiant_id', sa.BigInteger(), nullable=False),
        sa.Column('filiere_id', sa.BigInteger(), nullable=False),
        sa.Column('niveau_id', sa.BigInteger(), nullable=False),
        sa.Column('annee_academique', sa.String(20), nullable=False),
        sa.Column('date_inscription', sa.Date(), nullable=False, server_default=sa.text('CURRENT_DATE')),
        sa.Column('type_inscription', sa.String(50), nullable=False),
        sa.Column('regime_etudes', sa.String(50), nullable=True),
        sa.Column('statut_inscription', sa.String(50), nullable=False, server_default='en_cours'),
        sa.Column('frais_inscription', sa.Float(), nullable=True, server_default='0.0'),
        sa.Column('frais_payes', sa.Float(), nullable=True, server_default='0.0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['etudiant_id'], ['etudiant.id'], name='fk_inscriptions_etudiant_id'),
        sa.ForeignKeyConstraint(['filiere_id'], ['filiere.id'], name='fk_inscriptions_filiere_id'),
        sa.ForeignKeyConstraint(['niveau_id'], ['niveau.id'], name='fk_inscriptions_niveau_id'),
        sa.UniqueConstraint('etudiant_id', 'annee_academique', 'niveau_id', name='uq_inscription_etudiant_annee_niveau')
    )
    op.create_index('ix_inscriptions_id', 'inscriptions', ['id'])
    op.create_index('ix_inscriptions_etudiant_id', 'inscriptions', ['etudiant_id'])
    op.create_index('ix_inscriptions_filiere_id', 'inscriptions', ['filiere_id'])
    op.create_index('ix_inscriptions_niveau_id', 'inscriptions', ['niveau_id'])
    op.create_index('idx_inscription_annee', 'inscriptions', ['annee_academique'])
    
    # Créer la table inscriptions_matieres
    op.create_table(
        'inscriptions_matieres',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('inscription_id', sa.BigInteger(), nullable=False),
        sa.Column('matiere_id', sa.BigInteger(), nullable=False),
        sa.Column('semestre', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['inscription_id'], ['inscriptions.id'], name='fk_inscriptions_matieres_inscription_id'),
        sa.ForeignKeyConstraint(['matiere_id'], ['matiere.id'], name='fk_inscriptions_matieres_matiere_id'),
        sa.UniqueConstraint('inscription_id', 'matiere_id', name='uq_inscription_matiere')
    )
    op.create_index('ix_inscriptions_matieres_id', 'inscriptions_matieres', ['id'])
    op.create_index('ix_inscriptions_matieres_inscription_id', 'inscriptions_matieres', ['inscription_id'])
    op.create_index('ix_inscriptions_matieres_matiere_id', 'inscriptions_matieres', ['matiere_id'])


def downgrade() -> None:
    # Supprimer la table inscriptions_matieres
    op.drop_index('ix_inscriptions_matieres_matiere_id', table_name='inscriptions_matieres')
    op.drop_index('ix_inscriptions_matieres_inscription_id', table_name='inscriptions_matieres')
    op.drop_index('ix_inscriptions_matieres_id', table_name='inscriptions_matieres')
    op.drop_table('inscriptions_matieres')
    
    # Supprimer la table inscriptions
    op.drop_index('idx_inscription_annee', table_name='inscriptions')
    op.drop_index('ix_inscriptions_niveau_id', table_name='inscriptions')
    op.drop_index('ix_inscriptions_filiere_id', table_name='inscriptions')
    op.drop_index('ix_inscriptions_etudiant_id', table_name='inscriptions')
    op.drop_index('ix_inscriptions_id', table_name='inscriptions')
    op.drop_table('inscriptions')
    
    # Supprimer la table documents_etudiant
    op.drop_index('ix_documents_etudiant_etudiant_id', table_name='documents_etudiant')
    op.drop_index('ix_documents_etudiant_id', table_name='documents_etudiant')
    op.drop_table('documents_etudiant')
    
    # Supprimer les colonnes ajoutées à etudiant
    op.drop_constraint('uq_etudiant_ine', 'etudiant', type_='unique')
    op.drop_constraint('uq_etudiant_numero_carte', 'etudiant', type_='unique')
    op.drop_index('idx_etudiant_nom_prenom', table_name='etudiant')
    op.drop_index('ix_etudiant_email', table_name='etudiant')
    op.drop_column('etudiant', 'is_active')
    op.drop_column('etudiant', 'statut')
    op.drop_column('etudiant', 'telephone_contact')
    op.drop_column('etudiant', 'personne_contact')
    op.drop_column('etudiant', 'profession_mere')
    op.drop_column('etudiant', 'nom_mere')
    op.drop_column('etudiant', 'profession_pere')
    op.drop_column('etudiant', 'nom_pere')
    op.drop_column('etudiant', 'pays')
    op.drop_column('etudiant', 'ville')
    op.drop_column('etudiant', 'adresse')
    op.drop_column('etudiant', 'telephone_urgence')
    op.drop_column('etudiant', 'email')
    op.drop_column('etudiant', 'photo_url')
    op.drop_column('etudiant', 'ine')
    op.drop_column('etudiant', 'numero_carte')
'''

# Écrire le fichier
with open('alembic/versions/d1256c99070b_add_student_module_tables_manual.py', 'w', encoding='utf-8') as f:
    f.write(migration_content)

print("Migration file created successfully!")
