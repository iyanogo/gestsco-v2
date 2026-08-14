import api from './api';
import {
  PaysConfiguration,
  PaysConfigurationCreate,
  PaysConfigurationUpdate,
} from '../types/parametrage';

const BASE_URL = '/api/v1/pays';

export const paysService = {
  getAll: async (continent?: string, region?: string): Promise<PaysConfiguration[]> => {
    const params: any = {};
    if (continent) params.continent = continent;
    if (region) params.region = region;
    const response = await api.get(BASE_URL, { params });
    return response.data;
  },

  getContinents: async (): Promise<{ code: string; libelle: string }[]> => {
    const response = await api.get(`${BASE_URL}/continents`);
    return response.data;
  },

  getRegions: async (continent?: string): Promise<{ code: string; continent: string }[]> => {
    const params = continent ? { continent } : {};
    const response = await api.get(`${BASE_URL}/regions`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<PaysConfiguration> => {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  getByCode: async (codePays: string): Promise<PaysConfiguration> => {
    const response = await api.get(`${BASE_URL}/code/${codePays}`);
    return response.data;
  },

  create: async (data: PaysConfigurationCreate): Promise<PaysConfiguration> => {
    const response = await api.post(BASE_URL, data);
    return response.data;
  },

  update: async (id: number, data: PaysConfigurationUpdate): Promise<PaysConfiguration> => {
    const response = await api.put(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },

  initialiser: async (): Promise<{ message: string; pays_crees: number }> => {
    const response = await api.post(`${BASE_URL}/initialiser`);
    return response.data;
  },
};

export default paysService;
