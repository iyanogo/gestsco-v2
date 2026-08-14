import api from './api';
import {
  Facture,
  FactureWithDetails,
  CreateFacture,
  UpdateFacture,
  StatistiquesFinances,
} from '../types/finance';

const BASE_URL = '/factures';

export const factureService = {
  getFactures: async (params?: {
    skip?: number;
    limit?: number;
    etudiant_id?: number;
    annee_id?: number;
    statut?: string;
    type_facture?: string;
  }): Promise<Facture[]> => {
    const response = await api.get<Facture[]>(BASE_URL, { params });
    return response.data;
  },

  getFacturesImpayees: async (): Promise<Facture[]> => {
    const response = await api.get<Facture[]>(`${BASE_URL}/impayees`);
    return response.data;
  },

  getFacturesExpirees: async (): Promise<Facture[]> => {
    const response = await api.get<Facture[]>(`${BASE_URL}/expirees`);
    return response.data;
  },

  getStatistiquesFactures: async (
    annee_id?: number,
    date_debut?: string,
    date_fin?: string
  ): Promise<StatistiquesFinances> => {
    const response = await api.get<StatistiquesFinances>(`${BASE_URL}/statistiques`, {
      params: { annee_id, date_debut, date_fin },
    });
    return response.data;
  },

  getFacturesEtudiant: async (
    etudiant_id: number,
    annee_id?: number
  ): Promise<Facture[]> => {
    const response = await api.get<Facture[]>(`${BASE_URL}/etudiant/${etudiant_id}`, {
      params: { annee_id },
    });
    return response.data;
  },

  getFactureById: async (id: number): Promise<FactureWithDetails> => {
    const response = await api.get<FactureWithDetails>(`${BASE_URL}/${id}`);
    return response.data;
  },

  downloadFacturePDF: async (id: number): Promise<Blob> => {
    const response = await api.get(`${BASE_URL}/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  createFacture: async (data: CreateFacture): Promise<Facture> => {
    const response = await api.post<Facture>(BASE_URL, data);
    return response.data;
  },

  genererFactureAutomatique: async (
    etudiant_id: number,
    annee_id: number,
    type_facture: string
  ): Promise<Facture> => {
    const response = await api.post<Facture>(`${BASE_URL}/generer-automatique`, {
      etudiant_id,
      annee_id,
      type_facture,
    });
    return response.data;
  },

  updateFacture: async (id: number, data: UpdateFacture): Promise<Facture> => {
    const response = await api.put<Facture>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  validerFacture: async (id: number): Promise<Facture> => {
    const response = await api.patch<Facture>(`${BASE_URL}/${id}/valider`);
    return response.data;
  },

  annulerFacture: async (id: number, motif: string): Promise<Facture> => {
    const response = await api.patch<Facture>(`${BASE_URL}/${id}/annuler`, {
      motif_annulation: motif,
    });
    return response.data;
  },

  deleteFacture: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },
};

export default factureService;
