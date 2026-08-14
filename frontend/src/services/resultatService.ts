/**
 * Service pour la gestion des résultats
 */

import api from './api';
import {
  ResultatMatiere,
  ResultatSemestre,
  ResultatAnnuel,
  ClassementItem,
} from '../types/evaluation';

const BASE_URL = '/resultats';

export const resultatService = {
  // ============ Résultats Matières ============

  /**
   * Récupère les résultats matières d'un étudiant
   */
  async getResultatsMatieres(etudiant_id: number, session_id?: number): Promise<ResultatMatiere[]> {
    const params = session_id ? { session_id } : {};
    const response = await api.get<ResultatMatiere[]>(`${BASE_URL}/matieres/etudiant/${etudiant_id}`, { params });
    return response.data;
  },

  /**
   * Récupère les résultats matières d'une session
   */
  async getResultatsMatieresSession(session_id: number): Promise<ResultatMatiere[]> {
    const response = await api.get<ResultatMatiere[]>(`${BASE_URL}/matieres/session/${session_id}`);
    return response.data;
  },

  // ============ Résultats Semestres ============

  /**
   * Récupère les résultats semestriels d'un étudiant
   */
  async getResultatsSemestres(etudiant_id: number): Promise<ResultatSemestre[]> {
    const response = await api.get<ResultatSemestre[]>(`${BASE_URL}/semestres/etudiant/${etudiant_id}`);
    return response.data;
  },

  /**
   * Récupère le classement semestriel
   */
  async getClassementSemestre(
    niveau_id: number,
    filiere_id: number,
    session_id: number,
    semestre: number
  ): Promise<{ classement: ClassementItem[]; effectif: number }> {
    const params = { niveau_id, filiere_id, session_id, semestre };
    const response = await api.get<{ classement: ClassementItem[]; effectif: number }>(
      `${BASE_URL}/semestres/classement`,
      { params }
    );
    return response.data;
  },

  // ============ Résultats Annuels ============

  /**
   * Récupère les résultats annuels d'un étudiant
   */
  async getResultatsAnnuels(etudiant_id: number, annee_id?: number): Promise<ResultatAnnuel[]> {
    const params = annee_id ? { annee_id } : {};
    const response = await api.get<ResultatAnnuel[]>(`${BASE_URL}/annuels/etudiant/${etudiant_id}`, { params });
    return response.data;
  },

  /**
   * Récupère le classement annuel
   */
  async getClassementAnnuel(
    niveau_id: number,
    filiere_id: number,
    annee_id: number
  ): Promise<{ classement: ClassementItem[]; effectif: number }> {
    const params = { niveau_id, filiere_id, annee_id };
    const response = await api.get<{ classement: ClassementItem[]; effectif: number }>(
      `${BASE_URL}/annuels/classement`,
      { params }
    );
    return response.data;
  },

  // ============ Calculs ============

  /**
   * Calcule le résultat d'une matière
   */
  async calculerResultatMatiere(
    inscription_matiere_id: number,
    session_id: number
  ): Promise<{ message: string; resultat: any }> {
    const response = await api.post<{ message: string; resultat: any }>(
      `${BASE_URL}/calculer/matiere/${inscription_matiere_id}`,
      { session_id }
    );
    return response.data;
  },

  /**
   * Calcule tous les résultats matières d'une session
   */
  async calculerResultatsSession(session_id: number): Promise<{ message: string; count: number }> {
    const response = await api.post<{ message: string; count: number }>(
      `${BASE_URL}/calculer/session/${session_id}`
    );
    return response.data;
  },

  /**
   * Calcule les résultats semestriels
   */
  async calculerResultatsSemestre(
    session_id: number,
    semestre: number
  ): Promise<{ message: string; count: number }> {
    const response = await api.post<{ message: string; count: number }>(
      `${BASE_URL}/calculer/semestre`,
      { session_id, semestre }
    );
    return response.data;
  },

  /**
   * Calcule le résultat annuel d'un étudiant
   */
  async calculerResultatAnnuel(inscription_id: number): Promise<{ message: string; resultat: any }> {
    const response = await api.post<{ message: string; resultat: any }>(
      `${BASE_URL}/calculer/annuel/${inscription_id}`
    );
    return response.data;
  },

  /**
   * Calcule les résultats annuels d'un niveau
   */
  async calculerResultatsNiveau(
    niveau_id: number,
    annee_id: number
  ): Promise<{ message: string; count: number }> {
    const response = await api.post<{ message: string; count: number }>(
      `${BASE_URL}/calculer/niveau`,
      { niveau_id, annee_id }
    );
    return response.data;
  },

  /**
   * Calcule les rangs semestriels
   */
  async calculerRangsSemestre(
    niveau_id: number,
    filiere_id: number,
    session_id: number,
    semestre: number
  ): Promise<{ message: string; effectif: number }> {
    const params = { niveau_id, filiere_id, session_id, semestre };
    const response = await api.post<{ message: string; effectif: number }>(
      `${BASE_URL}/calculer/rangs/semestre`,
      null,
      { params }
    );
    return response.data;
  },

  /**
   * Calcule les rangs annuels
   */
  async calculerRangsAnnuel(
    niveau_id: number,
    filiere_id: number,
    annee_id: number
  ): Promise<{ message: string; effectif: number }> {
    const params = { niveau_id, filiere_id, annee_id };
    const response = await api.post<{ message: string; effectif: number }>(
      `${BASE_URL}/calculer/rangs/annuel`,
      null,
      { params }
    );
    return response.data;
  },
};

export default resultatService;
