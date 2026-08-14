import api from './api';
import {
  BaremeNotation,
  BaremeNotationCreate,
  BaremeNotationUpdate,
  MentionNotation,
  MentionNotationCreate,
  MentionNotationUpdate,
} from '../types/parametrage';

const BASE_URL = '/api/v1/baremes';

export const baremeService = {
  getAll: async (etablissementId?: number, cycleId?: number): Promise<BaremeNotation[]> => {
    const params: any = {};
    if (etablissementId) params.etablissement_id = etablissementId;
    if (cycleId) params.cycle_id = cycleId;
    const response = await api.get(BASE_URL, { params });
    return response.data;
  },

  getDefaut: async (): Promise<BaremeNotation> => {
    const response = await api.get(`${BASE_URL}/defaut`);
    return response.data;
  },

  getById: async (id: number): Promise<BaremeNotation> => {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  getMentionForNote: async (baremeId: number, note: number): Promise<any> => {
    const response = await api.get(`${BASE_URL}/${baremeId}/mention/${note}`);
    return response.data;
  },

  create: async (data: BaremeNotationCreate): Promise<BaremeNotation> => {
    const response = await api.post(BASE_URL, data);
    return response.data;
  },

  update: async (id: number, data: BaremeNotationUpdate): Promise<BaremeNotation> => {
    const response = await api.put(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },

  // Mentions
  createMention: async (baremeId: number, data: MentionNotationCreate): Promise<MentionNotation> => {
    const response = await api.post(`${BASE_URL}/${baremeId}/mentions`, data);
    return response.data;
  },

  updateMention: async (mentionId: number, data: MentionNotationUpdate): Promise<MentionNotation> => {
    const response = await api.put(`${BASE_URL}/mentions/${mentionId}`, data);
    return response.data;
  },

  deleteMention: async (mentionId: number): Promise<void> => {
    await api.delete(`${BASE_URL}/mentions/${mentionId}`);
  },

  initialiser: async (): Promise<{ message: string; baremes_crees: number }> => {
    const response = await api.post(`${BASE_URL}/initialiser`);
    return response.data;
  },
};

export default baremeService;
