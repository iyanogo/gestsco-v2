import api from './api';
import { 
  Salle, 
  CreateSalle, 
  UpdateSalle, 
  SalleWithDisponibilite,
  Seance 
} from '../types/emploiTemps';

const BASE_URL = '/api/v1/salles';

export interface GetSallesParams {
  skip?: number;
  limit?: number;
  batiment_id?: number;
  type_salle?: string;
  capacite_min?: number;
}

export const salleService = {
  getSalles: async (params?: GetSallesParams): Promise<Salle[]> => {
    const response = await api.get<Salle[]>(BASE_URL, { params });
    return response.data;
  },

  getSalleById: async (id: number): Promise<Salle> => {
    const response = await api.get<Salle>(`${BASE_URL}/${id}`);
    return response.data;
  },

  getSallesDisponibles: async (
    date: string,
    heure_debut: string,
    heure_fin: string,
    capacite_min?: number,
    type_salle?: string
  ): Promise<Salle[]> => {
    const response = await api.get<Salle[]>(`${BASE_URL}/disponibles`, {
      params: { date, heure_debut, heure_fin, capacite_min, type_salle },
    });
    return response.data;
  },

  getDisponibiliteSalles: async (
    date: string,
    creneau_id: number
  ): Promise<SalleWithDisponibilite[]> => {
    const response = await api.get<SalleWithDisponibilite[]>(`${BASE_URL}/disponibilite`, {
      params: { date, creneau_id },
    });
    return response.data;
  },

  getOccupationSalle: async (
    salle_id: number,
    date_debut: string,
    date_fin: string
  ): Promise<{ salle: Salle; seances: Seance[] }> => {
    const response = await api.get<{ salle: Salle; seances: Seance[] }>(
      `${BASE_URL}/${salle_id}/occupation`,
      { params: { date_debut, date_fin } }
    );
    return response.data;
  },

  createSalle: async (data: CreateSalle): Promise<Salle> => {
    const response = await api.post<Salle>(BASE_URL, data);
    return response.data;
  },

  updateSalle: async (id: number, data: UpdateSalle): Promise<Salle> => {
    const response = await api.put<Salle>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  deleteSalle: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },
};

export default salleService;
