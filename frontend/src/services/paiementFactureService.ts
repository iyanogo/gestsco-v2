import api from './api';
import {
  Paiement,
  PaiementWithDetails,
  CreatePaiement,
  UpdatePaiement,
  StatistiquesPaiements,
} from '../types/finance';

const BASE_URL = '/api/v1/paiements-factures';

export const paiementFactureService = {
  getPaiements: async (params?: {
    skip?: number;
    limit?: number;
    facture_id?: number;
    etudiant_id?: number;
    date_debut?: string;
    date_fin?: string;
    statut?: string;
    mode_paiement?: string;
  }): Promise<Paiement[]> => {
    const response = await api.get<Paiement[]>(BASE_URL, { params });
    return response.data;
  },

  getPaiementsEnAttente: async (): Promise<Paiement[]> => {
    const response = await api.get<Paiement[]>(`${BASE_URL}/en-attente`);
    return response.data;
  },

  getStatistiquesPaiements: async (
    annee_id?: number,
    mode_paiement?: string
  ): Promise<StatistiquesPaiements> => {
    const response = await api.get<StatistiquesPaiements>(`${BASE_URL}/statistiques`, {
      params: { annee_id, mode_paiement },
    });
    return response.data;
  },

  getPaiementsEtudiant: async (
    etudiant_id: number,
    date_debut?: string,
    date_fin?: string
  ): Promise<Paiement[]> => {
    const response = await api.get<Paiement[]>(`${BASE_URL}/etudiant/${etudiant_id}`, {
      params: { date_debut, date_fin },
    });
    return response.data;
  },

  getPaiementById: async (id: number): Promise<PaiementWithDetails> => {
    const response = await api.get<PaiementWithDetails>(`${BASE_URL}/${id}`);
    return response.data;
  },

  downloadRecuPDF: async (id: number): Promise<Blob> => {
    const response = await api.get(`${BASE_URL}/${id}/recu`, {
      responseType: 'blob',
    });
    return response.data;
  },

  createPaiement: async (
    data: CreatePaiement,
    fichier_preuve?: File
  ): Promise<Paiement> => {
    if (fichier_preuve) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, String(value));
        }
      });
      formData.append('fichier_preuve', fichier_preuve);
      const response = await api.post<Paiement>(BASE_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    }
    const response = await api.post<Paiement>(BASE_URL, data);
    return response.data;
  },

  enregistrerPaiement: async (data: CreatePaiement): Promise<Paiement> => {
    const response = await api.post<Paiement>(`${BASE_URL}/enregistrer`, data);
    return response.data;
  },

  updatePaiement: async (id: number, data: UpdatePaiement): Promise<Paiement> => {
    const response = await api.put<Paiement>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  validerPaiement: async (id: number): Promise<Paiement> => {
    const response = await api.patch<Paiement>(`${BASE_URL}/${id}/valider`);
    return response.data;
  },

  rejeterPaiement: async (id: number, motif_rejet: string): Promise<Paiement> => {
    const response = await api.patch<Paiement>(`${BASE_URL}/${id}/rejeter`, {
      motif_rejet,
    });
    return response.data;
  },

  annulerPaiement: async (id: number): Promise<Paiement> => {
    const response = await api.patch<Paiement>(`${BASE_URL}/${id}/annuler`);
    return response.data;
  },

  deletePaiement: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },
};

export default paiementFactureService;
