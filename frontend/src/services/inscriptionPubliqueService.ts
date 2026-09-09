/**
 * Service pour l'inscription publique (sans authentification)
 */

import api from './api';
import {
  CampagneInscription,
  DossierCandidature,
  CreateDossierCandidature,
  PieceJointe,
  Paiement,
  CreatePaiement,
  TypePieceRequise,
  DossierCandidatureDetails,
} from '../types/inscription';

const BASE_URL = '/api/v1/public/inscription';

export const inscriptionPubliqueService = {
  /**
   * Liste les campagnes ouvertes (public)
   */
  async getCampagnesPubliques(): Promise<CampagneInscription[]> {
    const response = await api.get<CampagneInscription[]>(`${BASE_URL}/campagnes`);
    return response.data;
  },

  /**
   * Récupère les détails d'une campagne (public)
   */
  async getCampagnePublique(id: number): Promise<CampagneInscription> {
    const response = await api.get<CampagneInscription>(`${BASE_URL}/campagnes/${id}`);
    return response.data;
  },

  /**
   * Liste les pièces requises pour une campagne (public)
   */
  async getPiecesRequises(campagne_id: number): Promise<TypePieceRequise[]> {
    const response = await api.get<TypePieceRequise[]>(
      `${BASE_URL}/campagnes/${campagne_id}/pieces-requises`
    );
    return response.data;
  },

  /**
   * Récupère le nombre de places restantes (public)
   */
  async getPlacesRestantes(campagne_id: number): Promise<{ places_totales: number | null; places_restantes: number | null }> {
    const response = await api.get<{ places_totales: number | null; places_restantes: number | null }>(
      `${BASE_URL}/campagnes/${campagne_id}/places-restantes`
    );
    return response.data;
  },

  /**
   * Crée un dossier de candidature (public)
   */
  async createDossierPublic(data: CreateDossierCandidature): Promise<DossierCandidature> {
    const response = await api.post<DossierCandidature>(`${BASE_URL}/dossiers`, data);
    return response.data;
  },

  /**
   * Récupère un dossier par son numéro (public)
   */
  async getDossierPublic(numero: string): Promise<DossierCandidature> {
    const response = await api.get<DossierCandidature>(`${BASE_URL}/dossiers/${numero}`);
    return response.data;
  },

  /**
   * Récupère les détails complets d'un dossier (public)
   */
  async getDossierDetailsPublic(numero: string): Promise<DossierCandidatureDetails> {
    const response = await api.get<DossierCandidatureDetails>(`${BASE_URL}/dossiers/${numero}/details`);
    return response.data;
  },

  /**
   * Upload une pièce jointe (public)
   */
  async uploadPiece(dossier_id: number, formData: FormData): Promise<PieceJointe> {
    const response = await api.post<PieceJointe>(
      `${BASE_URL}/dossiers/${dossier_id}/pieces`,
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
   * Soumet un dossier (public)
   */
  async soumettreDossierPublic(dossier_id: number): Promise<DossierCandidature> {
    const response = await api.post<DossierCandidature>(
      `${BASE_URL}/dossiers/${dossier_id}/soumettre`
    );
    return response.data;
  },

  /**
   * Crée un paiement (public)
   */
  async createPaiementPublic(data: CreatePaiement): Promise<Paiement> {
    const response = await api.post<Paiement>(`${BASE_URL}/paiements`, data);
    return response.data;
  },

  /**
   * Liste les paiements d'un dossier (public)
   */
  async getPaiementsDossier(dossier_id: number): Promise<Paiement[]> {
    const response = await api.get<Paiement[]>(`${BASE_URL}/paiements/dossier/${dossier_id}`);
    return response.data;
  },
};

export default inscriptionPubliqueService;
