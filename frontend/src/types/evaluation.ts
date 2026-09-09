/**
 * Types pour le module d'évaluation LMD
 */

// ============ Sessions d'examen ============

export interface SessionExamen {
  id: number;
  code: string;
  libelle: string;
  annee_academique_id: number;
  type_session: 'normale' | 'rattrapage';
  semestre: 1 | 2;
  date_debut: string;
  date_fin: string;
  date_limite_saisie_notes?: string;
  date_deliberation?: string;
  statut: 'planifiee' | 'en_cours' | 'cloturee' | 'validee';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSessionExamen {
  code: string;
  libelle: string;
  annee_academique_id: number;
  type_session: 'normale' | 'rattrapage';
  semestre: 1 | 2;
  date_debut: string;
  date_fin: string;
  date_limite_saisie_notes?: string;
  date_deliberation?: string;
}

export interface UpdateSessionExamen {
  code?: string;
  libelle?: string;
  annee_academique_id?: number;
  type_session?: 'normale' | 'rattrapage';
  semestre?: 1 | 2;
  date_debut?: string;
  date_fin?: string;
  date_limite_saisie_notes?: string;
  date_deliberation?: string;
  statut?: string;
}

// ============ Examens ============

export type TypeEvaluation =
  | 'cc'
  | 'tp'
  | 'examen'
  | 'examen_final'
  | 'projet'
  | 'controle_continu'
  | 'examen_partiel';
export type StatutExamen = 'planifie' | 'en_cours' | 'termine' | 'notes_saisies' | 'valide';

export interface Examen {
  id: number;
  session_id: number;
  matiere_id: number;
  niveau_id: number;
  type_evaluation: TypeEvaluation;
  date_examen?: string;
  duree_minutes?: number;
  salle?: string;
  coefficient: number;
  note_sur: number;
  bareme?: string;
  anonymat: boolean;
  statut: StatutExamen;
  enseignant_id?: number;
  description?: string;
  created_at: string;
  updated_at: string;
  // Relations
  matiere?: { id: number; code: string; libelle: string };
  niveau?: { id: number; code: string; libelle: string };
  session?: SessionExamen;
}

export interface CreateExamen {
  session_id: number;
  matiere_id: number;
  niveau_id: number;
  type_evaluation: TypeEvaluation;
  date_examen?: string;
  duree_minutes?: number;
  salle?: string;
  coefficient?: number;
  note_sur?: number;
  bareme?: string;
  anonymat?: boolean;
  enseignant_id?: number;
  description?: string;
}

export interface UpdateExamen {
  matiere_id?: number;
  niveau_id?: number;
  type_evaluation?: TypeEvaluation;
  date_examen?: string;
  duree_minutes?: number;
  salle?: string;
  coefficient?: number;
  note_sur?: number;
  bareme?: string;
  anonymat?: boolean;
  enseignant_id?: number;
  description?: string;
  statut?: StatutExamen;
}

// ============ Notes ============

export type StatutPresence = 'present' | 'absent' | 'absent_justifie';

export interface Note {
  id: number;
  examen_id: number;
  inscription_matiere_id: number;
  etudiant_id: number;
  note?: number;
  note_sur: number;
  note_sur_20?: number;
  statut_presence: StatutPresence;
  numero_anonymat?: string;
  observation?: string;
  saisie_par?: number;
  date_saisie?: string;
  validee_par?: number;
  date_validation?: string;
  is_valide: boolean;
  created_at: string;
  updated_at: string;
}

export interface NoteWithEtudiant extends Note {
  etudiant?: {
    id: number;
    matricule: string;
    nom: string;
    prenom: string;
  };
}

export interface CreateNote {
  examen_id: number;
  inscription_matiere_id: number;
  etudiant_id: number;
  note?: number;
  note_sur?: number;
  statut_presence?: StatutPresence;
  numero_anonymat?: string;
  observation?: string;
}

export interface UpdateNote {
  note?: number;
  statut_presence?: StatutPresence;
  observation?: string;
}

export interface NoteBulkItem {
  inscription_matiere_id: number;
  etudiant_id: number;
  note?: number;
  note_sur?: number;
  statut_presence?: StatutPresence;
  observation?: string;
}

export interface NoteBulkCreate {
  examen_id: number;
  notes: NoteBulkItem[];
}

// ============ Résultats ============

export type StatutResultat = 'en_cours' | 'calcule' | 'valide';
export type DecisionResultat = 'en_cours' | 'admis' | 'admis_avec_dette' | 'ajourne' | 'redouble' | 'exclus';
export type Mention = 'passable' | 'assez_bien' | 'bien' | 'tres_bien' | 'excellent';

export interface ResultatMatiere {
  id: number;
  inscription_matiere_id: number;
  etudiant_id: number;
  matiere_id: number;
  session_id: number;
  note_cc?: number;
  note_tp?: number;
  note_examen?: number;
  moyenne_matiere?: number;
  credit_matiere: number;
  credit_obtenu: number;
  statut: StatutResultat | 'valide' | 'non_valide';
  decision: DecisionResultat;
  is_valide: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  matiere?: { id: number; code: string; libelle: string };
}

export interface ResultatSemestre {
  id: number;
  inscription_id: number;
  etudiant_id: number;
  session_id: number;
  semestre: 1 | 2;
  moyenne_generale?: number;
  total_credits_inscrits: number;
  total_credits_obtenus: number;
  total_credits_capitalises: number;
  nombre_matieres: number;
  nombre_matieres_validees: number;
  statut: StatutResultat;
  decision: DecisionResultat;
  mention?: Mention;
  rang?: number;
  effectif?: number;
  is_valide: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResultatAnnuel {
  id: number;
  inscription_id: number;
  etudiant_id: number;
  annee_academique_id?: number;
  niveau_id: number;
  moyenne_annuelle?: number;
  moyenne_semestre1?: number;
  moyenne_semestre2?: number;
  total_credits_inscrits: number;
  total_credits_obtenus: number;
  total_credits_capitalises: number;
  statut: StatutResultat;
  decision: DecisionResultat;
  mention?: Mention;
  passage_niveau_superieur: boolean;
  rang?: number;
  effectif?: number;
  is_valide: boolean;
  created_at: string;
  updated_at: string;
}

// ============ Délibérations ============

export type TypeDeliberation = 'semestrielle' | 'annuelle';
export type StatutDeliberation = 'en_cours' | 'terminee' | 'validee' | 'publiee';

export interface Deliberation {
  id: number;
  session_id: number;
  niveau_id: number;
  filiere_id: number;
  date_deliberation: string;
  type_deliberation: TypeDeliberation;
  semestre?: 1 | 2;
  president_jury?: number;
  nombre_etudiants: number;
  nombre_admis: number;
  nombre_ajournes: number;
  nombre_redoublants: number;
  taux_reussite?: number;
  statut: StatutDeliberation;
  publiee: boolean;
  validee_par?: number;
  date_validation?: string;
  date_publication?: string;
  observations?: string;
  created_at: string;
  updated_at: string;
  // Relations
  session?: SessionExamen;
  niveau?: { id: number; code: string; libelle: string };
  filiere?: { id: number; code: string; libelle: string };
}

export interface CreateDeliberation {
  session_id: number;
  niveau_id: number;
  filiere_id: number;
  type_deliberation: TypeDeliberation;
  semestre?: 1 | 2;
  date_deliberation?: string;
  president_jury?: number;
  observations?: string;
}

export interface UpdateDeliberation {
  date_deliberation?: string;
  president_jury?: number;
  observations?: string;
}

// ============ Bulletins ============

export interface BulletinSemestre {
  type: 'semestre';
  date_generation: string;
  etudiant: {
    id: number;
    matricule: string;
    nom: string;
    prenom: string;
    date_naissance?: string;
    lieu_naissance?: string;
    sexe?: string;
  };
  session: {
    id: number;
    code: string;
    libelle: string;
    type_session: string;
    semestre: number;
  };
  inscription?: {
    id: number;
    annee_academique: string;
    filiere_id: number;
    niveau_id: number;
  };
  matieres: ResultatMatiere[];
  resultat?: {
    moyenne_generale?: number;
    total_credits_inscrits: number;
    total_credits_obtenus: number;
    total_credits_capitalises: number;
    nombre_matieres: number;
    nombre_matieres_validees: number;
    mention?: Mention;
    decision: DecisionResultat;
    rang?: number;
    effectif?: number;
  };
}

export interface BulletinAnnuel {
  type: 'annuel';
  date_generation: string;
  etudiant: {
    id: number;
    matricule: string;
    nom: string;
    prenom: string;
    date_naissance?: string;
    lieu_naissance?: string;
    sexe?: string;
  };
  annee_academique_id: number;
  inscription?: {
    id: number;
    annee_academique: string;
    filiere_id: number;
    niveau_id: number;
  };
  semestres: {
    semestre: number;
    moyenne_generale?: number;
    total_credits_obtenus: number;
    total_credits_inscrits: number;
    mention?: Mention;
    decision: DecisionResultat;
    rang?: number;
    effectif?: number;
  }[];
  resultat?: {
    moyenne_annuelle?: number;
    moyenne_semestre1?: number;
    moyenne_semestre2?: number;
    total_credits_inscrits: number;
    total_credits_obtenus: number;
    total_credits_capitalises: number;
    mention?: Mention;
    decision: DecisionResultat;
    passage_niveau_superieur: boolean;
    rang?: number;
    effectif?: number;
  };
}

export interface ReleveNotes {
  type: 'releve_notes';
  date_generation: string;
  etudiant: {
    id: number;
    matricule: string;
    nom: string;
    prenom: string;
    date_naissance?: string;
    lieu_naissance?: string;
    sexe?: string;
    nationalite?: string;
  };
  parcours: {
    inscription_id: number;
    annee_academique: string;
    filiere_id: number;
    niveau_id: number;
    matieres: {
      code?: string;
      libelle?: string;
      credit: number;
      moyenne?: number;
      credit_obtenu: number;
      statut: string;
    }[];
    semestres: {
      semestre: number;
      moyenne?: number;
      credits_obtenus: number;
      mention?: Mention;
      decision: DecisionResultat;
    }[];
    resultat_annuel?: {
      moyenne?: number;
      credits_obtenus: number;
      mention?: Mention;
      decision: DecisionResultat;
      passage: boolean;
    };
  }[];
  total_credits_obtenus: number;
}

// ============ Statistiques ============

export interface StatistiquesExamen {
  moyenne?: number;
  min?: number;
  max?: number;
  nombre_presents: number;
  nombre_absents: number;
  taux_reussite?: number;
  total: number;
}

export interface StatistiquesDeliberation {
  deliberation_id: number;
  nombre_etudiants: number;
  nombre_admis: number;
  nombre_ajournes: number;
  nombre_redoublants: number;
  taux_reussite?: number;
}

export interface ClassementItem {
  rang: number;
  effectif: number;
  etudiant_id: number;
  inscription_id: number;
  moyenne_generale?: number;
  moyenne_annuelle?: number;
  moyenne_semestre1?: number;
  moyenne_semestre2?: number;
  total_credits_inscrits: number;
  total_credits_obtenus: number;
  total_credits_capitalises?: number;
  nombre_matieres?: number;
  nombre_matieres_validees?: number;
  mention?: Mention;
  decision: DecisionResultat;
  passage_niveau_superieur?: boolean;
  // Infos étudiant (à charger séparément si nécessaire)
  etudiant?: {
    matricule: string;
    nom: string;
    prenom: string;
  };
}

// ============ Helpers ============

export const STATUT_SESSION_LABELS: Record<string, string> = {
  planifiee: 'Planifiée',
  en_cours: 'En cours',
  cloturee: 'Clôturée',
  validee: 'Validée',
};

export const STATUT_SESSION_COLORS: Record<string, 'default' | 'primary' | 'warning' | 'success'> = {
  planifiee: 'default',
  en_cours: 'primary',
  cloturee: 'warning',
  validee: 'success',
};

export const TYPE_EVALUATION_LABELS: Record<TypeEvaluation, string> = {
  cc: 'Contrôle Continu',
  tp: 'Travaux Pratiques',
  examen: 'Examen',
  examen_final: 'Examen Final',
  projet: 'Projet',
  controle_continu: 'Contrôle continu',
  examen_partiel: 'Examen partiel',
};

export const STATUT_EXAMEN_LABELS: Record<StatutExamen, string> = {
  planifie: 'Planifié',
  en_cours: 'En cours',
  termine: 'Terminé',
  notes_saisies: 'Notes saisies',
  valide: 'Validé',
};

export const DECISION_LABELS: Record<DecisionResultat, string> = {
  en_cours: 'En cours',
  admis: 'Admis',
  admis_avec_dette: 'Admis avec dette',
  ajourne: 'Ajourné',
  redouble: 'Redouble',
  exclus: 'Exclus',
};

export const DECISION_COLORS: Record<DecisionResultat, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  en_cours: 'default',
  admis: 'success',
  admis_avec_dette: 'info',
  ajourne: 'warning',
  redouble: 'error',
  exclus: 'error',
};

export const MENTION_LABELS: Record<Mention, string> = {
  passable: 'Passable',
  assez_bien: 'Assez Bien',
  bien: 'Bien',
  tres_bien: 'Très Bien',
  excellent: 'Excellent',
};

export const MENTION_COLORS: Record<Mention, string> = {
  passable: '#9e9e9e',
  assez_bien: '#2196f3',
  bien: '#4caf50',
  tres_bien: '#ff9800',
  excellent: '#f44336',
};

export const STATUT_DELIBERATION_LABELS: Record<StatutDeliberation, string> = {
  en_cours: 'En cours',
  terminee: 'Terminée',
  validee: 'Validée',
  publiee: 'Publiée',
};

export const STATUT_DELIBERATION_COLORS: Record<StatutDeliberation, 'default' | 'info' | 'success' | 'primary'> = {
  en_cours: 'default',
  terminee: 'info',
  validee: 'success',
  publiee: 'primary',
};
