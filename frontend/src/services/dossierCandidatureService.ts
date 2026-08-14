/**
 * Service pour la gestion des dossiers de candidature
 */

import api from './api';
import {
  DossierCandidature,
  CreateDossierCandidature,
  UpdateDossierCandidature,
  DossierCandidatureDetails,
} from '../types/inscription';

const BASE_URL = '/dossiers-candidature';

export interface DossierParams {
  skip?: number;
  limit?: number;
  campagne_id?: number;
  statut?: string;
  nom?: string;
  email?: string;
}

export const dossierCandidatureService = {
  /**
   * Liste tous les dossiers de candidature
   */
  async getDossiers(params?: DossierParams): Promise<DossierCandidature[]> {
    const response = await api.get<DossierCandidature[]>(BASE_URL, { params });
    return response.data;
  },

  /**
   * Récupère un dossier par son ID
   */
  async getDossierById(id: number): Promise<DossierCandidature> {
    const response = await api.get<DossierCandidature>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Récupère un dossier par son numéro
   */
  async getDossierByNumero(numero: string): Promise<DossierCandidature> {
    const response = await api.get<DossierCandidature>(`${BASE_URL}/numero/${numero}`);
    return response.data;
  },

  /**
   * Récupère un dossier avec ses détails complets
   */
  async getDossierDetails(id: number): Promise<DossierCandidatureDetails> {
    const response = await api.get<DossierCandidatureDetails>(`${BASE_URL}/${id}/details`);
    return response.data;
  },

  /**
   * Crée un nouveau dossier de candidature
   */
  async createDossier(data: CreateDossierCandidature): Promise<DossierCandidature> {
    const response = await api.post<DossierCandidature>(BASE_URL, data);
    return response.data;
  },

  /**
   * Met à jour un dossier
   */
  async updateDossier(id: number, data: UpdateDossierCandidature): Promise<DossierCandidature> {
    const response = await api.put<DossierCandidature>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Soumet un dossier
   */
  async soumettreDossier(id: number): Promise<DossierCandidature> {
    const response = await api.patch<DossierCandidature>(`${BASE_URL}/${id}/soumettre`);
    return response.data;
  },

  /**
   * Valide un dossier
   */
  async validerDossier(id: number, commentaire?: string): Promise<DossierCandidature> {
    const response = await api.patch<DossierCandidature>(`${BASE_URL}/${id}/valider`, {
      commentaire,
    });
    return response.data;
  },

  /**
   * Refuse un dossier
   */
  async refuserDossier(id: number, commentaire: string): Promise<DossierCandidature> {
    const response = await api.patch<DossierCandidature>(`${BASE_URL}/${id}/refuser`, {
      commentaire,
    });
    return response.data;
  },

  /**
   * Admet un candidat
   */
  async admettreCandidat(id: number, filiere_id: number): Promise<DossierCandidature> {
    const response = await api.patch<DossierCandidature>(`${BASE_URL}/${id}/admettre`, {
      filiere_id,
    });
    return response.data;
  },

  /**
   * Supprime un dossier
   */
  async deleteDossier(id: number): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`);
  },

  /**
   * Compte les dossiers
   */
  async getDossierCount(params?: { campagne_id?: number; statut?: string }): Promise<number> {
    const response = await api.get<{ count: number }>(`${BASE_URL}/count`, { params });
    return response.data.count;
  },
};

export default dossierCandidatureService;
