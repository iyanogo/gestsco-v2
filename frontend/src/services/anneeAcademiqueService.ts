/**
 * Service pour la gestion des années académiques
 */

import api from './api';
import {
  AnneeAcademique,
  CreateAnneeAcademique,
  UpdateAnneeAcademique,
} from '../types/inscription';

const BASE_URL = '/api/v1/annees-academiques';

export interface AnneeAcademiqueParams {
  skip?: number;
  limit?: number;
}

export const anneeAcademiqueService = {
  /**
   * Liste toutes les années académiques
   */
  async getAnnees(params?: AnneeAcademiqueParams): Promise<AnneeAcademique[]> {
    const response = await api.get<AnneeAcademique[]>(BASE_URL, { params });
    return response.data;
  },

  /**
   * Alias pour getAnnees - compatibilité
   */
  async getAll(params?: AnneeAcademiqueParams): Promise<AnneeAcademique[]> {
    return this.getAnnees(params);
  },

  /**
   * Récupère une année académique par son ID
   */
  async getAnneeById(id: number): Promise<AnneeAcademique> {
    const response = await api.get<AnneeAcademique>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Récupère l'année académique en cours
   */
  async getCurrentAnnee(): Promise<AnneeAcademique | null> {
    const response = await api.get<AnneeAcademique | null>(`${BASE_URL}/current`);
    return response.data;
  },

  /**
   * Récupère l'année académique active pour les inscriptions
   */
  async getActiveAnnee(): Promise<AnneeAcademique | null> {
    const response = await api.get<AnneeAcademique | null>(`${BASE_URL}/active`);
    return response.data;
  },

  /**
   * Crée une nouvelle année académique
   */
  async createAnnee(data: CreateAnneeAcademique): Promise<AnneeAcademique> {
    const response = await api.post<AnneeAcademique>(BASE_URL, data);
    return response.data;
  },

  /**
   * Met à jour une année académique
   */
  async updateAnnee(id: number, data: UpdateAnneeAcademique): Promise<AnneeAcademique> {
    const response = await api.put<AnneeAcademique>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Définit une année comme année en cours
   */
  async setAsCurrent(id: number): Promise<AnneeAcademique> {
    const response = await api.patch<AnneeAcademique>(`${BASE_URL}/${id}/set-current`);
    return response.data;
  },

  /**
   * Définit une année comme active pour les inscriptions
   */
  async setAsActive(id: number): Promise<AnneeAcademique> {
    const response = await api.patch<AnneeAcademique>(`${BASE_URL}/${id}/set-active`);
    return response.data;
  },

  /**
   * Supprime une année académique
   */
  async deleteAnnee(id: number): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`);
  },
};

export default anneeAcademiqueService;
