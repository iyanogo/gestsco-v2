/**
 * Types pour les entités du module Étudiant
 */

// ============ Etudiant ============
export interface Etudiant {
  id: number;
  matricule?: string;
  numero_carte?: string;
  ine?: string;
  nom: string;
  prenom: string;
  date_naissance?: string;
  lieu_naissance?: string;
  sexe?: string;
  nationalite?: string;
  photo_url?: string;
  email?: string;
  telephone?: string;
  telephone_urgence?: string;
  adresse?: string;
  ville?: string;
  pays?: string;
  nom_pere?: string;
  profession_pere?: string;
  nom_mere?: string;
  profession_mere?: string;
  personne_contact?: string;
  telephone_contact?: string;
  statut?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  last_modified_by?: string;
  last_modified_date?: string;
}

export type CreateEtudiant = Omit<Etudiant, 'id' | 'matricule' | 'created_at' | 'updated_at'>;

export type UpdateEtudiant = Partial<CreateEtudiant>;

export interface EtudiantWithDetails extends Etudiant {
  documents: DocumentEtudiant[];
  inscriptions: Inscription[];
}

export interface EtudiantStatistiques {
  total: number;
  par_statut: Record<string, number>;
  par_sexe: Record<string, number>;
}

// ============ DocumentEtudiant ============
export interface DocumentEtudiant {
  id: number;
  etudiant_id: number;
  type_document: string;
  libelle?: string;
  numero_document?: string;
  date_delivrance?: string;
  lieu_delivrance?: string;
  fichier_url?: string;
  format_fichier?: string;
  taille_fichier?: number;
  statut?: string;
  commentaire?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateDocumentEtudiant {
  etudiant_id: number;
  type_document: string;
  libelle?: string;
  numero_document?: string;
  date_delivrance?: string;
  lieu_delivrance?: string;
  fichier_url?: string;
  format_fichier?: string;
  taille_fichier?: number;
}

export type UpdateDocumentEtudiant = Partial<Omit<CreateDocumentEtudiant, 'etudiant_id'>>;

// ============ Inscription ============
export interface Inscription {
  id: number;
  etudiant_id: number;
  filiere_id?: number;
  niveau_id?: number;
  annee_academique: string;
  date_inscription?: string;
  type_inscription?: string;
  regime_etudes?: string;
  statut_inscription?: string;
  frais_inscription?: number;
  frais_payes?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateInscription {
  etudiant_id: number;
  filiere_id?: number;
  niveau_id?: number;
  annee_academique: string;
  date_inscription?: string;
  type_inscription?: string;
  regime_etudes?: string;
  frais_inscription?: number;
  frais_payes?: number;
}

export type UpdateInscription = Partial<Omit<CreateInscription, 'etudiant_id'>>;

export interface InscriptionWithMatieres extends Inscription {
  inscriptions_matieres: InscriptionMatiere[];
}

export interface InscriptionStatistiques {
  total: number;
  par_filiere: Record<string, number>;
  par_niveau: Record<string, number>;
  par_statut: Record<string, number>;
}

// ============ InscriptionMatiere ============
export interface InscriptionMatiere {
  id: number;
  inscription_id: number;
  matiere_id: number;
  semestre: number;
  is_active?: boolean;
  created_at?: string;
}

export interface CreateInscriptionMatiere {
  inscription_id: number;
  matiere_id: number;
  semestre: number;
}

export interface BulkCreateInscriptionMatiere {
  inscription_id: number;
  matiere_ids: number[];
  semestre: number;
}

// ============ Constantes ============
export const STATUTS_ETUDIANT = ['actif', 'suspendu', 'diplômé', 'exclu'] as const;
export type StatutEtudiant = typeof STATUTS_ETUDIANT[number];

export const STATUTS_DOCUMENT = ['en_attente', 'valide', 'refuse'] as const;
export type StatutDocument = typeof STATUTS_DOCUMENT[number];

export const STATUTS_INSCRIPTION = ['en_cours', 'validee', 'annulee'] as const;
export type StatutInscription = typeof STATUTS_INSCRIPTION[number];

export const TYPES_DOCUMENT = [
  'Acte de naissance',
  'Certificat de nationalité',
  'Baccalauréat',
  'Relevé de notes',
  'Photo d\'identité',
  'Carte d\'identité',
  'Passeport',
  'Certificat médical',
  'Autre',
] as const;

export const TYPES_INSCRIPTION = ['nouvelle', 'redoublement', 'transfert'] as const;
export const REGIMES_ETUDES = ['présentiel', 'distance'] as const;

// ============ Couleurs des statuts ============
export const STATUT_COLORS: Record<string, 'success' | 'warning' | 'info' | 'error' | 'default'> = {
  actif: 'success',
  suspendu: 'warning',
  'diplômé': 'info',
  diplome: 'info',
  exclu: 'error',
  en_attente: 'warning',
  valide: 'success',
  refuse: 'error',
  en_cours: 'warning',
  validee: 'success',
  annulee: 'error',
};
