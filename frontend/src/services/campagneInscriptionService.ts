/**
 * Service pour la gestion des campagnes d'inscription
 */

import api from './api';
import {
  CampagneInscription,
  CreateCampagneInscription,
  UpdateCampagneInscription,
  CampagneStatistiques,
  PlacesRestantes,
} from '../types/inscription';

const BASE_URL = '/api/v1/campagnes-inscription';

export interface CampagneParams {
  skip?: number;
  limit?: number;
  annee_id?: number;
  cycle_id?: number;
  statut?: string;
}

export const campagneInscriptionService = {
  /**
   * Liste toutes les campagnes d'inscription
   */
  async getCampagnes(params?: CampagneParams): Promise<CampagneInscription[]> {
    const response = await api.get<CampagneInscription[]>(BASE_URL, { params });
    return response.data;
  },

  /**
   * Liste les campagnes ouvertes
   */
  async getCampagnesOuvertes(): Promise<CampagneInscription[]> {
    const response = await api.get<CampagneInscription[]>(`${BASE_URL}/ouvertes`);
    return response.data;
  },

  /**
   * Récupère une campagne par son ID
   */
  async getCampagneById(id: number): Promise<CampagneInscription> {
    const response = await api.get<CampagneInscription>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Récupère les statistiques d'une campagne
   */
  async getStatistiques(id: number): Promise<CampagneStatistiques> {
    const response = await api.get<CampagneStatistiques>(`${BASE_URL}/${id}/statistiques`);
    return response.data;
  },

  /**
   * Récupère le nombre de places restantes
   */
  async getPlacesRestantes(id: number): Promise<PlacesRestantes> {
    const response = await api.get<PlacesRestantes>(`${BASE_URL}/${id}/places-restantes`);
    return response.data;
  },

  /**
   * Crée une nouvelle campagne
   */
  async createCampagne(data: CreateCampagneInscription): Promise<CampagneInscription> {
    const response = await api.post<CampagneInscription>(BASE_URL, data);
    return response.data;
  },

  /**
   * Met à jour une campagne
   */
  async updateCampagne(id: number, data: UpdateCampagneInscription): Promise<CampagneInscription> {
    const response = await api.put<CampagneInscription>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Ouvre une campagne
   */
  async ouvrirCampagne(id: number): Promise<CampagneInscription> {
    const response = await api.patch<CampagneInscription>(`${BASE_URL}/${id}/ouvrir`);
    return response.data;
  },

  /**
   * Clôture une campagne
   */
  async cloturerCampagne(id: number): Promise<CampagneInscription> {
    const response = await api.patch<CampagneInscription>(`${BASE_URL}/${id}/cloturer`);
    return response.data;
  },

  /**
   * Supprime une campagne
   */
  async deleteCampagne(id: number): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`);
  },
};

export default campagneInscriptionService;
