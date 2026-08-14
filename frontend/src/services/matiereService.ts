/**
 * Service pour la gestion des matières
 */

import api from './api';
import type {
  Matiere,
  CreateMatiere,
  UpdateMatiere,
  CountResponse,
  MessageResponse,
  VolumeHoraireResponse,
} from '../types/reference';

interface GetMatieresParams {
  skip?: number;
  limit?: number;
  search?: string;
  module_id?: number;
}

/**
 * Récupère la liste des matières.
 */
export async function getMatieres(params?: GetMatieresParams): Promise<Matiere[]> {
  const response = await api.get<Matiere[]>('/api/v1/matieres/', { params });
  return response.data;
}

/**
 * Récupère une matière par son ID.
 */
export async function getMatiereById(id: number): Promise<Matiere> {
  const response = await api.get<Matiere>(`/api/v1/matieres/${id}`);
  return response.data;
}

/**
 * Crée une nouvelle matière.
 */
export async function createMatiere(data: CreateMatiere): Promise<Matiere> {
  const response = await api.post<Matiere>('/api/v1/matieres/', data);
  return response.data;
}

/**
 * Met à jour une matière.
 */
export async function updateMatiere(id: number, data: UpdateMatiere): Promise<Matiere> {
  const response = await api.put<Matiere>(`/api/v1/matieres/${id}`, data);
  return response.data;
}

/**
 * Supprime une matière.
 */
export async function deleteMatiere(id: number): Promise<MessageResponse> {
  const response = await api.delete<MessageResponse>(`/api/v1/matieres/${id}`);
  return response.data;
}

/**
 * Récupère le nombre total de matières.
 */
export async function getMatiereCount(module_id?: number): Promise<number> {
  const response = await api.get<CountResponse>('/api/v1/matieres/count', {
    params: module_id ? { module_id } : undefined,
  });
  return response.data.total;
}

/**
 * Récupère le volume horaire total d'une matière.
 */
export async function getMatiereVolumeHoraire(id: number): Promise<VolumeHoraireResponse> {
  const response = await api.get<VolumeHoraireResponse>(`/api/v1/matieres/${id}/volume-horaire`);
  return response.data;
}
