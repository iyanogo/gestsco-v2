import api from './api';
import { 
  Seance, 
  CreateSeance, 
  UpdateSeance, 
  CreateSeanceRecurrente,
  Conflits,
  JourSemaine 
} from '../types/emploiTemps';

const BASE_URL = '/api/v1/seances';

export interface GetSeancesParams {
  skip?: number;
  limit?: number;
  date?: string;
  date_debut?: string;
  date_fin?: string;
  niveau_id?: number;
  filiere_id?: number;
  enseignant_id?: number;
  salle_id?: number;
  matiere_id?: number;
  statut?: string;
}

export const seanceService = {
  getSeances: async (params?: GetSeancesParams): Promise<Seance[]> => {
    const response = await api.get<Seance[]>(BASE_URL, { params });
    return response.data;
  },

  getSeancesSemaine: async (
    date_debut: string,
    niveau_id: number,
    filiere_id?: number
  ): Promise<JourSemaine[]> => {
    const response = await api.get<JourSemaine[]>(`${BASE_URL}/semaine`, {
      params: { date_debut, niveau_id, filiere_id },
    });
    return response.data;
  },

  getSeancesEnseignant: async (
    enseignant_id: number,
    date_debut?: string,
    date_fin?: string
  ): Promise<Seance[]> => {
    const response = await api.get<Seance[]>(`${BASE_URL}/enseignant/${enseignant_id}`, {
      params: { date_debut, date_fin },
    });
    return response.data;
  },

  /** Portail enseignant - séances du compte connecté (sans ID en URL). */
  getMesSeances: async (date_debut?: string, date_fin?: string): Promise<Seance[]> => {
    const response = await api.get<Seance[]>(`${BASE_URL}/mes-seances`, {
      params: { date_debut, date_fin },
    });
    return response.data;
  },

  getPlanningSalle: async (salle_id: number, date?: string): Promise<Seance[]> => {
    const response = await api.get<Seance[]>(`${BASE_URL}/salle/${salle_id}`, {
      params: { date },
    });
    return response.data;
  },

  verifierConflits: async (
    date: string,
    creneau_id: number,
    salle_id?: number,
    enseignant_id?: number
  ): Promise<Conflits> => {
    const response = await api.get<Conflits>(`${BASE_URL}/conflits`, {
      params: { date, creneau_id, salle_id, enseignant_id },
    });
    return response.data;
  },

  getSeanceById: async (id: number): Promise<Seance> => {
    const response = await api.get<Seance>(`${BASE_URL}/${id}`);
    return response.data;
  },

  createSeance: async (data: CreateSeance): Promise<Seance> => {
    const response = await api.post<Seance>(BASE_URL, data);
    return response.data;
  },

  createSeanceRecurrente: async (data: CreateSeanceRecurrente): Promise<Seance[]> => {
    const response = await api.post<Seance[]>(`${BASE_URL}/recurrente`, data);
    return response.data;
  },

  updateSeance: async (id: number, data: UpdateSeance): Promise<Seance> => {
    const response = await api.put<Seance>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  confirmerSeance: async (id: number): Promise<Seance> => {
    const response = await api.patch<Seance>(`${BASE_URL}/${id}/confirmer`);
    return response.data;
  },

  annulerSeance: async (id: number, motif: string): Promise<Seance> => {
    const response = await api.patch<Seance>(`${BASE_URL}/${id}/annuler`, { motif });
    return response.data;
  },

  reporterSeance: async (
    id: number,
    nouvelle_date: string,
    nouveau_creneau_id: number
  ): Promise<Seance> => {
    const response = await api.patch<Seance>(`${BASE_URL}/${id}/reporter`, {
      nouvelle_date,
      nouveau_creneau_id,
    });
    return response.data;
  },

  deleteSeance: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },
};

export default seanceService;
