/**
 * Types pour la gestion des années académiques, semestres, modules et stages.
 * Conforme au système CAMES LMD.
 */

// ============ Année Académique ============
export type StatutAnneeAcademique = 'brouillon' | 'ouverte' | 'en_cours' | 'cloturee' | 'archivee';

export interface AnneeAcademique {
  id: number;
  code: string;
  libelle: string;
  date_debut: string;
  date_fin: string;
  date_debut_inscriptions: string;
  date_fin_inscriptions: string;
  is_active: boolean;
  is_current: boolean;
  semestre_actif?: number;
  date_debut_semestre1?: string;
  date_fin_semestre1?: string;
  date_debut_semestre2?: string;
  date_fin_semestre2?: string;
  statut: StatutAnneeAcademique;
  annee_precedente_id?: number;
  est_reconduite: boolean;
  date_ouverture?: string;
  date_cloture?: string;
  ouverte_par?: number;
  cloturee_par?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAnneeAcademique {
  code: string;
  libelle: string;
  date_debut: string;
  date_fin: string;
  date_debut_inscriptions: string;
  date_fin_inscriptions: string;
  date_debut_semestre1?: string;
  date_fin_semestre1?: string;
  date_debut_semestre2?: string;
  date_fin_semestre2?: string;
}

export interface UpdateAnneeAcademique {
  libelle?: string;
  date_debut?: string;
  date_fin?: string;
  date_debut_inscriptions?: string;
  date_fin_inscriptions?: string;
  date_debut_semestre1?: string;
  date_fin_semestre1?: string;
  date_debut_semestre2?: string;
  date_fin_semestre2?: string;
}


// ============ Semestre ============
export interface Semestre {
  id: number;
  code: string;
  libelle: string;
  cycle_id: number;
  numero_semestre: number;
  annee_dans_cycle: number;
  semestre_dans_annee: number;
  credits_requis: number;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateSemestre {
  code: string;
  libelle: string;
  cycle_id: number;
  numero_semestre: number;
  annee_dans_cycle: number;
  semestre_dans_annee: number;
  credits_requis?: number;
  description?: string;
}

export type UpdateSemestre = Partial<Omit<CreateSemestre, 'code' | 'cycle_id' | 'numero_semestre'>>;

// ============ Module Système ============
export interface ModuleSysteme {
  id: number;
  code: string;
  libelle: string;
  description?: string;
  icone?: string;
  ordre: number;
  est_obligatoire: boolean;
  permissions_requises?: string[];
  dependances?: string[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// ============ Module Actif ============
export interface ModuleActif {
  id: number;
  module_id: number;
  universite_id?: number;
  annee_academique_id?: number;
  est_actif: boolean;
  date_activation?: string;
  date_desactivation?: string;
  active_par?: number;
  desactive_par?: number;
  configuration?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface ActiverModuleRequest {
  universite_id?: number;
  annee_id?: number;
  configuration?: Record<string, unknown>;
}

export interface DesactiverModuleRequest {
  universite_id?: number;
  annee_id?: number;
}

// ============ Période Comptable ============
export interface PeriodeComptable {
  id: number;
  code: string;
  libelle: string;
  annee_academique_id: number;
  date_debut: string;
  date_fin: string;
  statut: 'ouverte' | 'cloturee';
  est_periode_courante: boolean;
  date_cloture?: string;
  cloturee_par?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePeriodeComptable {
  code: string;
  libelle: string;
  annee_academique_id: number;
  date_debut: string;
  date_fin: string;
}

// ============ Stage ============
export interface Stage {
  id: number;
  code: string;
  etudiant_id: number;
  matiere_id: number;
  niveau_id: number;
  annee_academique_id: number;
  type_stage: 'observation' | 'pratique' | 'professionnel' | 'recherche';
  duree_semaines: number;
  date_debut: string;
  date_fin: string;
  entreprise_nom: string;
  entreprise_adresse?: string;
  entreprise_telephone?: string;
  entreprise_email?: string;
  maitre_stage_nom: string;
  maitre_stage_fonction?: string;
  maitre_stage_email?: string;
  encadrant_academique_id?: number;
  theme: string;
  objectifs?: string;
  statut: 'en_cours' | 'termine' | 'valide' | 'invalide';
  rapport_url?: string;
  date_depot_rapport?: string;
  note_entreprise?: number;
  note_rapport?: number;
  note_soutenance?: number;
  note_finale?: number;
  observations?: string;
  created_at?: string;
  updated_at?: string;
  etudiant_nom?: string;
  etudiant_prenom?: string;
  etudiant_matricule?: string;
  matiere_code?: string;
  matiere_libelle?: string;
  niveau_libelle?: string;
}

export interface CreateStage {
  etudiant_id: number;
  matiere_id: number;
  niveau_id: number;
  annee_academique_id: number;
  type_stage: string;
  duree_semaines: number;
  date_debut: string;
  date_fin: string;
  entreprise_nom: string;
  maitre_stage_nom: string;
  theme: string;
  entreprise_adresse?: string;
  entreprise_telephone?: string;
  entreprise_email?: string;
  maitre_stage_fonction?: string;
  maitre_stage_email?: string;
  encadrant_academique_id?: number;
  objectifs?: string;
}

export type UpdateStage = Partial<Omit<CreateStage, 'etudiant_id' | 'matiere_id' | 'niveau_id' | 'annee_academique_id'>>;

export interface ValiderStageRequest {
  note_entreprise: number;
  note_rapport: number;
  observations?: string;
}

// ============ Soutenance ============
export interface Soutenance {
  id: number;
  stage_id: number;
  date_soutenance: string;
  lieu: string;
  salle_id?: number;
  duree_minutes: number;
  president_jury_id: number;
  rapporteur_id: number;
  examinateur_id?: number;
  note_presentation?: number;
  note_defense?: number;
  note_jury?: number;
  note_finale?: number;
  appreciation?: 'excellent' | 'tres_bien' | 'bien' | 'assez_bien' | 'passable' | 'insuffisant';
  mention?: string;
  observations_jury?: string;
  statut: 'programmee' | 'en_cours' | 'terminee' | 'validee';
  proces_verbal_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateSoutenance {
  stage_id: number;
  date_soutenance: string;
  lieu: string;
  president_jury_id: number;
  rapporteur_id: number;
  salle_id?: number;
  examinateur_id?: number;
  duree_minutes?: number;
}

export type UpdateSoutenance = Partial<Omit<CreateSoutenance, 'stage_id'>>;

export interface ValiderSoutenanceRequest {
  note_presentation: number;
  note_defense: number;
  note_jury: number;
  observations_jury?: string;
}

// ============ Configuration Délibération ============
export interface ConfigurationDeliberation {
  id: number;
  annee_academique_id: number;
  niveau_id?: number;
  periodicite: 'semestrielle' | 'annuelle';
  compensation_semestres: boolean;
  note_eliminatoire?: number;
  nombre_matieres_dette_max?: number;
  moyenne_validation: number;
  moyenne_passage_conditionnel?: number;
  credits_min_passage?: number;
  taux_presence_min?: number;
  autoriser_rattrapage: boolean;
  nombre_sessions_max: number;
  regles_specifiques?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface CreateConfigurationDeliberation {
  annee_academique_id: number;
  niveau_id?: number;
  periodicite?: string;
  compensation_semestres?: boolean;
  note_eliminatoire?: number;
  nombre_matieres_dette_max?: number;
  moyenne_validation?: number;
  moyenne_passage_conditionnel?: number;
  credits_min_passage?: number;
  taux_presence_min?: number;
  autoriser_rattrapage?: boolean;
  nombre_sessions_max?: number;
  regles_specifiques?: Record<string, unknown>;
}

export type UpdateConfigurationDeliberation = Partial<Omit<CreateConfigurationDeliberation, 'annee_academique_id'>>;

// ============ Gestion Année Académique ============
export interface ElementsReconduction {
  filieres: boolean;
  modules: boolean;
  matieres: boolean;
  salles: boolean;
  creneaux: boolean;
  frais_scolarite: boolean;
  types_frais: boolean;
  configurations: boolean;
}

export interface OuvrirAnneeRequest {
  reconduire: boolean;
  elements_a_reconduire?: ElementsReconduction;
}

export interface CloturerSemestreRequest {
  semestre: number;
}

export interface ReconduireRequest {
  annee_source_id: number;
  annee_cible_id: number;
  elements: ElementsReconduction;
}

export interface RapportReconduction {
  filieres_copiees: number;
  modules_copies: number;
  matieres_copiees: number;
  salles_copiees: number;
  creneaux_copies: number;
  frais_scolarite_copies: number;
  types_frais_copies: number;
  erreurs: string[];
}

export interface RapportAnnee {
  annee: {
    id: number;
    code: string;
    libelle: string;
    statut: string;
    semestre_actif?: number;
  };
  statistiques: {
    etudiants: {
      total: number;
    };
    inscriptions: {
      total: number;
    };
    finances: {
      total_facture: number;
      total_paye: number;
      total_restant: number;
      taux_recouvrement: number;
    };
    deliberations: {
      total: number;
    };
  };
}

export interface StatutAnnee {
  annee: {
    id: number;
    code: string;
    libelle: string;
    statut: string;
    semestre_actif?: number;
    date_debut: string;
    date_fin: string;
    date_ouverture?: string;
    date_cloture?: string;
    est_reconduite: boolean;
  };
  modules_actifs: number;
  periodes_comptables: {
    id: number;
    code: string;
    statut: string;
    est_courante: boolean;
  }[];
}

// ============ Structure LMD ============
export interface StructureCycle {
  code: string;
  libelle: string;
  duree_annees: number;
  credits_total: number;
  semestres: {
    id: number;
    code: string;
    libelle: string;
    numero: number;
    annee: number;
    credits: number;
  }[];
}

export interface StructureLMD {
  licence: StructureCycle;
  master: StructureCycle;
  doctorat: StructureCycle;
}

// ============ Statistiques Stages ============
export interface StatistiquesStages {
  total: number;
  en_cours: number;
  termines: number;
  valides: number;
  invalides: number;
  taux_validation: number;
  moyenne_notes: number;
  par_type: Record<string, number>;
}

// ============ Constantes ============
export const TYPES_STAGE = [
  { value: 'observation', label: 'Stage d\'observation' },
  { value: 'pratique', label: 'Stage pratique' },
  { value: 'professionnel', label: 'Stage professionnel' },
  { value: 'recherche', label: 'Stage de recherche' },
];

export const STATUTS_STAGE = [
  { value: 'en_cours', label: 'En cours', color: 'info' },
  { value: 'termine', label: 'Terminé', color: 'warning' },
  { value: 'valide', label: 'Validé', color: 'success' },
  { value: 'invalide', label: 'Invalidé', color: 'error' },
];

export const STATUTS_SOUTENANCE = [
  { value: 'programmee', label: 'Programmée', color: 'info' },
  { value: 'en_cours', label: 'En cours', color: 'warning' },
  { value: 'terminee', label: 'Terminée', color: 'primary' },
  { value: 'validee', label: 'Validée', color: 'success' },
];

export const APPRECIATIONS_SOUTENANCE = [
  { value: 'excellent', label: 'Excellent', min: 18 },
  { value: 'tres_bien', label: 'Très Bien', min: 16 },
  { value: 'bien', label: 'Bien', min: 14 },
  { value: 'assez_bien', label: 'Assez Bien', min: 12 },
  { value: 'passable', label: 'Passable', min: 10 },
  { value: 'insuffisant', label: 'Insuffisant', min: 0 },
];

export const STATUTS_ANNEE = [
  { value: 'brouillon', label: 'Brouillon', color: 'secondary' },
  { value: 'ouverte', label: 'Ouverte', color: 'info' },
  { value: 'en_cours', label: 'En cours', color: 'primary' },
  { value: 'cloturee', label: 'Clôturée', color: 'success' },
  { value: 'archivee', label: 'Archivée', color: 'default' },
];

export const PERIODICITES_DELIBERATION = [
  { value: 'semestrielle', label: 'Semestrielle' },
  { value: 'annuelle', label: 'Annuelle' },
];
