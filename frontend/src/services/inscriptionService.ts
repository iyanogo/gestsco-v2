/**
 * Service pour la gestion des inscriptions
 */

import api from './api';
import type {
  Inscription,
  CreateInscription,
  UpdateInscription,
  InscriptionWithMatieres,
  InscriptionStatistiques,
  InscriptionMatiere,
  CreateInscriptionMatiere,
  BulkCreateInscriptionMatiere,
} from '../types/etudiant';
import type { CountResponse, MessageResponse } from '../types/reference';

interface GetInscriptionsParams {
  skip?: number;
  limit?: number;
  etudiant_id?: number;
  filiere_id?: number;
  niveau_id?: number;
  annee_academique?: string;
  statut?: string;
}

/**
 * Récupère la liste des inscriptions.
 */
export async function getInscriptions(params?: GetInscriptionsParams): Promise<Inscription[]> {
  const response = await api.get<Inscription[]>('/api/v1/inscriptions/', { params });
  return response.data;
}

/**
 * Récupère une inscription par son ID.
 */
export async function getInscriptionById(id: number): Promise<Inscription> {
  const response = await api.get<Inscription>(`/api/v1/inscriptions/${id}`);
  return response.data;
}

/**
 * Récupère une inscription avec ses matières.
 */
export async function getInscriptionWithMatieres(id: number): Promise<InscriptionWithMatieres> {
  const response = await api.get<InscriptionWithMatieres>(`/api/v1/inscriptions/${id}/matieres`);
  return response.data;
}

/**
 * Récupère les inscriptions d'un étudiant.
 */
export async function getInscriptionsByEtudiant(etudiant_id: number): Promise<Inscription[]> {
  const response = await api.get<Inscription[]>(`/api/v1/inscriptions/etudiant/${etudiant_id}`);
  return response.data;
}

/**
 * Récupère l'inscription active d'un étudiant.
 */
export async function getCurrentInscription(etudiant_id: number): Promise<Inscription | null> {
  try {
    const response = await api.get<Inscription>(`/api/v1/inscriptions/etudiant/${etudiant_id}/current`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Crée une nouvelle inscription.
 */
export async function createInscription(data: CreateInscription): Promise<Inscription> {
  const response = await api.post<Inscription>('/api/v1/inscriptions/', data);
  return response.data;
}

/**
 * Met à jour une inscription.
 */
export async function updateInscription(id: number, data: UpdateInscription): Promise<Inscription> {
  const response = await api.put<Inscription>(`/api/v1/inscriptions/${id}`, data);
  return response.data;
}

/**
 * Valide une inscription.
 */
export async function validerInscription(id: number): Promise<Inscription> {
  const response = await api.patch<Inscription>(`/api/v1/inscriptions/${id}/valider`);
  return response.data;
}

/**
 * Annule une inscription.
 */
export async function annulerInscription(id: number, raison: string): Promise<Inscription> {
  const response = await api.patch<Inscription>(`/api/v1/inscriptions/${id}/annuler`, { raison });
  return response.data;
}

/**
 * Supprime une inscription.
 */
export async function deleteInscription(id: number): Promise<MessageResponse> {
  const response = await api.delete<MessageResponse>(`/api/v1/inscriptions/${id}`);
  return response.data;
}

/**
 * Récupère le nombre d'inscriptions.
 */
export async function getInscriptionCount(annee_academique?: string, filiere_id?: number): Promise<number> {
  const params: Record<string, any> = {};
  if (annee_academique) params.annee_academique = annee_academique;
  if (filiere_id) params.filiere_id = filiere_id;
  const response = await api.get<CountResponse>('/api/v1/inscriptions/count', { params });
  return response.data.total;
}

/**
 * Récupère les statistiques d'une année académique.
 */
export async function getStatistiquesAnnee(annee: string): Promise<InscriptionStatistiques> {
  const response = await api.get<InscriptionStatistiques>(`/api/v1/inscriptions/statistiques/${annee}`);
  return response.data;
}

// ============ Inscriptions Matières ============

/**
 * Récupère les matières d'une inscription.
 */
export async function getMatieresByInscription(inscription_id: number, semestre?: number): Promise<InscriptionMatiere[]> {
  const params = semestre ? { semestre } : undefined;
  const response = await api.get<InscriptionMatiere[]>(
    `/api/v1/inscriptions-matieres/inscription/${inscription_id}`,
    { params }
  );
  return response.data;
}

/**
 * Inscrit un étudiant à une matière.
 */
export async function createInscriptionMatiere(data: CreateInscriptionMatiere): Promise<InscriptionMatiere> {
  const response = await api.post<InscriptionMatiere>('/api/v1/inscriptions-matieres/', data);
  return response.data;
}

/**
 * Inscrit un étudiant à plusieurs matières.
 */
export async function bulkCreateInscriptionMatieres(data: BulkCreateInscriptionMatiere): Promise<{
  message: string;
  created_count: number;
  inscriptions_matieres: InscriptionMatiere[];
}> {
  const response = await api.post('/api/v1/inscriptions-matieres/bulk', data);
  return response.data;
}

/**
 * Supprime une inscription matière.
 */
export async function deleteInscriptionMatiere(id: number): Promise<MessageResponse> {
  const response = await api.delete<MessageResponse>(`/api/v1/inscriptions-matieres/${id}`);
  return response.data;
}
