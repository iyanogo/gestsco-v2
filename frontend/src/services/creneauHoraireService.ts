import api from './api';
import { CreneauHoraire, CreateCreneauHoraire, UpdateCreneauHoraire } from '../types/emploiTemps';

const BASE_URL = '/api/v1/creneaux-horaires';

export const creneauHoraireService = {
  getCreneaux: async (periode?: string): Promise<CreneauHoraire[]> => {
    const response = await api.get<CreneauHoraire[]>(BASE_URL, {
      params: periode ? { periode } : undefined,
    });
    return response.data;
  },

  getCreneauById: async (id: number): Promise<CreneauHoraire> => {
    const response = await api.get<CreneauHoraire>(`${BASE_URL}/${id}`);
    return response.data;
  },

  createCreneau: async (data: CreateCreneauHoraire): Promise<CreneauHoraire> => {
    const response = await api.post<CreneauHoraire>(BASE_URL, data);
    return response.data;
  },

  updateCreneau: async (id: number, data: UpdateCreneauHoraire): Promise<CreneauHoraire> => {
    const response = await api.put<CreneauHoraire>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  deleteCreneau: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },
};

export default creneauHoraireService;
