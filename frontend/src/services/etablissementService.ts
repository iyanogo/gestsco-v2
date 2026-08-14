/**
 * Service pour la gestion des établissements
 */

import api from './api';
import type {
  Etablissement,
  CreateEtablissement,
  UpdateEtablissement,
  Departement,
  CountResponse,
  MessageResponse,
} from '../types/reference';

interface GetEtablissementsParams {
  skip?: number;
  limit?: number;
  search?: string;
  universite_id?: number;
}

/**
 * Récupère la liste des établissements.
 */
export async function getEtablissements(params?: GetEtablissementsParams): Promise<Etablissement[]> {
  const response = await api.get<Etablissement[]>('/api/v1/etablissements/', { params });
  return response.data;
}

/**
 * Récupère un établissement par son ID.
 */
export async function getEtablissementById(id: number): Promise<Etablissement> {
  const response = await api.get<Etablissement>(`/api/v1/etablissements/${id}`);
  return response.data;
}

/**
 * Crée un nouvel établissement.
 */
export async function createEtablissement(data: CreateEtablissement): Promise<Etablissement> {
  const response = await api.post<Etablissement>('/api/v1/etablissements/', data);
  return response.data;
}

/**
 * Met à jour un établissement.
 */
export async function updateEtablissement(id: number, data: UpdateEtablissement): Promise<Etablissement> {
  const response = await api.put<Etablissement>(`/api/v1/etablissements/${id}`, data);
  return response.data;
}

/**
 * Supprime un établissement.
 */
export async function deleteEtablissement(id: number): Promise<MessageResponse> {
  const response = await api.delete<MessageResponse>(`/api/v1/etablissements/${id}`);
  return response.data;
}

/**
 * Récupère le nombre total d'établissements.
 */
export async function getEtablissementCount(universite_id?: number): Promise<number> {
  const response = await api.get<CountResponse>('/api/v1/etablissements/count', {
    params: universite_id ? { universite_id } : undefined,
  });
  return response.data.total;
}

/**
 * Récupère les départements d'un établissement.
 */
export async function getDepartementsByEtablissement(
  id: number,
  params?: { skip?: number; limit?: number }
): Promise<Departement[]> {
  const response = await api.get<Departement[]>(
    `/api/v1/etablissements/${id}/departements`,
    { params }
  );
  return response.data;
}
