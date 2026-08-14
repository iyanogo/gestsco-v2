import api from './api';
import { 
  EmploiTemps, 
  CreateEmploiTemps, 
  UpdateEmploiTemps,
  EmploiTempsWithSeances 
} from '../types/emploiTemps';

const BASE_URL = '/emplois-temps';

export interface GetEmploisTempsParams {
  skip?: number;
  limit?: number;
  niveau_id?: number;
  filiere_id?: number;
  semestre?: number;
  annee_id?: number;
  statut?: string;
}

export const emploiTempsService = {
  getEmploisTemps: async (params?: GetEmploisTempsParams): Promise<EmploiTemps[]> => {
    const response = await api.get<EmploiTemps[]>(BASE_URL, { params });
    return response.data;
  },

  getEmploiTempsActif: async (
    niveau_id: number,
    filiere_id: number | null,
    semestre: number,
    annee_id: number
  ): Promise<EmploiTemps | null> => {
    try {
      const response = await api.get<EmploiTemps>(`${BASE_URL}/actif`, {
        params: { niveau_id, filiere_id, semestre, annee_id },
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  getEmploiTempsById: async (id: number): Promise<EmploiTemps> => {
    const response = await api.get<EmploiTemps>(`${BASE_URL}/${id}`);
    return response.data;
  },

  getEmploiTempsWithSeances: async (id: number): Promise<EmploiTempsWithSeances> => {
    const response = await api.get<EmploiTempsWithSeances>(`${BASE_URL}/${id}/seances`);
    return response.data;
  },

  exportPDF: async (id: number): Promise<Blob> => {
    const response = await api.get(`${BASE_URL}/${id}/export/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  exportExcel: async (id: number): Promise<Blob> => {
    const response = await api.get(`${BASE_URL}/${id}/export/excel`, {
      responseType: 'blob',
    });
    return response.data;
  },

  createEmploiTemps: async (data: CreateEmploiTemps): Promise<EmploiTemps> => {
    const response = await api.post<EmploiTemps>(BASE_URL, data);
    return response.data;
  },

  updateEmploiTemps: async (id: number, data: UpdateEmploiTemps): Promise<EmploiTemps> => {
    const response = await api.put<EmploiTemps>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  validerEmploiTemps: async (id: number): Promise<EmploiTemps> => {
    const response = await api.patch<EmploiTemps>(`${BASE_URL}/${id}/valider`);
    return response.data;
  },

  publierEmploiTemps: async (id: number): Promise<EmploiTemps> => {
    const response = await api.patch<EmploiTemps>(`${BASE_URL}/${id}/publier`);
    return response.data;
  },

  archiverEmploiTemps: async (id: number): Promise<EmploiTemps> => {
    const response = await api.patch<EmploiTemps>(`${BASE_URL}/${id}/archiver`);
    return response.data;
  },

  deleteEmploiTemps: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },
};

export default emploiTempsService;
