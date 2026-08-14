import api from './api';
import { TypeFrais, CreateTypeFrais, UpdateTypeFrais } from '../types/finance';

const BASE_URL = '/types-frais';

export const typeFraisService = {
  getTypesFrais: async (params?: {
    skip?: number;
    limit?: number;
    categorie?: string;
  }): Promise<TypeFrais[]> => {
    const response = await api.get<TypeFrais[]>(BASE_URL, { params });
    return response.data;
  },

  getTypesFraisObligatoires: async (): Promise<TypeFrais[]> => {
    const response = await api.get<TypeFrais[]>(`${BASE_URL}/obligatoires`);
    return response.data;
  },

  getTypesFraisRecurrents: async (): Promise<TypeFrais[]> => {
    const response = await api.get<TypeFrais[]>(`${BASE_URL}/recurrents`);
    return response.data;
  },

  getTypeFraisById: async (id: number): Promise<TypeFrais> => {
    const response = await api.get<TypeFrais>(`${BASE_URL}/${id}`);
    return response.data;
  },

  createTypeFrais: async (data: CreateTypeFrais): Promise<TypeFrais> => {
    const response = await api.post<TypeFrais>(BASE_URL, data);
    return response.data;
  },

  updateTypeFrais: async (id: number, data: UpdateTypeFrais): Promise<TypeFrais> => {
    const response = await api.put<TypeFrais>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  deleteTypeFrais: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },
};

export default typeFraisService;
