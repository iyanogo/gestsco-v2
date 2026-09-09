/**
 * Service portail étudiant - routes /mes-* (sans ID en URL).
 */

import api from './api';
import type { Inscription } from '../types/etudiant';
import type { ResultatSemestre, ResultatMatiere, ResultatAnnuel } from '../types/evaluation';
import type { Facture, CompteEtudiantWithDetails, PaiementFacture } from '../types/finance';
import type { Presence, StatistiquesPresence, Seance } from '../types/emploiTemps';
import type { Stage } from '../types/anneeAcademique';
import type { DocumentEtudiant } from '../types/etudiant';

export interface MesProfilResponse {
  etudiant: {
    id: number;
    matricule: string | null;
    nom: string;
    prenom: string;
    email: string | null;
    full_name: string;
    telephone?: string | null;
    date_naissance?: string | null;
    lieu_naissance?: string | null;
    sexe?: string | null;
    nationalite?: string | null;
    adresse?: string | null;
    ville?: string | null;
    statut?: string | null;
  };
  inscription_active: Inscription | null;
}

export interface MesResultatsResponse {
  etudiant_id: number;
  semestres: ResultatSemestre[];
  matieres: ResultatMatiere[];
  annuels: ResultatAnnuel[];
}

export interface EnseignementScope {
  matiere_id: number;
  niveau_id: number;
  filiere_id: number | null;
  matiere_code: string | null;
  matiere_libelle: string | null;
  niveau_code: string | null;
  niveau_libelle: string | null;
  filiere_code: string | null;
  filiere_libelle: string | null;
}

export interface TeacherEtudiant {
  etudiant_id: number;
  matricule: string | null;
  nom: string | null;
  prenom: string | null;
  email: string | null;
  niveau_id: number;
  niveau_libelle: string | null;
  filiere_id: number;
  filiere_libelle: string | null;
  matieres: Array<{
    matiere_id: number;
    matiere_code: string | null;
    matiere_libelle: string | null;
  }>;
}

export const portalService = {
  async getMesProfil(): Promise<MesProfilResponse> {
    const response = await api.get<MesProfilResponse>('/api/v1/inscriptions/mes-profil');
    return response.data;
  },

  async getMesInscriptionCurrent(): Promise<Inscription> {
    const response = await api.get<Inscription>('/api/v1/inscriptions/mes-inscription/current');
    return response.data;
  },

  async getMesInscriptions(): Promise<Inscription[]> {
    const response = await api.get<Inscription[]>('/api/v1/inscriptions/mes-inscriptions');
    return response.data;
  },

  async getMesResultats(session_id?: number, annee_id?: number): Promise<MesResultatsResponse> {
    const params: Record<string, number> = {};
    if (session_id) params.session_id = session_id;
    if (annee_id) params.annee_id = annee_id;
    const response = await api.get<MesResultatsResponse>('/api/v1/resultats/mes-resultats', { params });
    return response.data;
  },

  async getMesPresences(params?: {
    date_debut?: string;
    date_fin?: string;
    matiere_id?: number;
  }): Promise<Presence[]> {
    const response = await api.get<Presence[]>('/api/v1/presences/mes-presences', { params });
    return response.data;
  },

  async getMesPresencesTaux(params?: {
    matiere_id?: number;
    date_debut?: string;
    date_fin?: string;
  }): Promise<StatistiquesPresence> {
    const response = await api.get<StatistiquesPresence>(
      '/api/v1/presences/mes-presences/taux',
      { params }
    );
    return response.data;
  },

  async getMesDocuments(): Promise<DocumentEtudiant[]> {
    const response = await api.get<DocumentEtudiant[]>('/api/v1/documents-etudiant/mes-documents');
    return response.data;
  },

  async getMesFactures(annee_id?: number): Promise<Facture[]> {
    const params = annee_id ? { annee_id } : undefined;
    const response = await api.get<Facture[]>('/api/v1/factures/mes-factures', { params });
    return response.data;
  },

  async getMonCompte(annee_id?: number): Promise<CompteEtudiantWithDetails> {
    const params = annee_id ? { annee_id } : undefined;
    const response = await api.get<CompteEtudiantWithDetails>(
      '/api/v1/comptes-etudiants/mon-compte',
      { params }
    );
    return response.data;
  },

  async getMesPaiements(params?: { date_debut?: string; date_fin?: string }): Promise<PaiementFacture[]> {
    const response = await api.get<PaiementFacture[]>('/api/v1/paiements-factures/mes-paiements', {
      params,
    });
    return response.data;
  },

  /** Portail enseignant */
  async getMesSeances(params?: { date_debut?: string; date_fin?: string }): Promise<Seance[]> {
    const response = await api.get<Seance[]>('/api/v1/seances/mes-seances', { params });
    return response.data;
  },

  async getMesStagesEncadres(): Promise<Stage[]> {
    const response = await api.get<Stage[]>('/api/v1/stages/mes-stages-encadres');
    return response.data;
  },

  async getMesStages(): Promise<Stage[]> {
    const response = await api.get<Stage[]>('/api/v1/stages/mes-stages');
    return response.data;
  },

  async getMesMatieresEnseignement(): Promise<EnseignementScope[]> {
    const response = await api.get<EnseignementScope[]>(
      '/api/v1/seances/mes-matieres-enseignement'
    );
    return response.data;
  },

  async getMesEtudiants(params?: {
    matiere_id?: number;
    niveau_id?: number;
  }): Promise<TeacherEtudiant[]> {
    const response = await api.get<TeacherEtudiant[]>('/api/v1/seances/mes-etudiants', {
      params,
    });
    return response.data;
  },
};

export default portalService;
