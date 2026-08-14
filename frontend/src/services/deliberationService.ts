/**
 * Service pour la gestion des délibérations
 */

import api from './api';
import {
  Deliberation,
  CreateDeliberation,
  UpdateDeliberation,
  StatistiquesDeliberation,
} from '../types/evaluation';

const BASE_URL = '/deliberations';

export interface DeliberationParams {
  skip?: number;
  limit?: number;
  session_id?: number;
  niveau_id?: number;
  filiere_id?: number;
  statut?: string;
}

export const deliberationService = {
  /**
   * Récupère la liste des délibérations
   */
  async getDeliberations(params?: DeliberationParams): Promise<Deliberation[]> {
    const response = await api.get<Deliberation[]>(BASE_URL, { params });
    return response.data;
  },

  /**
   * Récupère une délibération par son ID
   */
  async getDeliberationById(id: number): Promise<Deliberation> {
    const response = await api.get<Deliberation>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Récupère les statistiques d'une délibération
   */
  async getStatistiques(id: number): Promise<StatistiquesDeliberation> {
    const response = await api.get<StatistiquesDeliberation>(`${BASE_URL}/${id}/statistiques`);
    return response.data;
  },

  /**
   * Crée une nouvelle délibération
   */
  async createDeliberation(data: CreateDeliberation): Promise<Deliberation> {
    const response = await api.post<Deliberation>(BASE_URL, data);
    return response.data;
  },

  /**
   * Crée une délibération avec calcul automatique des statistiques
   */
  async creerDeliberationAuto(data: CreateDeliberation): Promise<{ message: string; deliberation: Deliberation }> {
    const response = await api.post<{ message: string; deliberation: Deliberation }>(`${BASE_URL}/creer`, data);
    return response.data;
  },

  /**
   * Met à jour une délibération
   */
  async updateDeliberation(id: number, data: UpdateDeliberation): Promise<Deliberation> {
    const response = await api.put<Deliberation>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Termine une délibération
   */
  async terminerDeliberation(id: number): Promise<Deliberation> {
    const response = await api.patch<Deliberation>(`${BASE_URL}/${id}/terminer`);
    return response.data;
  },

  /**
   * Valide une délibération
   */
  async validerDeliberation(id: number): Promise<Deliberation> {
    const response = await api.patch<Deliberation>(`${BASE_URL}/${id}/valider`);
    return response.data;
  },

  /**
   * Publie une délibération
   */
  async publierDeliberation(id: number): Promise<Deliberation> {
    const response = await api.patch<Deliberation>(`${BASE_URL}/${id}/publier`);
    return response.data;
  },

  /**
   * Actualise les statistiques d'une délibération
   */
  async actualiserStatistiques(id: number): Promise<{ message: string; deliberation: Deliberation }> {
    const response = await api.patch<{ message: string; deliberation: Deliberation }>(
      `${BASE_URL}/${id}/actualiser-stats`
    );
    return response.data;
  },

  /**
   * Supprime une délibération
   */
  async deleteDeliberation(id: number): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`);
  },
};

export default deliberationService;
