import api from './api';
import { FraisScolarite, CreateFraisScolarite, UpdateFraisScolarite } from '../types/finance';

const BASE_URL = '/frais-scolarite';

export const fraisScolariteService = {
  getFraisScolarite: async (params?: {
    skip?: number;
    limit?: number;
    niveau_id?: number;
    filiere_id?: number;
    cycle_id?: number;
    annee_id?: number;
  }): Promise<FraisScolarite[]> => {
    const response = await api.get<FraisScolarite[]>(BASE_URL, { params });
    return response.data;
  },

  getFraisByNiveauFiliere: async (
    niveau_id: number,
    filiere_id: number,
    annee_id: number
  ): Promise<FraisScolarite[]> => {
    const response = await api.get<FraisScolarite[]>(
      `${BASE_URL}/niveau/${niveau_id}/filiere/${filiere_id}`,
      { params: { annee_id } }
    );
    return response.data;
  },

  getFraisValides: async (date_reference?: string): Promise<FraisScolarite[]> => {
    const response = await api.get<FraisScolarite[]>(`${BASE_URL}/valides`, {
      params: { date_reference },
    });
    return response.data;
  },

  getFraisScolariteById: async (id: number): Promise<FraisScolarite> => {
    const response = await api.get<FraisScolarite>(`${BASE_URL}/${id}`);
    return response.data;
  },

  createFraisScolarite: async (data: CreateFraisScolarite): Promise<FraisScolarite> => {
    const response = await api.post<FraisScolarite>(BASE_URL, data);
    return response.data;
  },

  updateFraisScolarite: async (
    id: number,
    data: UpdateFraisScolarite
  ): Promise<FraisScolarite> => {
    const response = await api.put<FraisScolarite>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  deleteFraisScolarite: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },
};

export default fraisScolariteService;
