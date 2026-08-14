import api from './api';
import {
  ParametreSysteme,
  ParametreSystemeCreate,
  ParametreSystemeUpdate,
} from '../types/parametrage';

const BASE_URL = '/api/v1/parametres';

export const parametreService = {
  getAll: async (categorie?: string): Promise<ParametreSysteme[]> => {
    const params = categorie ? { categorie } : {};
    const response = await api.get(BASE_URL, { params });
    return response.data;
  },

  getParCategorie: async (): Promise<Record<string, ParametreSysteme[]>> => {
    const response = await api.get(`${BASE_URL}/par-categorie`);
    return response.data;
  },

  getById: async (id: number): Promise<ParametreSysteme> => {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  getValeur: async (cle: string): Promise<{ cle: string; valeur: any }> => {
    const response = await api.get(`${BASE_URL}/valeur/${cle}`);
    return response.data;
  },

  create: async (data: ParametreSystemeCreate): Promise<ParametreSysteme> => {
    const response = await api.post(BASE_URL, data);
    return response.data;
  },

  update: async (id: number, data: ParametreSystemeUpdate): Promise<ParametreSysteme> => {
    const response = await api.put(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  updateValeur: async (cle: string, valeur: any): Promise<{ message: string; cle: string; valeur: any }> => {
    const response = await api.patch(`${BASE_URL}/valeur/${cle}`, { valeur });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },

  initialiser: async (): Promise<{ message: string; parametres_crees: number }> => {
    const response = await api.post(`${BASE_URL}/initialiser`);
    return response.data;
  },
};

export default parametreService;
