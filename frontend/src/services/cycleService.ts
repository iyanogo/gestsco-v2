/**
 * Service pour la gestion des cycles
 */

import api from './api';
import type {
  Cycle,
  CreateCycle,
  UpdateCycle,
  Niveau,
  CountResponse,
  MessageResponse,
} from '../types/reference';

interface GetCyclesParams {
  skip?: number;
  limit?: number;
}

/**
 * Récupère la liste des cycles (triés par ordre).
 */
export async function getCycles(params?: GetCyclesParams): Promise<Cycle[]> {
  const response = await api.get<Cycle[]>('/api/v1/cycles/', { params });
  return response.data;
}

/**
 * Récupère un cycle par son ID.
 */
export async function getCycleById(id: number): Promise<Cycle> {
  const response = await api.get<Cycle>(`/api/v1/cycles/${id}`);
  return response.data;
}

/**
 * Crée un nouveau cycle.
 */
export async function createCycle(data: CreateCycle): Promise<Cycle> {
  const response = await api.post<Cycle>('/api/v1/cycles/', data);
  return response.data;
}

/**
 * Met à jour un cycle.
 */
export async function updateCycle(id: number, data: UpdateCycle): Promise<Cycle> {
  const response = await api.put<Cycle>(`/api/v1/cycles/${id}`, data);
  return response.data;
}

/**
 * Supprime un cycle.
 */
export async function deleteCycle(id: number): Promise<MessageResponse> {
  const response = await api.delete<MessageResponse>(`/api/v1/cycles/${id}`);
  return response.data;
}

/**
 * Récupère le nombre total de cycles.
 */
export async function getCycleCount(): Promise<number> {
  const response = await api.get<CountResponse>('/api/v1/cycles/count');
  return response.data.total;
}

/**
 * Récupère les niveaux d'un cycle.
 */
export async function getNiveauxByCycle(id: number): Promise<Niveau[]> {
  const response = await api.get<Niveau[]>(`/api/v1/cycles/${id}/niveaux`);
  return response.data;
}
