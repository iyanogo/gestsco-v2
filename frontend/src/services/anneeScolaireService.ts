/**
 * Service pour la gestion des années scolaires
 */

import api from './api';
import type { Annee, CreateAnnee, UpdateAnnee } from '../types/reference';

const BASE_URL = '/api/v1/annees-scolaires';

export const getAnneesScolaires = async (): Promise<Annee[]> => {
  const response = await api.get<Annee[]>(BASE_URL);
  return response.data;
};

export const getAnneeScolaireActive = async (): Promise<Annee> => {
  const response = await api.get<Annee>(`${BASE_URL}/active`);
  return response.data;
};

export const getAnneeScolaireById = async (id: number): Promise<Annee> => {
  const response = await api.get<Annee>(`${BASE_URL}/${id}`);
  return response.data;
};

export const createAnneeScolaire = async (data: CreateAnnee): Promise<Annee> => {
  const response = await api.post<Annee>(BASE_URL, data);
  return response.data;
};

export const updateAnneeScolaire = async (id: number, data: UpdateAnnee): Promise<Annee> => {
  const response = await api.put<Annee>(`${BASE_URL}/${id}`, data);
  return response.data;
};

export const activateAnneeScolaire = async (id: number): Promise<Annee> => {
  const response = await api.put<Annee>(`${BASE_URL}/${id}/activate`);
  return response.data;
};

export const deleteAnneeScolaire = async (id: number): Promise<void> => {
  await api.delete(`${BASE_URL}/${id}`);
};
