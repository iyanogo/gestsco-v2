import api from './api';
import { Batiment, CreateBatiment, UpdateBatiment } from '../types/emploiTemps';

const BASE_URL = '/batiments';

export interface GetBatimentsParams {
  skip?: number;
  limit?: number;
  etablissement_id?: number;
}

export const batimentService = {
  getBatiments: async (params?: GetBatimentsParams): Promise<Batiment[]> => {
    const response = await api.get<Batiment[]>(BASE_URL, { params });
    return response.data;
  },

  getBatimentById: async (id: number): Promise<Batiment> => {
    const response = await api.get<Batiment>(`${BASE_URL}/${id}`);
    return response.data;
  },

  createBatiment: async (data: CreateBatiment): Promise<Batiment> => {
    const response = await api.post<Batiment>(BASE_URL, data);
    return response.data;
  },

  updateBatiment: async (id: number, data: UpdateBatiment): Promise<Batiment> => {
    const response = await api.put<Batiment>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  deleteBatiment: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },
};

export default batimentService;
