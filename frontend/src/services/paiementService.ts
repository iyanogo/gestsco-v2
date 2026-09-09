/**
 * Service pour la gestion des paiements
 */

import api from './api';
import { Paiement, CreatePaiement } from '../types/inscription';

const BASE_URL = '/api/v1/paiements';

export interface PaiementParams {
  skip?: number;
  limit?: number;
  statut?: string;
  dossier_id?: number;
  inscrit_id?: number;
}

export const paiementService = {
  /**
   * Liste tous les paiements
   */
  async getPaiements(params?: PaiementParams): Promise<Paiement[]> {
    const response = await api.get<Paiement[]>(BASE_URL, { params });
    return response.data;
  },

  /**
   * Liste les paiements en attente de validation
   */
  async getPaiementsEnAttente(): Promise<Paiement[]> {
    const response = await api.get<Paiement[]>(`${BASE_URL}/en-attente`);
    return response.data;
  },

  /**
   * Récupère un paiement par son ID
   */
  async getPaiementById(id: number): Promise<Paiement> {
    const response = await api.get<Paiement>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Récupère un paiement par son numéro de transaction
   */
  async getPaiementByTransaction(numero: string): Promise<Paiement> {
    const response = await api.get<Paiement>(`${BASE_URL}/transaction/${numero}`);
    return response.data;
  },

  /**
   * Liste les paiements d'un dossier
   */
  async getPaiementsByDossier(dossier_id: number): Promise<Paiement[]> {
    const response = await api.get<Paiement[]>(`${BASE_URL}/dossier/${dossier_id}`);
    return response.data;
  },

  /**
   * Récupère le montant total payé pour un dossier
   */
  async getMontantTotalDossier(dossier_id: number): Promise<number> {
    const response = await api.get<{ dossier_id: number; montant_total: number }>(
      `${BASE_URL}/dossier/${dossier_id}/total`
    );
    return response.data.montant_total;
  },

  /**
   * Crée un nouveau paiement
   */
  async createPaiement(data: CreatePaiement): Promise<Paiement> {
    const response = await api.post<Paiement>(BASE_URL, data);
    return response.data;
  },

  /**
   * Valide un paiement
   */
  async validerPaiement(id: number, numero_recu?: string): Promise<Paiement> {
    const response = await api.patch<Paiement>(`${BASE_URL}/${id}/valider`, {
      numero_recu,
    });
    return response.data;
  },

  /**
   * Refuse un paiement
   */
  async refuserPaiement(id: number, commentaire: string): Promise<Paiement> {
    const response = await api.patch<Paiement>(`${BASE_URL}/${id}/refuser`, {
      commentaire,
    });
    return response.data;
  },

  /**
   * Supprime un paiement
   */
  async deletePaiement(id: number): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`);
  },
};

export default paiementService;
