import api from './api';
import {
  CompteEtudiant,
  CompteEtudiantWithDetails,
  CreateCompteEtudiant,
  UpdateCompteEtudiant,
  MouvementCompte,
} from '../types/finance';

const BASE_URL = '/comptes-etudiants';

export const compteEtudiantService = {
  getComptes: async (params?: {
    skip?: number;
    limit?: number;
    annee_id?: number;
    statut_compte?: string;
  }): Promise<CompteEtudiant[]> => {
    const response = await api.get<CompteEtudiant[]>(BASE_URL, { params });
    return response.data;
  },

  getComptesDebiteurs: async (
    annee_id?: number,
    seuil_dette?: number
  ): Promise<CompteEtudiant[]> => {
    const response = await api.get<CompteEtudiant[]>(`${BASE_URL}/debiteurs`, {
      params: { annee_id, seuil_dette },
    });
    return response.data;
  },

  getComptesCrediteurs: async (annee_id?: number): Promise<CompteEtudiant[]> => {
    const response = await api.get<CompteEtudiant[]>(`${BASE_URL}/crediteurs`, {
      params: { annee_id },
    });
    return response.data;
  },

  getCompteEtudiant: async (
    etudiant_id: number,
    annee_id: number
  ): Promise<CompteEtudiantWithDetails> => {
    const response = await api.get<CompteEtudiantWithDetails>(
      `${BASE_URL}/etudiant/${etudiant_id}`,
      { params: { annee_id } }
    );
    return response.data;
  },

  getMouvementsCompte: async (
    compte_id: number,
    params?: {
      skip?: number;
      limit?: number;
      date_debut?: string;
      date_fin?: string;
    }
  ): Promise<MouvementCompte[]> => {
    const response = await api.get<MouvementCompte[]>(
      `${BASE_URL}/${compte_id}/mouvements`,
      { params }
    );
    return response.data;
  },

  downloadRelevePDF: async (
    compte_id: number,
    date_debut?: string,
    date_fin?: string
  ): Promise<Blob> => {
    const response = await api.get(`${BASE_URL}/${compte_id}/releve`, {
      params: { date_debut, date_fin },
      responseType: 'blob',
    });
    return response.data;
  },

  createCompte: async (data: CreateCompteEtudiant): Promise<CompteEtudiant> => {
    const response = await api.post<CompteEtudiant>(BASE_URL, data);
    return response.data;
  },

  updateCompte: async (
    id: number,
    data: UpdateCompteEtudiant
  ): Promise<CompteEtudiant> => {
    const response = await api.put<CompteEtudiant>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  bloquerCompte: async (id: number, motif: string): Promise<CompteEtudiant> => {
    const response = await api.patch<CompteEtudiant>(`${BASE_URL}/${id}/bloquer`, {
      motif,
    });
    return response.data;
  },

  debloquerCompte: async (id: number): Promise<CompteEtudiant> => {
    const response = await api.patch<CompteEtudiant>(`${BASE_URL}/${id}/debloquer`);
    return response.data;
  },

  deleteCompte: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },
};

export default compteEtudiantService;
