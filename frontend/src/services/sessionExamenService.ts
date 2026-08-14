/**
 * Service pour la gestion des sessions d'examen
 */

import api from './api';
import {
  SessionExamen,
  CreateSessionExamen,
  UpdateSessionExamen,
} from '../types/evaluation';

const BASE_URL = '/sessions-examen';

export interface SessionExamenParams {
  skip?: number;
  limit?: number;
  annee_id?: number;
  semestre?: number;
  statut?: string;
}

export const sessionExamenService = {
  /**
   * Récupère la liste des sessions d'examen
   */
  async getSessions(params?: SessionExamenParams): Promise<SessionExamen[]> {
    const response = await api.get<SessionExamen[]>(BASE_URL, { params });
    return response.data;
  },

  /**
   * Récupère une session par son ID
   */
  async getSessionById(id: number): Promise<SessionExamen> {
    const response = await api.get<SessionExamen>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Récupère la session active
   */
  async getSessionActive(): Promise<SessionExamen | null> {
    try {
      const response = await api.get<SessionExamen>(`${BASE_URL}/active`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Récupère les sessions en cours
   */
  async getSessionsEnCours(): Promise<SessionExamen[]> {
    const response = await api.get<SessionExamen[]>(`${BASE_URL}/en-cours`);
    return response.data;
  },

  /**
   * Crée une nouvelle session
   */
  async createSession(data: CreateSessionExamen): Promise<SessionExamen> {
    const response = await api.post<SessionExamen>(BASE_URL, data);
    return response.data;
  },

  /**
   * Met à jour une session
   */
  async updateSession(id: number, data: UpdateSessionExamen): Promise<SessionExamen> {
    const response = await api.put<SessionExamen>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Ouvre une session (statut = en_cours)
   */
  async ouvrirSession(id: number): Promise<SessionExamen> {
    const response = await api.patch<SessionExamen>(`${BASE_URL}/${id}/ouvrir`);
    return response.data;
  },

  /**
   * Clôture une session (statut = cloturee)
   */
  async cloturerSession(id: number): Promise<SessionExamen> {
    const response = await api.patch<SessionExamen>(`${BASE_URL}/${id}/cloturer`);
    return response.data;
  },

  /**
   * Valide une session (statut = validee)
   */
  async validerSession(id: number): Promise<SessionExamen> {
    const response = await api.patch<SessionExamen>(`${BASE_URL}/${id}/valider`);
    return response.data;
  },

  /**
   * Supprime une session
   */
  async deleteSession(id: number): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`);
  },
};

export default sessionExamenService;
