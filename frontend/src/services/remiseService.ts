import api from './api';
import {
  Remise,
  CreateRemise,
  UpdateRemise,
  RemiseEtudiant,
  CreateRemiseEtudiant,
} from '../types/finance';

const BASE_URL = '/api/v1/remises';

export const remiseService = {
  getRemises: async (params?: {
    skip?: number;
    limit?: number;
    is_active?: boolean;
  }): Promise<Remise[]> => {
    const response = await api.get<Remise[]>(BASE_URL, { params });
    return response.data;
  },

  getRemisesValides: async (date_reference?: string): Promise<Remise[]> => {
    const response = await api.get<Remise[]>(`${BASE_URL}/valides`, {
      params: { date_reference },
    });
    return response.data;
  },

  getRemisesDisponibles: async (): Promise<Remise[]> => {
    const response = await api.get<Remise[]>(`${BASE_URL}/disponibles`);
    return response.data;
  },

  getRemiseById: async (id: number): Promise<Remise> => {
    const response = await api.get<Remise>(`${BASE_URL}/${id}`);
    return response.data;
  },

  getAttributionsRemise: async (remise_id: number): Promise<RemiseEtudiant[]> => {
    const response = await api.get<RemiseEtudiant[]>(
      `${BASE_URL}/${remise_id}/attributions`
    );
    return response.data;
  },

  createRemise: async (data: CreateRemise): Promise<Remise> => {
    const response = await api.post<Remise>(BASE_URL, data);
    return response.data;
  },

  appliquerRemise: async (data: CreateRemiseEtudiant): Promise<RemiseEtudiant> => {
    const response = await api.post<RemiseEtudiant>(`${BASE_URL}/appliquer`, data);
    return response.data;
  },

  updateRemise: async (id: number, data: UpdateRemise): Promise<Remise> => {
    const response = await api.put<Remise>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  deleteRemise: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },
};

export default remiseService;
