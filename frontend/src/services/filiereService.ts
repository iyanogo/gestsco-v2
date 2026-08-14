/**
 * Service pour la gestion des filières
 */

import api from './api';
import type {
  Filiere,
  CreateFiliere,
  UpdateFiliere,
  CountResponse,
  MessageResponse,
} from '../types/reference';

interface GetFilieresParams {
  skip?: number;
  limit?: number;
  search?: string;
  departement_id?: number;
  cycle_id?: number;
}

/**
 * Récupère la liste des filières.
 */
export async function getFilieres(params?: GetFilieresParams): Promise<Filiere[]> {
  const response = await api.get<Filiere[]>('/api/v1/filieres/', { params });
  return response.data;
}

/**
 * Récupère une filière par son ID.
 */
export async function getFiliereById(id: number): Promise<Filiere> {
  const response = await api.get<Filiere>(`/api/v1/filieres/${id}`);
  return response.data;
}

/**
 * Crée une nouvelle filière.
 */
export async function createFiliere(data: CreateFiliere): Promise<Filiere> {
  const response = await api.post<Filiere>('/api/v1/filieres/', data);
  return response.data;
}

/**
 * Met à jour une filière.
 */
export async function updateFiliere(id: number, data: UpdateFiliere): Promise<Filiere> {
  const response = await api.put<Filiere>(`/api/v1/filieres/${id}`, data);
  return response.data;
}

/**
 * Supprime une filière.
 */
export async function deleteFiliere(id: number): Promise<MessageResponse> {
  const response = await api.delete<MessageResponse>(`/api/v1/filieres/${id}`);
  return response.data;
}

/**
 * Récupère le nombre total de filières.
 */
export async function getFiliereCount(departement_id?: number): Promise<number> {
  const response = await api.get<CountResponse>('/api/v1/filieres/count', {
    params: departement_id ? { departement_id } : undefined,
  });
  return response.data.total;
}
