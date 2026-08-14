/**
 * Service pour la gestion des soutenances.
 * CRUD complet avec programmation, validation et génération de PV.
 */

import api from './api';
import type {
  Soutenance,
  CreateSoutenance,
  UpdateSoutenance,
  ValiderSoutenanceRequest,
} from '../types/anneeAcademique';

const BASE_URL = '/api/v1/soutenances';

interface GetSoutenancesParams {
  statut?: string;
  date_debut?: string;
  date_fin?: string;
  niveau_id?: number;
  skip?: number;
  limit?: number;
}

interface CalendrierEvent {
  id: number;
  title: string;
  start: string;
  end: string;
  lieu: string;
  salle_id?: number;
  statut: string;
  stage_id: number;
  theme?: string;
}

/**
 * Récupère la liste des soutenances.
 */
export async function getSoutenances(params?: GetSoutenancesParams): Promise<Soutenance[]> {
  const response = await api.get<Soutenance[]>(BASE_URL, { params });
  return response.data;
}

/**
 * Récupère une soutenance par son ID.
 */
export async function getSoutenanceById(id: number): Promise<Soutenance> {
  const response = await api.get<Soutenance>(`${BASE_URL}/${id}`);
  return response.data;
}

/**
 * Programme une nouvelle soutenance.
 */
export async function createSoutenance(data: CreateSoutenance): Promise<Soutenance> {
  const response = await api.post<Soutenance>(BASE_URL, data);
  return response.data;
}

/**
 * Met à jour une soutenance.
 */
export async function updateSoutenance(id: number, data: UpdateSoutenance): Promise<Soutenance> {
  const response = await api.put<Soutenance>(`${BASE_URL}/${id}`, data);
  return response.data;
}

/**
 * Annule une soutenance.
 */
export async function deleteSoutenance(id: number): Promise<{ message: string }> {
  const response = await api.delete(`${BASE_URL}/${id}`);
  return response.data;
}

/**
 * Valide une soutenance avec les notes du jury.
 */
export async function validerSoutenance(
  id: number,
  data: ValiderSoutenanceRequest
): Promise<{ message: string; soutenance: Partial<Soutenance> }> {
  const response = await api.post(`${BASE_URL}/${id}/valider`, data);
  return response.data;
}

/**
 * Génère le procès-verbal de soutenance.
 */
export async function genererPV(id: number): Promise<{ message: string; pv_url: string }> {
  const response = await api.post(`${BASE_URL}/${id}/generer-pv`);
  return response.data;
}

/**
 * Récupère les soutenances d'un membre du jury.
 */
export async function getSoutenancesJury(userId: number): Promise<Soutenance[]> {
  const response = await api.get<Soutenance[]>(`${BASE_URL}/jury/${userId}`);
  return response.data;
}

/**
 * Récupère le calendrier des soutenances.
 */
export async function getCalendrierSoutenances(
  dateDebut: string,
  dateFin: string,
  niveauId?: number
): Promise<CalendrierEvent[]> {
  const params: Record<string, string | number> = {
    date_debut: dateDebut,
    date_fin: dateFin,
  };
  if (niveauId) params.niveau_id = niveauId;
  
  const response = await api.get<CalendrierEvent[]>(`${BASE_URL}/calendrier`, { params });
  return response.data;
}

/**
 * Récupère les soutenances à venir.
 */
export async function getSoutenancesAVenir(jours: number = 7): Promise<Soutenance[]> {
  const response = await api.get<Soutenance[]>(`${BASE_URL}/a-venir`, {
    params: { jours },
  });
  return response.data;
}

export const soutenanceService = {
  getSoutenances,
  getSoutenanceById,
  createSoutenance,
  updateSoutenance,
  deleteSoutenance,
  validerSoutenance,
  genererPV,
  getSoutenancesJury,
  getCalendrierSoutenances,
  getSoutenancesAVenir,
};

export default soutenanceService;
