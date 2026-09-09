/**
 * Page de création d'un nouveau stage.
 */

import React, { useEffect, useState } from 'react';
import { Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layouts';
import { FormStage } from '../../components/stages';
import { usePermissions } from '../../hooks/usePermissions';
import { createStage } from '../../services/stageService';
import { getEtudiants } from '../../services/etudiantService';
import { getMatieres } from '../../services/matiereService';
import { getNiveaux } from '../../services/niveauService';
import { getUsersForSelect } from '../../services/userService';
import anneeAcademiqueService from '../../services/anneeAcademiqueService';
import { handleApiError } from '../../utils/errorHandler';
import type { CreateStage, Stage } from '../../types/anneeAcademique';

const NouveauStagePage: React.FC = () => {
  const navigate = useNavigate();
  const { canPerform } = usePermissions();
  const canCreate = canPerform('stages', 'create');

  const [loadingRefs, setLoadingRefs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [etudiants, setEtudiants] = useState<Array<{ id: number; matricule: string; nom: string; prenom: string }>>([]);
  const [matieres, setMatieres] = useState<Array<{ id: number; code: string; libelle: string }>>([]);
  const [niveaux, setNiveaux] = useState<Array<{ id: number; code: string; libelle: string }>>([]);
  const [annees, setAnnees] = useState<Array<{ id: number; code: string; libelle?: string }>>([]);
  const [enseignants, setEnseignants] = useState<Array<{ id: number; nom: string; prenom: string }>>([]);

  useEffect(() => {
    const loadRefs = async () => {
      try {
        const [etudiantData, matiereData, niveauData, anneeData, userData] = await Promise.all([
          getEtudiants({ limit: 500 }),
          getMatieres({ limit: 500 }),
          getNiveaux(),
          anneeAcademiqueService.getAnnees({ limit: 50 }),
          getUsersForSelect({ roles: ['enseignant', 'teacher'], limit: 200 }),
        ]);

        setEtudiants(
          etudiantData.map((e) => ({
            id: e.id,
            matricule: e.matricule || `#${e.id}`,
            nom: e.nom,
            prenom: e.prenom,
          }))
        );
        setMatieres(
          matiereData.map((m) => ({
            id: m.id,
            code: m.code,
            libelle: m.libelle,
          }))
        );
        setNiveaux(
          niveauData.map((n) => ({
            id: n.id,
            code: n.code,
            libelle: n.libelle,
          }))
        );
        setAnnees(
          anneeData.map((a) => ({
            id: a.id,
            code: a.code,
            libelle: a.libelle,
          }))
        );
        setEnseignants(
          userData.map((u) => ({
            id: u.id,
            nom: u.full_name?.split(' ').slice(-1)[0] || u.email,
            prenom: u.full_name?.split(' ')[0] || '',
          })),
        );
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setLoadingRefs(false);
      }
    };
    loadRefs();
  }, []);

  const handleSubmit = async (data: Partial<Stage>) => {
    const payload: CreateStage = {
      etudiant_id: data.etudiant_id!,
      matiere_id: data.matiere_id!,
      niveau_id: data.niveau_id!,
      annee_academique_id: data.annee_academique_id!,
      type_stage: data.type_stage!,
      duree_semaines: data.duree_semaines!,
      date_debut: data.date_debut!,
      date_fin: data.date_fin!,
      entreprise_nom: data.entreprise_nom!,
      maitre_stage_nom: data.maitre_stage_nom!,
      theme: data.theme!,
      entreprise_adresse: data.entreprise_adresse,
      entreprise_telephone: data.entreprise_telephone,
      entreprise_email: data.entreprise_email,
      maitre_stage_fonction: data.maitre_stage_fonction,
      maitre_stage_email: data.maitre_stage_email,
      encadrant_academique_id: data.encadrant_academique_id,
      objectifs: data.objectifs,
    };

    const stage = await createStage(payload);
    navigate(`/admin/stages/${stage.id}`);
  };

  if (!canCreate) {
    return (
      <div className="fade-in">
        <PageHeader
          title="Nouveau stage"
          breadcrumbs={[
            { label: 'Stages', path: '/admin/stages' },
            { label: 'Accès refusé' },
          ]}
        />
        <Alert variant="warning">Vous n'avez pas la permission de créer un stage.</Alert>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <PageHeader
        title="Nouveau stage"
        subtitle="Création d'un dossier de stage étudiant"
        breadcrumbs={[
          { label: 'Stages', path: '/admin/stages' },
          { label: 'Nouveau' },
        ]}
      />

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loadingRefs ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="text-muted mt-3 mb-0">Chargement des référentiels...</p>
        </div>
      ) : (
        <FormStage
          etudiants={etudiants}
          matieres={matieres}
          niveaux={niveaux}
          annees={annees}
          enseignants={enseignants}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/admin/stages')}
        />
      )}
    </div>
  );
};

export default NouveauStagePage;
