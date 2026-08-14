/**
 * Service pour la gestion des universités
 */

import api from './api';
import type {
  Universite,
  CreateUniversite,
  UpdateUniversite,
  Etablissement,
  CountResponse,
  MessageResponse,
} from '../types/reference';

interface GetUniversitesParams {
  skip?: number;
  limit?: number;
  search?: string;
}

/**
 * Récupère la liste des universités.
 */
export async function getUniversites(params?: GetUniversitesParams): Promise<Universite[]> {
  const response = await api.get<Universite[]>('/api/v1/universites/', { params });
  return response.data;
}

/**
 * Récupère une université par son ID.
 */
export async function getUniversiteById(id: number): Promise<Universite> {
  const response = await api.get<Universite>(`/api/v1/universites/${id}`);
  return response.data;
}

/**
 * Crée une nouvelle université.
 */
export async function createUniversite(data: CreateUniversite): Promise<Universite> {
  const response = await api.post<Universite>('/api/v1/universites/', data);
  return response.data;
}

/**
 * Met à jour une université.
 */
export async function updateUniversite(id: number, data: UpdateUniversite): Promise<Universite> {
  const response = await api.put<Universite>(`/api/v1/universites/${id}`, data);
  return response.data;
}

/**
 * Supprime une université.
 */
export async function deleteUniversite(id: number): Promise<MessageResponse> {
  const response = await api.delete<MessageResponse>(`/api/v1/universites/${id}`);
  return response.data;
}

/**
 * Récupère le nombre total d'universités.
 */
export async function getUniversiteCount(): Promise<number> {
  const response = await api.get<CountResponse>('/api/v1/universites/count');
  return response.data.total;
}

/**
 * Récupère les établissements d'une université.
 */
export async function getEtablissementsByUniversite(
  id: number,
  params?: { skip?: number; limit?: number }
): Promise<Etablissement[]> {
  const response = await api.get<Etablissement[]>(
    `/api/v1/universites/${id}/etablissements`,
    { params }
  );
  return response.data;
}
