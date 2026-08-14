/**
 * Service pour la gestion avancée des années académiques.
 * Ouverture, clôture, reconduction du référentiel, rapports.
 */

import api from './api';
import type {
  OuvrirAnneeRequest,
  CloturerSemestreRequest,
  ReconduireRequest,
  RapportReconduction,
  RapportAnnee,
  StatutAnnee,
} from '../types/anneeAcademique';

const BASE_URL = '/api/v1/annees-academiques';

/**
 * Ouvre une année académique.
 */
export async function ouvrirAnnee(
  anneeId: number,
  request: OuvrirAnneeRequest
): Promise<{ message: string; annee: Record<string, unknown> }> {
  const response = await api.post(`${BASE_URL}/${anneeId}/ouvrir`, request);
  return response.data;
}

/**
 * Clôture un semestre.
 */
export async function cloturerSemestre(
  anneeId: number,
  request: CloturerSemestreRequest
): Promise<{ message: string; rapport: Record<string, unknown> }> {
  const response = await api.post(`${BASE_URL}/${anneeId}/cloturer-semestre`, request);
  return response.data;
}

/**
 * Clôture une année académique.
 */
export async function cloturerAnnee(
  anneeId: number
): Promise<{ message: string; annee: Record<string, unknown> }> {
  const response = await api.post(`${BASE_URL}/${anneeId}/cloturer`);
  return response.data;
}

/**
 * Archive une année académique.
 */
export async function archiverAnnee(
  anneeId: number
): Promise<{ message: string; annee: Record<string, unknown> }> {
  const response = await api.post(`${BASE_URL}/${anneeId}/archiver`);
  return response.data;
}

/**
 * Récupère le rapport complet d'une année.
 */
export async function getRapportAnnee(anneeId: number): Promise<RapportAnnee> {
  const response = await api.get<RapportAnnee>(`${BASE_URL}/${anneeId}/rapport`);
  return response.data;
}

/**
 * Reconduit le référentiel d'une année vers une autre.
 */
export async function reconduireReferentiel(
  request: ReconduireRequest
): Promise<{ message: string; rapport: RapportReconduction }> {
  const response = await api.post(`${BASE_URL}/reconduire`, request);
  return response.data;
}

/**
 * Récupère le statut détaillé d'une année.
 */
export async function getStatutAnnee(anneeId: number): Promise<StatutAnnee> {
  const response = await api.get<StatutAnnee>(`${BASE_URL}/${anneeId}/statut`);
  return response.data;
}

export const anneeAcademiqueGestionService = {
  ouvrirAnnee,
  cloturerSemestre,
  cloturerAnnee,
  archiverAnnee,
  getRapportAnnee,
  reconduireReferentiel,
  getStatutAnnee,
};

export default anneeAcademiqueGestionService;
