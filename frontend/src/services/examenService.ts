/**
 * Service pour la gestion des examens
 */

import api from './api';
import {
  Examen,
  CreateExamen,
  UpdateExamen,
  StatistiquesExamen,
} from '../types/evaluation';

const BASE_URL = '/api/v1/examens';

export interface ExamenParams {
  skip?: number;
  limit?: number;
  session_id?: number;
  matiere_id?: number;
  niveau_id?: number;
  type_evaluation?: string;
  enseignant_id?: number;
  statut?: string;
}

export const examenService = {
  /**
   * Récupère la liste des examens
   */
  async getExamens(params?: ExamenParams): Promise<Examen[]> {
    const response = await api.get<Examen[]>(BASE_URL, { params });
    return response.data;
  },

  /**
   * Récupère un examen par son ID
   */
  async getExamenById(id: number): Promise<Examen> {
    const response = await api.get<Examen>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Récupère les statistiques d'un examen
   */
  async getStatistiques(id: number): Promise<StatistiquesExamen> {
    const response = await api.get<StatistiquesExamen>(`${BASE_URL}/${id}/statistiques`);
    return response.data;
  },

  /**
   * Crée un nouvel examen
   */
  async createExamen(data: CreateExamen): Promise<Examen> {
    const response = await api.post<Examen>(BASE_URL, data);
    return response.data;
  },

  /** Portail enseignant - création examen avec garde-fous backend (idempotent si existe). */
  async createExamenEnseignant(data: CreateExamen): Promise<Examen> {
    const response = await api.post<Examen>(`${BASE_URL}/saisie-enseignant`, data);
    return response.data;
  },

  async getExamenMatch(params: {
    session_id: number;
    matiere_id: number;
    niveau_id: number;
    type_evaluation: string;
  }): Promise<Examen> {
    const response = await api.get<Examen>(`${BASE_URL}/match`, { params });
    return response.data;
  },

  /**
   * Met à jour un examen
   */
  async updateExamen(id: number, data: UpdateExamen): Promise<Examen> {
    const response = await api.put<Examen>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Marque un examen comme terminé
   */
  async terminerExamen(id: number): Promise<Examen> {
    const response = await api.patch<Examen>(`${BASE_URL}/${id}/terminer`);
    return response.data;
  },

  /**
   * Marque les notes comme saisies
   */
  async marquerNotesSaisies(id: number): Promise<Examen> {
    const response = await api.patch<Examen>(`${BASE_URL}/${id}/notes-saisies`);
    return response.data;
  },

  /**
   * Valide un examen
   */
  async validerExamen(id: number): Promise<Examen> {
    const response = await api.patch<Examen>(`${BASE_URL}/${id}/valider`);
    return response.data;
  },

  /**
   * Supprime un examen
   */
  async deleteExamen(id: number): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`);
  },
};

export default examenService;
