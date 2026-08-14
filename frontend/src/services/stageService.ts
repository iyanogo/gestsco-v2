/**
 * Service pour la gestion des stages.
 * CRUD complet avec validation et statistiques.
 */

import api from './api';
import type {
  Stage,
  CreateStage,
  UpdateStage,
  ValiderStageRequest,
  StatistiquesStages,
} from '../types/anneeAcademique';

const BASE_URL = '/api/v1/stages';

interface GetStagesParams {
  annee_id?: number;
  niveau_id?: number;
  statut?: string;
  type_stage?: string;
  skip?: number;
  limit?: number;
}

/**
 * Récupère la liste des stages.
 */
export async function getStages(params?: GetStagesParams): Promise<Stage[]> {
  const response = await api.get<Stage[]>(BASE_URL, { params });
  return response.data;
}

/**
 * Récupère un stage par son ID.
 */
export async function getStageById(id: number): Promise<Stage> {
  const response = await api.get<Stage>(`${BASE_URL}/${id}`);
  return response.data;
}

/**
 * Crée un nouveau stage.
 */
export async function createStage(data: CreateStage): Promise<Stage> {
  const response = await api.post<Stage>(BASE_URL, data);
  return response.data;
}

/**
 * Met à jour un stage.
 */
export async function updateStage(id: number, data: UpdateStage): Promise<Stage> {
  const response = await api.put<Stage>(`${BASE_URL}/${id}`, data);
  return response.data;
}

/**
 * Supprime un stage.
 */
export async function deleteStage(id: number): Promise<{ message: string }> {
  const response = await api.delete(`${BASE_URL}/${id}`);
  return response.data;
}

/**
 * Valide un stage avec les notes.
 */
export async function validerStage(
  id: number,
  data: ValiderStageRequest
): Promise<{ message: string; stage: Partial<Stage> }> {
  const response = await api.post(`${BASE_URL}/${id}/valider`, data);
  return response.data;
}

/**
 * Termine un stage.
 */
export async function terminerStage(id: number): Promise<{ message: string; statut: string }> {
  const response = await api.post(`${BASE_URL}/${id}/terminer`);
  return response.data;
}

/**
 * Récupère les stages d'un étudiant.
 */
export async function getStagesEtudiant(etudiantId: number): Promise<Stage[]> {
  const response = await api.get<Stage[]>(`${BASE_URL}/etudiant/${etudiantId}`);
  return response.data;
}

/**
 * Récupère les stages encadrés par un enseignant.
 */
export async function getStagesEncadrant(encadrantId: number): Promise<Stage[]> {
  const response = await api.get<Stage[]>(`${BASE_URL}/encadrant/${encadrantId}`);
  return response.data;
}

/**
 * Récupère les statistiques des stages.
 */
export async function getStatistiquesStages(anneeId: number): Promise<StatistiquesStages> {
  const response = await api.get<StatistiquesStages>(`${BASE_URL}/statistiques`, {
    params: { annee_id: anneeId },
  });
  return response.data;
}

export const stageService = {
  getStages,
  getStageById,
  createStage,
  updateStage,
  deleteStage,
  validerStage,
  terminerStage,
  getStagesEtudiant,
  getStagesEncadrant,
  getStatistiquesStages,
};

export default stageService;
