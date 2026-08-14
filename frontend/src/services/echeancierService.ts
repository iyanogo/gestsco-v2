import api from './api';
import { Echeancier, CreateEcheancier, UpdateEcheancier } from '../types/finance';

const BASE_URL = '/echeanciers';

export const echeancierService = {
  getEcheanciers: async (params?: {
    skip?: number;
    limit?: number;
    etudiant_id?: number;
    facture_id?: number;
    statut?: string;
  }): Promise<Echeancier[]> => {
    const response = await api.get<Echeancier[]>(BASE_URL, { params });
    return response.data;
  },

  getEcheancesProches: async (jours: number = 7): Promise<Echeancier[]> => {
    const response = await api.get<Echeancier[]>(`${BASE_URL}/proches`, {
      params: { jours },
    });
    return response.data;
  },

  getEcheancesRetard: async (): Promise<Echeancier[]> => {
    const response = await api.get<Echeancier[]>(`${BASE_URL}/retard`);
    return response.data;
  },

  getEcheancierFacture: async (facture_id: number): Promise<Echeancier[]> => {
    const response = await api.get<Echeancier[]>(`${BASE_URL}/facture/${facture_id}`);
    return response.data;
  },

  getEcheancesEtudiant: async (
    etudiant_id: number,
    statut?: string
  ): Promise<Echeancier[]> => {
    const response = await api.get<Echeancier[]>(`${BASE_URL}/etudiant/${etudiant_id}`, {
      params: { statut },
    });
    return response.data;
  },

  createEcheancier: async (data: CreateEcheancier): Promise<Echeancier[]> => {
    const response = await api.post<Echeancier[]>(BASE_URL, data);
    return response.data;
  },

  updateEcheancier: async (id: number, data: UpdateEcheancier): Promise<Echeancier> => {
    const response = await api.put<Echeancier>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  mettreAJourStatuts: async (): Promise<number> => {
    const response = await api.patch<{ echeances_mises_a_jour: number }>(
      `${BASE_URL}/mettre-a-jour-statuts`
    );
    return response.data.echeances_mises_a_jour;
  },

  deleteEcheancier: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },
};

export default echeancierService;
