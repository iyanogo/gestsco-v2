/**
 * Service pour la gestion des étudiants
 */

import api from './api';
import type {
  Etudiant,
  CreateEtudiant,
  UpdateEtudiant,
  EtudiantWithDetails,
  EtudiantStatistiques,
} from '../types/etudiant';
import type { CountResponse, MessageResponse } from '../types/reference';

interface GetEtudiantsParams {
  skip?: number;
  limit?: number;
  search?: string;
  statut?: string;
  nom?: string;
  prenom?: string;
  matricule?: string;
}

/**
 * Récupère la liste des étudiants.
 */
export async function getEtudiants(params?: GetEtudiantsParams): Promise<Etudiant[]> {
  const response = await api.get<Etudiant[]>('/api/v1/etudiants/', { params });
  return response.data;
}

/**
 * Récupère un étudiant par son ID.
 */
export async function getEtudiantById(id: number): Promise<Etudiant> {
  const response = await api.get<Etudiant>(`/api/v1/etudiants/${id}`);
  return response.data;
}

/**
 * Récupère un étudiant par son matricule.
 */
export async function getEtudiantByMatricule(matricule: string): Promise<Etudiant> {
  const response = await api.get<Etudiant>(`/api/v1/etudiants/matricule/${matricule}`);
  return response.data;
}

/**
 * Récupère un étudiant avec ses documents et inscriptions.
 */
export async function getEtudiantDetails(id: number): Promise<EtudiantWithDetails> {
  const response = await api.get<EtudiantWithDetails>(`/api/v1/etudiants/${id}/details`);
  return response.data;
}

/**
 * Crée un nouvel étudiant.
 */
export async function createEtudiant(data: CreateEtudiant): Promise<Etudiant> {
  const response = await api.post<Etudiant>('/api/v1/etudiants/', data);
  return response.data;
}

/**
 * Met à jour un étudiant.
 */
export async function updateEtudiant(id: number, data: UpdateEtudiant): Promise<Etudiant> {
  const response = await api.put<Etudiant>(`/api/v1/etudiants/${id}`, data);
  return response.data;
}

/**
 * Met à jour la photo d'un étudiant.
 */
export async function updatePhoto(id: number, photo_url: string): Promise<Etudiant> {
  const response = await api.patch<Etudiant>(`/api/v1/etudiants/${id}/photo`, { photo_url });
  return response.data;
}

/**
 * Change le statut d'un étudiant.
 */
export async function changeStatut(id: number, statut: string): Promise<Etudiant> {
  const response = await api.patch<Etudiant>(`/api/v1/etudiants/${id}/statut`, { statut });
  return response.data;
}

/**
 * Supprime un étudiant.
 */
export async function deleteEtudiant(id: number): Promise<MessageResponse> {
  const response = await api.delete<MessageResponse>(`/api/v1/etudiants/${id}`);
  return response.data;
}

/**
 * Récupère le nombre total d'étudiants.
 */
export async function getEtudiantCount(statut?: string): Promise<number> {
  const params = statut ? { statut } : undefined;
  const response = await api.get<CountResponse>('/api/v1/etudiants/count', { params });
  return response.data.total;
}

/**
 * Récupère les statistiques des étudiants.
 */
export async function getStatistiques(): Promise<EtudiantStatistiques> {
  const response = await api.get<EtudiantStatistiques>('/api/v1/etudiants/statistiques');
  return response.data;
}
