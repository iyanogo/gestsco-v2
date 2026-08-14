import api from './api';
import {
  RegleCalcul,
  RegleCalculCreate,
  RegleCalculUpdate,
} from '../types/parametrage';

const BASE_URL = '/api/v1/regles-calcul';

export const regleCalculService = {
  getAll: async (typeRegle?: string, cycleId?: number): Promise<RegleCalcul[]> => {
    const params: any = {};
    if (typeRegle) params.type_regle = typeRegle;
    if (cycleId) params.cycle_id = cycleId;
    const response = await api.get(BASE_URL, { params });
    return response.data;
  },

  getTypes: async (): Promise<{ code: string; libelle: string }[]> => {
    const response = await api.get(`${BASE_URL}/types`);
    return response.data;
  },

  getById: async (id: number): Promise<RegleCalcul> => {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  create: async (data: RegleCalculCreate): Promise<RegleCalcul> => {
    const response = await api.post(BASE_URL, data);
    return response.data;
  },

  update: async (id: number, data: RegleCalculUpdate): Promise<RegleCalcul> => {
    const response = await api.put(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },

  tester: async (id: number, donnees: Record<string, any>): Promise<{ resultat: any; details: any }> => {
    const response = await api.post(`${BASE_URL}/${id}/tester`, { donnees });
    return response.data;
  },

  // Calculs directs
  calculerMoyenne: async (notes: number[], coefficients: number[], cycleId?: number): Promise<any> => {
    const params: any = { notes, coefficients };
    if (cycleId) params.cycle_id = cycleId;
    const response = await api.post(`${BASE_URL}/calculer/moyenne`, null, { params });
    return response.data;
  },

  calculerMention: async (moyenne: number, cycleId?: number): Promise<{ moyenne: number; mention: string }> => {
    const params: any = { moyenne };
    if (cycleId) params.cycle_id = cycleId;
    const response = await api.post(`${BASE_URL}/calculer/mention`, null, { params });
    return response.data;
  },

  validerCredits: async (note: number, credits: number, cycleId?: number): Promise<any> => {
    const params: any = { note, credits };
    if (cycleId) params.cycle_id = cycleId;
    const response = await api.post(`${BASE_URL}/calculer/validation-credits`, null, { params });
    return response.data;
  },

  appliquerCompensation: async (moyenne: number, notes: number[], cycleId?: number): Promise<any> => {
    const params: any = { moyenne, notes };
    if (cycleId) params.cycle_id = cycleId;
    const response = await api.post(`${BASE_URL}/calculer/compensation`, null, { params });
    return response.data;
  },

  verifierPassage: async (creditsObtenus: number, moyenneAnnuelle: number, cycleId?: number): Promise<any> => {
    const params: any = { credits_obtenus: creditsObtenus, moyenne_annuelle: moyenneAnnuelle };
    if (cycleId) params.cycle_id = cycleId;
    const response = await api.post(`${BASE_URL}/calculer/passage-annee`, null, { params });
    return response.data;
  },
};

export default regleCalculService;
