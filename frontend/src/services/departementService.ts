/**
 * Service pour la gestion des départements
 */

import api from './api';
import type {
  Departement,
  CreateDepartement,
  UpdateDepartement,
  Filiere,
  CountResponse,
  MessageResponse,
} from '../types/reference';

interface GetDepartementsParams {
  skip?: number;
  limit?: number;
  search?: string;
  etablissement_id?: number;
}

/**
 * Récupère la liste des départements.
 */
export async function getDepartements(params?: GetDepartementsParams): Promise<Departement[]> {
  const response = await api.get<Departement[]>('/api/v1/departements/', { params });
  return response.data;
}

/**
 * Récupère un département par son ID.
 */
export async function getDepartementById(id: number): Promise<Departement> {
  const response = await api.get<Departement>(`/api/v1/departements/${id}`);
  return response.data;
}

/**
 * Crée un nouveau département.
 */
export async function createDepartement(data: CreateDepartement): Promise<Departement> {
  const response = await api.post<Departement>('/api/v1/departements/', data);
  return response.data;
}

/**
 * Met à jour un département.
 */
export async function updateDepartement(id: number, data: UpdateDepartement): Promise<Departement> {
  const response = await api.put<Departement>(`/api/v1/departements/${id}`, data);
  return response.data;
}

/**
 * Supprime un département.
 */
export async function deleteDepartement(id: number): Promise<MessageResponse> {
  const response = await api.delete<MessageResponse>(`/api/v1/departements/${id}`);
  return response.data;
}

/**
 * Récupère le nombre total de départements.
 */
export async function getDepartementCount(etablissement_id?: number): Promise<number> {
  const response = await api.get<CountResponse>('/api/v1/departements/count', {
    params: etablissement_id ? { etablissement_id } : undefined,
  });
  return response.data.total;
}

/**
 * Récupère les filières d'un département.
 */
export async function getFilieresByDepartement(
  id: number,
  params?: { skip?: number; limit?: number }
): Promise<Filiere[]> {
  const response = await api.get<Filiere[]>(
    `/api/v1/departements/${id}/filieres`,
    { params }
  );
  return response.data;
}
