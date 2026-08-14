// Types pour le module de paramétrage

// ========== PARAMÈTRES SYSTÈME ==========
export interface ParametreSysteme {
  id: number;
  categorie: string;
  cle: string;
  valeur: string;
  type_valeur: string;
  libelle: string;
  description?: string;
  unite?: string;
  valeur_defaut?: string;
  est_modifiable: boolean;
  est_visible: boolean;
  ordre_affichage: number;
  modifie_par?: number;
  date_modification?: string;
  created_at: string;
  updated_at: string;
}

export interface ParametreSystemeCreate {
  categorie: string;
  cle: string;
  valeur: string;
  type_valeur: string;
  libelle: string;
  description?: string;
  unite?: string;
  valeur_defaut?: string;
  est_modifiable?: boolean;
  est_visible?: boolean;
  ordre_affichage?: number;
}

export interface ParametreSystemeUpdate {
  categorie?: string;
  valeur?: string;
  type_valeur?: string;
  libelle?: string;
  description?: string;
  unite?: string;
  valeur_defaut?: string;
  est_modifiable?: boolean;
  est_visible?: boolean;
  ordre_affichage?: number;
}

// ========== CONFIGURATION ÉTABLISSEMENT ==========
export interface ConfigurationEtablissement {
  id: number;
  etablissement_id: number;
  annee_academique_id?: number;
  nom_complet: string;
  nom_court: string;
  sigle?: string;
  slogan?: string;
  logo_url?: string;
  banniere_url?: string;
  adresse_complete?: string;
  ville?: string;
  code_postal?: string;
  pays: string;
  telephone_principal?: string;
  telephone_secondaire?: string;
  email_principal?: string;
  email_scolarite?: string;
  site_web?: string;
  facebook_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
  systeme_notation: string;
  referentiel: string;
  langue_enseignement: string;
  langues_secondaires?: string;
  devise: string;
  tva_applicable: boolean;
  tva_taux_defaut?: number;
  note_minimale: number;
  note_maximale: number;
  note_passage: number;
  precision_notes: number;
  taux_presence_minimum: number;
  sanction_absence?: string;
  inscription_en_ligne_active: boolean;
  validation_manuelle_dossiers: boolean;
  pieces_obligatoires?: string;
  email_expediteur_nom?: string;
  email_expediteur_adresse?: string;
  sms_actif: boolean;
  sms_expediteur?: string;
  couleur_primaire?: string;
  couleur_secondaire?: string;
  theme: string;
  fuseau_horaire: string;
  format_date: string;
  format_heure: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConfigurationEtablissementCreate {
  etablissement_id: number;
  annee_academique_id?: number;
  nom_complet: string;
  nom_court: string;
  sigle?: string;
  slogan?: string;
  pays?: string;
  systeme_notation?: string;
  referentiel?: string;
  langue_enseignement?: string;
  devise?: string;
  note_minimale?: number;
  note_maximale?: number;
  note_passage?: number;
  precision_notes?: number;
  taux_presence_minimum?: number;
  couleur_primaire?: string;
  couleur_secondaire?: string;
  theme?: string;
  fuseau_horaire?: string;
  format_date?: string;
  format_heure?: string;
}

export interface ConfigurationEtablissementUpdate extends Partial<Omit<ConfigurationEtablissement, 'id' | 'created_at' | 'updated_at'>> {}

// ========== BARÈME DE NOTATION ==========
export interface MentionNotation {
  id: number;
  bareme_id: number;
  code: string;
  libelle: string;
  note_min: number;
  note_max: number;
  couleur?: string;
  ordre: number;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface MentionNotationCreate {
  bareme_id: number;
  code: string;
  libelle: string;
  note_min: number;
  note_max: number;
  couleur?: string;
  ordre?: number;
  description?: string;
  is_active?: boolean;
}

export interface MentionNotationUpdate {
  code?: string;
  libelle?: string;
  note_min?: number;
  note_max?: number;
  couleur?: string;
  ordre?: number;
  description?: string;
  is_active?: boolean;
}

export interface BaremeNotation {
  id: number;
  etablissement_id?: number;
  cycle_id?: number;
  code: string;
  libelle: string;
  description?: string;
  note_min: number;
  note_max: number;
  est_systeme_defaut: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  mentions?: MentionNotation[];
}

export interface BaremeNotationCreate {
  code: string;
  libelle: string;
  description?: string;
  note_min: number;
  note_max: number;
  etablissement_id?: number;
  cycle_id?: number;
  est_systeme_defaut?: boolean;
  is_active?: boolean;
}

export interface BaremeNotationUpdate extends Partial<BaremeNotationCreate> {}

// ========== TEMPLATE DOCUMENT ==========
export interface TemplateDocument {
  id: number;
  etablissement_id?: number;
  code: string;
  libelle: string;
  type_document: string;
  description?: string;
  template_html: string;
  template_css?: string;
  variables_disponibles?: string;
  format_papier: string;
  orientation: string;
  marges?: string;
  en_tete_html?: string;
  pied_page_html?: string;
  est_systeme_defaut: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemplateDocumentCreate {
  code: string;
  libelle: string;
  type_document: string;
  description?: string;
  template_html: string;
  template_css?: string;
  variables_disponibles?: string;
  format_papier?: string;
  orientation?: string;
  marges?: string;
  en_tete_html?: string;
  pied_page_html?: string;
  etablissement_id?: number;
  est_systeme_defaut?: boolean;
  is_active?: boolean;
}

export interface TemplateDocumentUpdate extends Partial<TemplateDocumentCreate> {}

// ========== RÈGLE DE CALCUL ==========
export interface RegleCalcul {
  id: number;
  etablissement_id?: number;
  cycle_id?: number;
  code: string;
  libelle: string;
  type_regle: string;
  description?: string;
  formule: string;
  conditions?: string;
  ordre_execution: number;
  est_systeme_defaut: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RegleCalculCreate {
  code: string;
  libelle: string;
  type_regle: string;
  description?: string;
  formule: string;
  conditions?: string;
  ordre_execution?: number;
  etablissement_id?: number;
  cycle_id?: number;
  est_systeme_defaut?: boolean;
  is_active?: boolean;
}

export interface RegleCalculUpdate extends Partial<RegleCalculCreate> {}

// ========== MODÈLE EMAIL ==========
export interface ModeleEmail {
  id: number;
  etablissement_id?: number;
  code: string;
  libelle: string;
  type_destinataire: string;
  objet: string;
  corps_html: string;
  corps_texte?: string;
  variables_disponibles?: string;
  pieces_jointes_auto?: string;
  est_systeme_defaut: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ModeleEmailCreate {
  code: string;
  libelle: string;
  type_destinataire: string;
  objet: string;
  corps_html: string;
  corps_texte?: string;
  variables_disponibles?: string;
  pieces_jointes_auto?: string;
  etablissement_id?: number;
  est_systeme_defaut?: boolean;
  is_active?: boolean;
}

export interface ModeleEmailUpdate extends Partial<ModeleEmailCreate> {}

// ========== MODÈLE SMS ==========
export interface ModeleSMS {
  id: number;
  etablissement_id?: number;
  code: string;
  libelle: string;
  type_destinataire: string;
  message: string;
  variables_disponibles?: string;
  est_systeme_defaut: boolean;
  is_active: boolean;
  created_at: string;
}

export interface ModeleSMSCreate {
  code: string;
  libelle: string;
  type_destinataire: string;
  message: string;
  variables_disponibles?: string;
  etablissement_id?: number;
  est_systeme_defaut?: boolean;
  is_active?: boolean;
}

export interface ModeleSMSUpdate extends Partial<ModeleSMSCreate> {}

// ========== CONFIGURATION PAYS ==========
export interface PaysConfiguration {
  id: number;
  code_pays: string;
  nom_pays: string;
  nom_pays_en?: string;
  continent: string;
  region?: string;
  systeme_educatif: string;
  organisme_regulation?: string;
  langue_officielle: string;
  langues_secondaires?: string;
  devise_officielle: string;
  symbole_devise?: string;
  format_montant?: string;
  format_telephone?: string;
  format_code_postal?: string;
  format_matricule?: string;
  systeme_notation_defaut: string;
  note_min_defaut: number;
  note_max_defaut: number;
  fuseau_horaire: string;
  format_date_defaut: string;
  debut_annee_academique: string;
  fin_annee_academique: string;
  jours_feries?: string;
  indicatif_telephonique?: string;
  drapeau_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaysConfigurationCreate {
  code_pays: string;
  nom_pays: string;
  nom_pays_en?: string;
  continent?: string;
  region?: string;
  systeme_educatif: string;
  organisme_regulation?: string;
  langue_officielle: string;
  langues_secondaires?: string;
  devise_officielle: string;
  symbole_devise?: string;
  format_montant?: string;
  format_telephone?: string;
  format_code_postal?: string;
  format_matricule?: string;
  systeme_notation_defaut?: string;
  note_min_defaut?: number;
  note_max_defaut?: number;
  fuseau_horaire: string;
  format_date_defaut?: string;
  debut_annee_academique?: string;
  fin_annee_academique?: string;
  jours_feries?: string;
  indicatif_telephonique?: string;
  drapeau_url?: string;
  is_active?: boolean;
}

export interface PaysConfigurationUpdate extends Partial<PaysConfigurationCreate> {}

// ========== CONSTANTES ==========
export const CATEGORIES_PARAMETRES = [
  { value: 'general', label: 'Général' },
  { value: 'academique', label: 'Académique' },
  { value: 'financier', label: 'Financier' },
  { value: 'inscription', label: 'Inscription' },
  { value: 'presence', label: 'Présence' },
  { value: 'communication', label: 'Communication' },
  { value: 'affichage', label: 'Affichage' },
];

export const TYPES_VALEUR = [
  { value: 'string', label: 'Texte' },
  { value: 'integer', label: 'Nombre entier' },
  { value: 'float', label: 'Nombre décimal' },
  { value: 'boolean', label: 'Oui/Non' },
  { value: 'json', label: 'JSON' },
  { value: 'date', label: 'Date' },
];

export const TYPES_DOCUMENTS = [
  { value: 'bulletin', label: 'Bulletin de notes' },
  { value: 'attestation', label: 'Attestation' },
  { value: 'certificat', label: 'Certificat' },
  { value: 'releve_notes', label: 'Relevé de notes' },
  { value: 'facture', label: 'Facture' },
  { value: 'recu', label: 'Reçu de paiement' },
  { value: 'autre', label: 'Autre' },
];

export const TYPES_REGLES = [
  { value: 'moyenne_matiere', label: 'Calcul de moyenne matière' },
  { value: 'moyenne_semestre', label: 'Calcul de moyenne semestre' },
  { value: 'moyenne_annuelle', label: 'Calcul de moyenne annuelle' },
  { value: 'validation_credits', label: 'Validation des crédits' },
  { value: 'compensation', label: 'Règles de compensation' },
  { value: 'deliberation', label: 'Règles de délibération' },
];

export const TYPES_DESTINATAIRES = [
  { value: 'etudiant', label: 'Étudiant' },
  { value: 'enseignant', label: 'Enseignant' },
  { value: 'parent', label: 'Parent/Tuteur' },
  { value: 'personnel', label: 'Personnel administratif' },
];

export const SYSTEMES_NOTATION = [
  { value: 'LMD', label: 'LMD (Licence-Master-Doctorat)' },
  { value: 'Classique', label: 'Classique' },
  { value: 'Anglo-Saxon', label: 'Anglo-Saxon' },
];

export const REFERENTIELS = [
  { value: 'CAMES', label: 'CAMES' },
  { value: 'National', label: 'National' },
  { value: 'Autre', label: 'Autre' },
];

export const THEMES = [
  { value: 'light', label: 'Clair' },
  { value: 'dark', label: 'Sombre' },
];

export const FORMATS_PAPIER = [
  { value: 'A4', label: 'A4' },
  { value: 'A5', label: 'A5' },
  { value: 'Letter', label: 'Letter' },
];

export const ORIENTATIONS = [
  { value: 'portrait', label: 'Portrait' },
  { value: 'landscape', label: 'Paysage' },
];
