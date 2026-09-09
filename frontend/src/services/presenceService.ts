import api from './api';
import { 
  Presence, 
  CreatePresence, 
  UpdatePresence, 
  PresenceWithEtudiant,
  PresenceBulkCreate,
  StatistiquesPresence 
} from '../types/emploiTemps';

const BASE_URL = '/api/v1/presences';

export interface GetPresencesParams {
  skip?: number;
  limit?: number;
  seance_id?: number;
  etudiant_id?: number;
  date_debut?: string;
  date_fin?: string;
  statut?: string;
}

export const presenceService = {
  getPresences: async (params?: GetPresencesParams): Promise<Presence[]> => {
    const response = await api.get<Presence[]>(BASE_URL, { params });
    return response.data;
  },

  getPresencesSeance: async (seance_id: number): Promise<PresenceWithEtudiant[]> => {
    const response = await api.get<PresenceWithEtudiant[]>(`${BASE_URL}/seance/${seance_id}`);
    return response.data;
  },

  getPresencesEtudiant: async (
    etudiant_id: number,
    date_debut?: string,
    date_fin?: string,
    matiere_id?: number
  ): Promise<Presence[]> => {
    const response = await api.get<Presence[]>(`${BASE_URL}/etudiant/${etudiant_id}`, {
      params: { date_debut, date_fin, matiere_id },
    });
    return response.data;
  },

  getTauxPresence: async (
    etudiant_id: number,
    matiere_id?: number,
    date_debut?: string,
    date_fin?: string
  ): Promise<StatistiquesPresence> => {
    const response = await api.get<StatistiquesPresence>(
      `${BASE_URL}/etudiant/${etudiant_id}/taux`,
      { params: { matiere_id, date_debut, date_fin } }
    );
    return response.data;
  },

  getStatistiquesSeance: async (seance_id: number): Promise<StatistiquesPresence> => {
    const response = await api.get<StatistiquesPresence>(
      `${BASE_URL}/statistiques/seance/${seance_id}`
    );
    return response.data;
  },

  getAbsentsFrequents: async (
    niveau_id: number,
    seuil_absence: number = 3
  ): Promise<any[]> => {
    const response = await api.get<any[]>(`${BASE_URL}/absents-frequents`, {
      params: { niveau_id, seuil_absence },
    });
    return response.data;
  },

  createPresence: async (data: CreatePresence): Promise<Presence> => {
    const response = await api.post<Presence>(BASE_URL, data);
    return response.data;
  },

  createPresencesBulk: async (data: PresenceBulkCreate): Promise<{ message: string; presences: Presence[] }> => {
    const response = await api.post<{ message: string; presences: Presence[] }>(
      `${BASE_URL}/bulk`,
      data
    );
    return response.data;
  },

  updatePresence: async (id: number, data: UpdatePresence): Promise<Presence> => {
    const response = await api.put<Presence>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  deletePresence: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },
};

export default presenceService;
