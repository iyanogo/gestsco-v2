/**
 * Types pour les entités de référence CAMES
 * Adaptés à la structure de la base de données existante
 */

// ============ Universite ============
export interface Universite {
  id: number;
  code?: string;
  nom?: string;
  libelle?: string; // Alias de nom pour compatibilité
  sigle?: string;
  ville?: string;
  adresse?: string;
  telephone?: string;
  fixe?: string;
  email?: string;
  site?: string;
  created_by?: string;
  created_date?: string;
  last_modified_by?: string;
  last_modified_date?: string;
}

export interface CreateUniversite {
  code?: string;
  nom?: string;
  sigle?: string;
  ville?: string;
  adresse?: string;
  telephone?: string;
  fixe?: string;
  email?: string;
  site?: string;
}

export interface UpdateUniversite extends Partial<CreateUniversite> {};

// ============ Etablissement ============
export interface Etablissement {
  id: number;
  code?: string;
  nom?: string;
  libelle?: string; // Alias de nom
  sigle?: string;
  ville?: string;
  adresse?: string;
  telephone?: string;
  fixe?: string;
  email?: string;
  universite_id?: number;
  nom_directeur?: string;
  prenom_directeur?: string;
  tel_directeur?: string;
  created_by?: string;
  created_date?: string;
  last_modified_by?: string;
  last_modified_date?: string;
}

export interface CreateEtablissement {
  code?: string;
  nom?: string;
  sigle?: string;
  ville?: string;
  adresse?: string;
  telephone?: string;
  fixe?: string;
  email?: string;
  universite_id?: number;
  nom_directeur?: string;
  prenom_directeur?: string;
  tel_directeur?: string;
}

export type UpdateEtablissement = Partial<CreateEtablissement>;

// ============ Departement ============
export interface Departement {
  id: number;
  code?: string;
  libelle?: string;
  sigle?: string;
  etablissement_id?: number;
  created_by?: string;
  created_date?: string;
  last_modified_by?: string;
  last_modified_date?: string;
}

export interface CreateDepartement {
  code?: string;
  libelle?: string;
  sigle?: string;
  etablissement_id?: number;
}

export type UpdateDepartement = Partial<CreateDepartement>;

// ============ Cycle ============
export interface Cycle {
  id: number;
  code?: string;
  libelle?: string;
  sigle?: string;
  created_by?: string;
  created_date?: string;
  last_modified_by?: string;
  last_modified_date?: string;
}

export interface CreateCycle {
  code?: string;
  libelle?: string;
  sigle?: string;
}

export type UpdateCycle = Partial<CreateCycle>;

// ============ Filiere ============
export interface Filiere {
  id: number;
  code?: string;
  libelle?: string;
  sigle?: string;
  annee?: string;
  etablissement_id?: number;
  coordinateur_id?: number;
  created_by?: string;
  created_date?: string;
  last_modified_by?: string;
  last_modified_date?: string;
}

export interface CreateFiliere {
  code?: string;
  libelle?: string;
  sigle?: string;
  annee?: string;
  etablissement_id?: number;
  coordinateur_id?: number;
}

export type UpdateFiliere = Partial<CreateFiliere>;

// ============ Niveau ============
export interface Niveau {
  id: number;
  code?: string;
  libelle?: string;
  created_by?: string;
  created_date?: string;
  last_modified_by?: string;
  last_modified_date?: string;
}

export interface CreateNiveau {
  code?: string;
  libelle?: string;
}

export type UpdateNiveau = Partial<CreateNiveau>;

// ============ Module ============
export interface Module {
  id: number;
  code?: string;
  libelle?: string;
  sigle?: string;
  vol_horaire?: string;
  annee?: string;
  tpe?: number;
  va?: number;
  vcvh?: number;
  vp?: number;
  coordinateur_id?: number;
  semestre_id?: number;
  filiere_id?: number;
  created_by?: string;
  created_date?: string;
  last_modified_by?: string;
  last_modified_date?: string;
}

export interface CreateModule {
  code?: string;
  libelle?: string;
  sigle?: string;
  vol_horaire?: string;
  annee?: string;
  tpe?: number;
  va?: number;
  vcvh?: number;
  vp?: number;
  coordinateur_id?: number;
  semestre_id?: number;
  filiere_id?: number;
}

export type UpdateModule = Partial<CreateModule>;

// ============ Matiere ============
export interface Matiere {
  id: number;
  code?: string;
  libelle?: string;
  sigle?: string;
  annee?: string;
  tpe?: number;
  va?: number;
  vcvh?: number;
  vp?: number;
  credit?: number;
  obligatoire?: boolean;
  module_id?: number;
  created_by?: string;
  created_date?: string;
  last_modified_by?: string;
  last_modified_date?: string;
}

export interface CreateMatiere {
  code?: string;
  libelle?: string;
  sigle?: string;
  annee?: string;
  tpe?: number;
  va?: number;
  vcvh?: number;
  vp?: number;
  credit?: number;
  obligatoire?: boolean;
  module_id?: number;
}

export type UpdateMatiere = Partial<CreateMatiere>;

// ============ Annee ============
export interface Annee {
  id: number;
  code?: string;
  libelle?: string;
  statut?: boolean;
  etat?: string;
  lier_enseignement?: boolean;
  created_by?: string;
  created_date?: string;
  last_modified_by?: string;
  last_modified_date?: string;
}

export interface CreateAnnee {
  code?: string;
  libelle?: string;
  statut?: boolean;
  etat?: string;
  lier_enseignement?: boolean;
}

export type UpdateAnnee = Partial<CreateAnnee>;

// ============ Réponses paginées ============
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// ============ Réponse comptage ============
export interface CountResponse {
  total: number;
}

// ============ Réponse message ============
export interface MessageResponse {
  message: string;
  success?: boolean;
}

// ============ Volume horaire ============
export interface VolumeHoraireResponse {
  matiere_id: number;
  volume_horaire_cm: number;
  volume_horaire_td: number;
  volume_horaire_tp: number;
  volume_horaire_total: number;
}
