import api from './api';
import {
  ConfigurationEtablissement,
  ConfigurationEtablissementCreate,
  ConfigurationEtablissementUpdate,
} from '../types/parametrage';

const BASE_URL = '/api/v1/configurations';

export const configurationService = {
  getAll: async (): Promise<ConfigurationEtablissement[]> => {
    const response = await api.get(BASE_URL);
    return response.data;
  },

  getById: async (id: number): Promise<ConfigurationEtablissement> => {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  getByEtablissement: async (etablissementId: number): Promise<ConfigurationEtablissement> => {
    const response = await api.get(`${BASE_URL}/etablissement/${etablissementId}`);
    return response.data;
  },

  getComplete: async (etablissementId: number): Promise<any> => {
    const response = await api.get(`${BASE_URL}/etablissement/${etablissementId}/complete`);
    return response.data;
  },

  create: async (data: ConfigurationEtablissementCreate): Promise<ConfigurationEtablissement> => {
    const response = await api.post(BASE_URL, data);
    return response.data;
  },

  update: async (id: number, data: ConfigurationEtablissementUpdate): Promise<ConfigurationEtablissement> => {
    const response = await api.put(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  updateCouleurs: async (id: number, couleurPrimaire: string, couleurSecondaire: string): Promise<any> => {
    const response = await api.patch(`${BASE_URL}/${id}/couleurs`, {
      couleur_primaire: couleurPrimaire,
      couleur_secondaire: couleurSecondaire,
    });
    return response.data;
  },

  updateLogo: async (id: number, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.patch(`${BASE_URL}/${id}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },
};

export default configurationService;
