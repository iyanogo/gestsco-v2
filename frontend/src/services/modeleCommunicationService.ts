import api from './api';
import {
  ModeleEmail,
  ModeleEmailCreate,
  ModeleEmailUpdate,
  ModeleSMS,
  ModeleSMSCreate,
  ModeleSMSUpdate,
} from '../types/parametrage';

const BASE_URL = '/api/v1/modeles-communication';

export const modeleCommunicationService = {
  // ========== EMAILS ==========
  getAllEmails: async (etablissementId?: number, typeDestinataire?: string): Promise<ModeleEmail[]> => {
    const params: any = {};
    if (etablissementId) params.etablissement_id = etablissementId;
    if (typeDestinataire) params.type_destinataire = typeDestinataire;
    const response = await api.get(`${BASE_URL}/emails`, { params });
    return response.data;
  },

  getEmailById: async (id: number): Promise<ModeleEmail> => {
    const response = await api.get(`${BASE_URL}/emails/${id}`);
    return response.data;
  },

  createEmail: async (data: ModeleEmailCreate): Promise<ModeleEmail> => {
    const response = await api.post(`${BASE_URL}/emails`, data);
    return response.data;
  },

  updateEmail: async (id: number, data: ModeleEmailUpdate): Promise<ModeleEmail> => {
    const response = await api.put(`${BASE_URL}/emails/${id}`, data);
    return response.data;
  },

  deleteEmail: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/emails/${id}`);
  },

  previewEmail: async (id: number, variables: Record<string, any>): Promise<{ objet: string; corps_html: string; corps_texte?: string }> => {
    const response = await api.post(`${BASE_URL}/emails/${id}/preview`, { variables });
    return response.data;
  },

  renderEmailByCode: async (code: string, variables: Record<string, any>, etablissementId?: number): Promise<any> => {
    const params = etablissementId ? { etablissement_id: etablissementId } : {};
    const response = await api.post(`${BASE_URL}/emails/code/${code}/render`, { variables }, { params });
    return response.data;
  },

  // ========== SMS ==========
  getAllSMS: async (etablissementId?: number, typeDestinataire?: string): Promise<ModeleSMS[]> => {
    const params: any = {};
    if (etablissementId) params.etablissement_id = etablissementId;
    if (typeDestinataire) params.type_destinataire = typeDestinataire;
    const response = await api.get(`${BASE_URL}/sms`, { params });
    return response.data;
  },

  getSMSById: async (id: number): Promise<ModeleSMS> => {
    const response = await api.get(`${BASE_URL}/sms/${id}`);
    return response.data;
  },

  createSMS: async (data: ModeleSMSCreate): Promise<ModeleSMS> => {
    const response = await api.post(`${BASE_URL}/sms`, data);
    return response.data;
  },

  updateSMS: async (id: number, data: ModeleSMSUpdate): Promise<ModeleSMS> => {
    const response = await api.put(`${BASE_URL}/sms/${id}`, data);
    return response.data;
  },

  deleteSMS: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/sms/${id}`);
  },

  previewSMS: async (id: number, variables: Record<string, any>): Promise<{ message: string; longueur: number }> => {
    const response = await api.post(`${BASE_URL}/sms/${id}/preview`, { variables });
    return response.data;
  },

  renderSMSByCode: async (code: string, variables: Record<string, any>, etablissementId?: number): Promise<any> => {
    const params = etablissementId ? { etablissement_id: etablissementId } : {};
    const response = await api.post(`${BASE_URL}/sms/code/${code}/render`, { variables }, { params });
    return response.data;
  },

  // ========== TYPES DESTINATAIRES ==========
  getTypesDestinataires: async (): Promise<{ code: string; libelle: string }[]> => {
    const response = await api.get(`${BASE_URL}/types-destinataires`);
    return response.data;
  },
};

export default modeleCommunicationService;
