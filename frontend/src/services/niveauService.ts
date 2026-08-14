/**
 * Service pour la gestion des niveaux
 */

import api from './api';
import type {
  Niveau,
  CreateNiveau,
  UpdateNiveau,
  CountResponse,
  MessageResponse,
} from '../types/reference';

interface GetNiveauxParams {
  skip?: number;
  limit?: number;
  cycle_id?: number;
}

/**
 * Récupère la liste des niveaux (triés par ordre).
 */
export async function getNiveaux(params?: GetNiveauxParams): Promise<Niveau[]> {
  const response = await api.get<Niveau[]>('/api/v1/niveaux/', { params });
  return response.data;
}

/**
 * Récupère un niveau par son ID.
 */
export async function getNiveauById(id: number): Promise<Niveau> {
  const response = await api.get<Niveau>(`/api/v1/niveaux/${id}`);
  return response.data;
}

/**
 * Crée un nouveau niveau.
 */
export async function createNiveau(data: CreateNiveau): Promise<Niveau> {
  const response = await api.post<Niveau>('/api/v1/niveaux/', data);
  return response.data;
}

/**
 * Met à jour un niveau.
 */
export async function updateNiveau(id: number, data: UpdateNiveau): Promise<Niveau> {
  const response = await api.put<Niveau>(`/api/v1/niveaux/${id}`, data);
  return response.data;
}

/**
 * Supprime un niveau.
 */
export async function deleteNiveau(id: number): Promise<MessageResponse> {
  const response = await api.delete<MessageResponse>(`/api/v1/niveaux/${id}`);
  return response.data;
}

/**
 * Récupère le nombre total de niveaux.
 */
export async function getNiveauCount(cycle_id?: number): Promise<number> {
  const response = await api.get<CountResponse>('/api/v1/niveaux/count', {
    params: cycle_id ? { cycle_id } : undefined,
  });
  return response.data.total;
}
