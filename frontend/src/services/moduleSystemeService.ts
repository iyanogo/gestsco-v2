/**
 * Service pour la gestion des modules système.
 * Activation/désactivation des modules par université et année académique.
 */

import api from './api';
import type {
  ModuleSysteme,
  ModuleActif,
  ActiverModuleRequest,
  DesactiverModuleRequest,
} from '../types/anneeAcademique';

const BASE_URL = '/api/v1/modules-systeme';

/**
 * Récupère tous les modules système.
 */
export async function getModulesSysteme(): Promise<ModuleSysteme[]> {
  const response = await api.get<ModuleSysteme[]>(BASE_URL);
  return response.data;
}

/**
 * Récupère un module par son code.
 */
export async function getModuleByCode(code: string): Promise<ModuleSysteme> {
  const response = await api.get<ModuleSysteme>(`${BASE_URL}/${code}`);
  return response.data;
}

/**
 * Active un module.
 */
export async function activerModule(
  code: string,
  request: ActiverModuleRequest
): Promise<{ message: string; module_actif: ModuleActif }> {
  const response = await api.post(`${BASE_URL}/${code}/activer`, request);
  return response.data;
}

/**
 * Désactive un module.
 */
export async function desactiverModule(
  code: string,
  request: DesactiverModuleRequest
): Promise<{ message: string; module_actif: ModuleActif }> {
  const response = await api.post(`${BASE_URL}/${code}/desactiver`, request);
  return response.data;
}

/**
 * Récupère les modules actifs pour un contexte.
 */
export async function getModulesActifs(
  universiteId?: number,
  anneeId?: number
): Promise<ModuleSysteme[]> {
  const params: Record<string, number> = {};
  if (universiteId) params.universite_id = universiteId;
  if (anneeId) params.annee_id = anneeId;
  
  const response = await api.get<ModuleSysteme[]>(`${BASE_URL}/actifs`, { params });
  return response.data;
}

/**
 * Vérifie l'accès à un module.
 */
export async function verifierAccesModule(
  code: string,
  universiteId?: number,
  anneeId?: number
): Promise<{ module: string; a_acces: boolean }> {
  const params: Record<string, number> = {};
  if (universiteId) params.universite_id = universiteId;
  if (anneeId) params.annee_id = anneeId;
  
  const response = await api.get(`${BASE_URL}/${code}/verifier-acces`, { params });
  return response.data;
}

export const moduleSystemeService = {
  getModulesSysteme,
  getModuleByCode,
  activerModule,
  desactiverModule,
  getModulesActifs,
  verifierAccesModule,
};

export default moduleSystemeService;
