/**
 * Types pour le module d'inscription en ligne
 */

import type { AnneeAcademique as AnneeAcademiqueType } from './anneeAcademique';

// Réexporter AnneeAcademique depuis le fichier principal
export type { 
  AnneeAcademique, 
  CreateAnneeAcademique, 
  UpdateAnneeAcademique 
} from './anneeAcademique';

// Alias local pour utilisation dans ce fichier
type AnneeAcademique = AnneeAcademiqueType;

// Campagne d'Inscription
export interface CampagneInscription {
  id: number;
  code: string;
  libelle: string;
  annee_academique_id: number;
  cycle_id: number;
  date_ouverture: string;
  date_cloture: string;
  date_limite_paiement: string | null;
  frais_inscription: number;
  frais_dossier: number;
  nombre_places: number | null;
  description: string | null;
  conditions: string | null;
  statut: 'brouillon' | 'ouverte' | 'cloturee';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  annee_academique?: AnneeAcademique;
  cycle?: { id: number; code: string; libelle: string };
}

export interface CreateCampagneInscription {
  code: string;
  libelle: string;
  annee_academique_id: number;
  cycle_id: number;
  date_ouverture: string;
  date_cloture: string;
  date_limite_paiement?: string;
  frais_inscription: number;
  frais_dossier: number;
  nombre_places?: number;
  description?: string;
  conditions?: string;
}

export interface UpdateCampagneInscription {
  code?: string;
  libelle?: string;
  annee_academique_id?: number;
  cycle_id?: number;
  date_ouverture?: string;
  date_cloture?: string;
  date_limite_paiement?: string;
  frais_inscription?: number;
  frais_dossier?: number;
  nombre_places?: number;
  description?: string;
  conditions?: string;
  statut?: 'brouillon' | 'ouverte' | 'cloturee';
}

// Dossier de Candidature
export interface DossierCandidature {
  id: number;
  numero_dossier: string;
  campagne_id: number;
  etudiant_id: number | null;
  candidat_nom: string;
  candidat_prenom: string;
  candidat_email: string;
  candidat_telephone: string;
  candidat_date_naissance: string | null;
  candidat_lieu_naissance: string | null;
  candidat_sexe: 'M' | 'F' | null;
  candidat_nationalite: string | null;
  candidat_adresse: string | null;
  filiere_souhaitee_1: number | null;
  filiere_souhaitee_2: number | null;
  filiere_souhaitee_3: number | null;
  diplome_precedent: string | null;
  etablissement_precedent: string | null;
  annee_obtention_diplome: string | null;
  moyenne_generale: number | null;
  statut_dossier: 'en_cours' | 'complet' | 'valide' | 'refuse' | 'admis';
  date_soumission: string | null;
  date_validation: string | null;
  commentaire_validation: string | null;
  filiere_admise: number | null;
  created_at: string;
  updated_at: string;
  // Relations
  campagne?: CampagneInscription;
  filiere_1?: { id: number; code: string; libelle: string };
  filiere_2?: { id: number; code: string; libelle: string };
  filiere_3?: { id: number; code: string; libelle: string };
  pieces_jointes?: PieceJointe[];
  paiements?: Paiement[];
}

export interface CreateDossierCandidature {
  campagne_id: number;
  candidat_nom: string;
  candidat_prenom: string;
  candidat_email: string;
  candidat_telephone: string;
  candidat_date_naissance?: string;
  candidat_lieu_naissance?: string;
  candidat_sexe?: 'M' | 'F';
  candidat_nationalite?: string;
  candidat_adresse?: string;
  filiere_souhaitee_1?: number;
  filiere_souhaitee_2?: number;
  filiere_souhaitee_3?: number;
  diplome_precedent?: string;
  etablissement_precedent?: string;
  annee_obtention_diplome?: string;
  moyenne_generale?: number;
}

export interface UpdateDossierCandidature {
  candidat_nom?: string;
  candidat_prenom?: string;
  candidat_email?: string;
  candidat_telephone?: string;
  candidat_date_naissance?: string;
  candidat_lieu_naissance?: string;
  candidat_sexe?: 'M' | 'F';
  candidat_nationalite?: string;
  candidat_adresse?: string;
  filiere_souhaitee_1?: number;
  filiere_souhaitee_2?: number;
  filiere_souhaitee_3?: number;
  diplome_precedent?: string;
  etablissement_precedent?: string;
  annee_obtention_diplome?: string;
  moyenne_generale?: number;
}

// Pièce Jointe
export interface PieceJointe {
  id: number;
  dossier_id: number;
  type_piece: string;
  libelle: string;
  fichier_url: string;
  format_fichier: string | null;
  taille_fichier: number | null;
  is_required: boolean;
  is_valide: boolean | null;
  commentaire: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePieceJointe {
  dossier_id: number;
  type_piece: string;
  libelle: string;
  fichier_url: string;
  format_fichier?: string;
  taille_fichier?: number;
  is_required?: boolean;
}

// Type de Pièce Requise
export interface TypePieceRequise {
  id: number;
  campagne_id: number;
  type_piece: string;
  libelle: string;
  description: string | null;
  is_required: boolean;
  ordre: number;
  formats_acceptes: string | null;
  taille_max: number | null;
}

// Paiement
export interface Paiement {
  id: number;
  numero_transaction: string;
  dossier_id: number | null;
  inscrit_id: number | null;
  type_paiement: string;
  montant: number;
  devise: string;
  mode_paiement: string;
  reference_paiement: string | null;
  date_paiement: string;
  statut_paiement: 'en_attente' | 'valide' | 'refuse';
  operateur: string | null;
  numero_recu: string | null;
  commentaire: string | null;
  valide_par: number | null;
  date_validation: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePaiement {
  dossier_id?: number;
  inscrit_id?: number;
  type_paiement: string;
  montant: number;
  devise?: string;
  mode_paiement: string;
  reference_paiement?: string;
  operateur?: string;
}

export interface UpdatePaiement {
  statut_paiement?: 'en_attente' | 'valide' | 'refuse';
  numero_recu?: string;
  commentaire?: string;
}

// Statistiques
export interface CampagneStatistiques {
  total_dossiers: number;
  dossiers_complets: number;
  dossiers_valides: number;
  admis: number;
  refuses: number;
}

export interface PlacesRestantes {
  places_totales: number | null;
  places_occupees: number;
  places_restantes: number | null;
}

// Dossier avec détails complets
export interface DossierCandidatureDetails extends DossierCandidature {
  pieces_jointes: PieceJointe[];
  paiements: Paiement[];
  montant_total_paye?: number;
}
