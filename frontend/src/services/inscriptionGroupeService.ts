/**
 * Service pour l'inscription par groupe via fichier Excel
 */

import api from './api';

export interface InscriptionGroupeResult {
  total: number;
  success: number;
  errors: Array<{
    line: number;
    error: string;
  }>;
  created_students: Array<{
    matricule: string;
    nom: string;
    prenom: string;
  }>;
}

export interface TemplateInfo {
  columns: string[];
  description: string;
  example: Record<string, string>;
}

export const inscriptionGroupeService = {
  /**
   * Upload un fichier Excel pour inscription par groupe
   */
  async uploadInscriptions(
    file: File,
    filiereId: number,
    niveauId: number,
    anneeAcademique: string,
    typeInscription: string = 'nouvelle'
  ): Promise<InscriptionGroupeResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filiere_id', filiereId.toString());
    formData.append('niveau_id', niveauId.toString());
    formData.append('annee_academique', anneeAcademique);
    formData.append('type_inscription', typeInscription);

    const response = await api.post<InscriptionGroupeResult>(
      '/inscription-groupe/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Récupère les informations sur le format du fichier Excel
   */
  async getTemplate(): Promise<TemplateInfo> {
    const response = await api.get<TemplateInfo>('/inscription-groupe/template');
    return response.data;
  },
};

export default inscriptionGroupeService;
