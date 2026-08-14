/**
 * Service pour la gestion des modules
 */

import api from './api';
import type {
  Module,
  CreateModule,
  UpdateModule,
  Matiere,
  CountResponse,
  MessageResponse,
} from '../types/reference';

interface GetModulesParams {
  skip?: number;
  limit?: number;
  search?: string;
  type_module?: string;
}

/**
 * Récupère la liste des modules.
 */
export async function getModules(params?: GetModulesParams): Promise<Module[]> {
  const response = await api.get<Module[]>('/api/v1/modules/', { params });
  return response.data;
}

/**
 * Récupère un module par son ID.
 */
export async function getModuleById(id: number): Promise<Module> {
  const response = await api.get<Module>(`/api/v1/modules/${id}`);
  return response.data;
}

/**
 * Crée un nouveau module.
 */
export async function createModule(data: CreateModule): Promise<Module> {
  const response = await api.post<Module>('/api/v1/modules/', data);
  return response.data;
}

/**
 * Met à jour un module.
 */
export async function updateModule(id: number, data: UpdateModule): Promise<Module> {
  const response = await api.put<Module>(`/api/v1/modules/${id}`, data);
  return response.data;
}

/**
 * Supprime un module.
 */
export async function deleteModule(id: number): Promise<MessageResponse> {
  const response = await api.delete<MessageResponse>(`/api/v1/modules/${id}`);
  return response.data;
}

/**
 * Récupère le nombre total de modules.
 */
export async function getModuleCount(type_module?: string): Promise<number> {
  const response = await api.get<CountResponse>('/api/v1/modules/count', {
    params: type_module ? { type_module } : undefined,
  });
  return response.data.total;
}

/**
 * Récupère les matières d'un module.
 */
export async function getMatieresByModule(
  id: number,
  params?: { skip?: number; limit?: number }
): Promise<Matiere[]> {
  const response = await api.get<Matiere[]>(
    `/api/v1/modules/${id}/matieres`,
    { params }
  );
  return response.data;
}
