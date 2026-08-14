/**
 * Service pour la gestion des bulletins
 */

import api from './api';
import {
  BulletinSemestre,
  BulletinAnnuel,
  ReleveNotes,
} from '../types/evaluation';

const BASE_URL = '/bulletins';

export const bulletinService = {
  /**
   * Récupère le bulletin semestriel d'un étudiant
   */
  async getBulletinSemestre(
    etudiant_id: number,
    session_id: number,
    semestre: number
  ): Promise<BulletinSemestre> {
    const params = { session_id, semestre };
    const response = await api.get<BulletinSemestre>(
      `${BASE_URL}/etudiant/${etudiant_id}/semestre`,
      { params }
    );
    return response.data;
  },

  /**
   * Récupère le bulletin annuel d'un étudiant
   */
  async getBulletinAnnuel(etudiant_id: number, annee_id: number): Promise<BulletinAnnuel> {
    const params = { annee_id };
    const response = await api.get<BulletinAnnuel>(
      `${BASE_URL}/etudiant/${etudiant_id}/annuel`,
      { params }
    );
    return response.data;
  },

  /**
   * Récupère le relevé de notes complet d'un étudiant
   */
  async getReleveNotes(etudiant_id: number, annee_id?: number): Promise<ReleveNotes> {
    const params = annee_id ? { annee_id } : {};
    const response = await api.get<ReleveNotes>(
      `${BASE_URL}/etudiant/${etudiant_id}/releve-notes`,
      { params }
    );
    return response.data;
  },

  /**
   * Récupère l'attestation de réussite
   */
  async getAttestationReussite(etudiant_id: number, annee_id: number): Promise<any> {
    const params = { annee_id };
    const response = await api.get(
      `${BASE_URL}/etudiant/${etudiant_id}/attestation-reussite`,
      { params }
    );
    return response.data;
  },

  /**
   * Télécharge le bulletin semestriel en PDF
   */
  async downloadBulletinSemestre(
    etudiant_id: number,
    session_id: number,
    semestre: number
  ): Promise<Blob> {
    const params = { session_id, semestre };
    const response = await api.get(
      `${BASE_URL}/etudiant/${etudiant_id}/download/bulletin-semestre`,
      {
        params,
        responseType: 'blob',
      }
    );
    return response.data;
  },

  /**
   * Télécharge le bulletin annuel en PDF
   */
  async downloadBulletinAnnuel(etudiant_id: number, annee_id: number): Promise<Blob> {
    const params = { annee_id };
    const response = await api.get(
      `${BASE_URL}/etudiant/${etudiant_id}/download/bulletin-annuel`,
      {
        params,
        responseType: 'blob',
      }
    );
    return response.data;
  },

  /**
   * Utilitaire pour télécharger un blob
   */
  downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default bulletinService;
