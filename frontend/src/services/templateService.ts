import api from './api';
import {
  TemplateDocument,
  TemplateDocumentCreate,
  TemplateDocumentUpdate,
} from '../types/parametrage';

const BASE_URL = '/api/v1/templates';

export const templateService = {
  getAll: async (etablissementId?: number, typeDocument?: string): Promise<TemplateDocument[]> => {
    const params: any = {};
    if (etablissementId) params.etablissement_id = etablissementId;
    if (typeDocument) params.type_document = typeDocument;
    const response = await api.get(BASE_URL, { params });
    return response.data;
  },

  getTypes: async (): Promise<{ code: string; libelle: string }[]> => {
    const response = await api.get(`${BASE_URL}/types`);
    return response.data;
  },

  getVariables: async (typeDocument: string): Promise<{ nom: string; description: string }[]> => {
    const response = await api.get(`${BASE_URL}/variables/${typeDocument}`);
    return response.data;
  },

  getById: async (id: number): Promise<TemplateDocument> => {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  getByCode: async (code: string, etablissementId?: number): Promise<TemplateDocument> => {
    const params = etablissementId ? { etablissement_id: etablissementId } : {};
    const response = await api.get(`${BASE_URL}/code/${code}`, { params });
    return response.data;
  },

  create: async (data: TemplateDocumentCreate): Promise<TemplateDocument> => {
    const response = await api.post(BASE_URL, data);
    return response.data;
  },

  update: async (id: number, data: TemplateDocumentUpdate): Promise<TemplateDocument> => {
    const response = await api.put(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },

  preview: async (id: number, variables: Record<string, any>): Promise<string> => {
    const response = await api.post(`${BASE_URL}/${id}/preview`, { variables });
    return response.data;
  },

  renderByCode: async (code: string, variables: Record<string, any>, etablissementId?: number): Promise<{ html: string }> => {
    const params = etablissementId ? { etablissement_id: etablissementId } : {};
    const response = await api.post(`${BASE_URL}/code/${code}/render`, { variables }, { params });
    return response.data;
  },

  initialiser: async (): Promise<{ message: string; templates_crees: number }> => {
    const response = await api.post(`${BASE_URL}/initialiser`);
    return response.data;
  },
};

export default templateService;
