// Types de frais
export interface TypeFrais {
  id: number;
  code: string;
  libelle: string;
  categorie: string;
  montant_defaut: number | null;
  est_obligatoire: boolean;
  est_recurrent: boolean;
  periode_application: string | null;
  description: string | null;
  compte_comptable: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTypeFrais {
  code: string;
  libelle: string;
  categorie: string;
  montant_defaut?: number;
  est_obligatoire?: boolean;
  est_recurrent?: boolean;
  periode_application?: string;
  description?: string;
  compte_comptable?: string;
  is_active?: boolean;
}

export interface UpdateTypeFrais {
  code?: string;
  libelle?: string;
  categorie?: string;
  montant_defaut?: number;
  est_obligatoire?: boolean;
  est_recurrent?: boolean;
  periode_application?: string;
  description?: string;
  compte_comptable?: string;
  is_active?: boolean;
}

// Frais de scolarité
export interface FraisScolarite {
  id: number;
  type_frais_id: number;
  niveau_id: number | null;
  filiere_id: number | null;
  cycle_id: number | null;
  annee_academique_id: number;
  montant: number;
  devise: string;
  date_debut_validite: string;
  date_fin_validite: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FraisScolariteWithDetails extends FraisScolarite {
  type_frais_libelle?: string;
  niveau_libelle?: string;
  filiere_libelle?: string;
  cycle_libelle?: string;
  annee_academique_code?: string;
}

export interface CreateFraisScolarite {
  type_frais_id: number;
  niveau_id?: number;
  filiere_id?: number;
  cycle_id?: number;
  annee_academique_id: number;
  montant: number;
  devise?: string;
  date_debut_validite: string;
  date_fin_validite: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateFraisScolarite {
  type_frais_id?: number;
  niveau_id?: number;
  filiere_id?: number;
  cycle_id?: number;
  annee_academique_id?: number;
  montant?: number;
  devise?: string;
  date_debut_validite?: string;
  date_fin_validite?: string;
  description?: string;
  is_active?: boolean;
}

// Ligne de facture
export interface LigneFacture {
  id: number;
  facture_id: number;
  frais_scolarite_id: number | null;
  libelle: string;
  description: string | null;
  quantite: number;
  prix_unitaire: number;
  montant_ligne: number;
  tva_taux: number;
  tva_montant: number;
  montant_ttc: number;
  created_at: string;
  updated_at: string;
}

export interface CreateLigneFacture {
  libelle: string;
  description?: string;
  quantite?: number;
  prix_unitaire: number;
  tva_taux?: number;
  frais_scolarite_id?: number;
}

// Facture
export interface Facture {
  id: number;
  numero_facture: string;
  etudiant_id: number;
  annee_academique_id: number;
  date_emission: string;
  date_echeance: string;
  montant_total: number;
  montant_paye: number;
  montant_restant: number;
  devise: string;
  statut: string;
  type_facture: string;
  description: string | null;
  observations: string | null;
  emise_par: number | null;
  validee_par: number | null;
  date_validation: string | null;
  annulee_par: number | null;
  date_annulation: string | null;
  motif_annulation: string | null;
  created_at: string;
  updated_at: string;
}

export interface FactureWithDetails extends Facture {
  lignes: LigneFacture[];
  paiements: Paiement[];
  etudiant_nom?: string;
  etudiant_prenom?: string;
  etudiant_matricule?: string;
  annee_academique_code?: string;
}

export interface CreateFacture {
  etudiant_id: number;
  annee_academique_id: number;
  date_echeance: string;
  type_facture: string;
  description?: string;
  observations?: string;
  lignes: CreateLigneFacture[];
}

export interface UpdateFacture {
  date_echeance?: string;
  description?: string;
  observations?: string;
}

// Paiement
export interface Paiement {
  id: number;
  numero_paiement: string;
  numero_recu: string | null;
  facture_id: number;
  etudiant_id: number;
  date_paiement: string;
  montant: number;
  devise: string;
  mode_paiement: string;
  reference_transaction: string | null;
  statut: string;
  banque: string | null;
  numero_cheque: string | null;
  date_valeur: string | null;
  observations: string | null;
  recu_par: number | null;
  valide_par: number | null;
  date_validation: string | null;
  rejete_par: number | null;
  date_rejet: string | null;
  motif_rejet: string | null;
  fichier_preuve_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaiementWithDetails extends Paiement {
  facture_numero?: string;
  etudiant_nom?: string;
  etudiant_prenom?: string;
  etudiant_matricule?: string;
}

/** Alias portail - même schéma que Paiement (route `/paiements-factures`). */
export type PaiementFacture = Paiement;

export interface CreatePaiement {
  facture_id: number;
  etudiant_id: number;
  montant: number;
  mode_paiement: string;
  reference_transaction?: string;
  banque?: string;
  numero_cheque?: string;
  observations?: string;
}

export interface UpdatePaiement {
  montant?: number;
  mode_paiement?: string;
  reference_transaction?: string;
  banque?: string;
  numero_cheque?: string;
  observations?: string;
}

// Compte étudiant
export interface CompteEtudiant {
  id: number;
  etudiant_id: number;
  annee_academique_id: number;
  solde_actuel: number;
  total_facture: number;
  total_paye: number;
  total_restant: number;
  devise: string;
  statut_compte: string;
  date_derniere_operation: string | null;
  observations: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompteEtudiantWithDetails extends CompteEtudiant {
  etudiant_nom?: string;
  etudiant_prenom?: string;
  etudiant_matricule?: string;
  annee_academique_code?: string;
  mouvements_recents?: MouvementCompte[];
}

export interface CreateCompteEtudiant {
  etudiant_id: number;
  annee_academique_id: number;
  observations?: string;
}

export interface UpdateCompteEtudiant {
  statut_compte?: string;
  observations?: string;
}

// Mouvement de compte
export interface MouvementCompte {
  id: number;
  compte_id: number;
  type_mouvement: string;
  montant: number;
  solde_avant: number;
  solde_apres: number;
  libelle: string;
  description: string | null;
  facture_id: number | null;
  paiement_id: number | null;
  date_mouvement: string;
  effectue_par: number | null;
  created_at: string;
}

// Remise
export interface Remise {
  id: number;
  code: string;
  libelle: string;
  type_remise: string;
  valeur: number;
  type_frais_id: number | null;
  conditions: string | null;
  date_debut: string;
  date_fin: string;
  nombre_utilisations_max: number | null;
  nombre_utilisations: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRemise {
  code: string;
  libelle: string;
  type_remise: string;
  valeur: number;
  type_frais_id?: number;
  conditions?: string;
  date_debut: string;
  date_fin: string;
  nombre_utilisations_max?: number;
  is_active?: boolean;
}

export interface UpdateRemise {
  code?: string;
  libelle?: string;
  type_remise?: string;
  valeur?: number;
  type_frais_id?: number;
  conditions?: string;
  date_debut?: string;
  date_fin?: string;
  nombre_utilisations_max?: number;
  is_active?: boolean;
}

// Remise étudiant
export interface RemiseEtudiant {
  id: number;
  remise_id: number;
  etudiant_id: number;
  facture_id: number | null;
  annee_academique_id: number;
  montant_remise: number;
  date_attribution: string;
  motif: string | null;
  attribuee_par: number | null;
  created_at: string;
}

export interface CreateRemiseEtudiant {
  remise_id: number;
  etudiant_id: number;
  facture_id?: number;
  annee_academique_id: number;
  montant_remise: number;
  motif?: string;
}

// Échéancier
export interface Echeancier {
  id: number;
  etudiant_id: number;
  facture_id: number;
  numero_echeance: number;
  date_echeance: string;
  montant_echeance: number;
  montant_paye: number;
  statut: string;
  observations: string | null;
  created_at: string;
  updated_at: string;
}

export interface EcheanceItem {
  date_echeance: string;
  montant_echeance: number;
}

export interface CreateEcheancier {
  facture_id: number;
  echeances: EcheanceItem[];
}

export interface UpdateEcheancier {
  date_echeance?: string;
  montant_echeance?: number;
  observations?: string;
}

// Statistiques
export interface StatistiquesFinances {
  total_factures: number;
  montant_total: number;
  montant_paye: number;
  montant_restant: number;
  taux_recouvrement: number;
}

export interface StatistiquesPaiements {
  total_paiements: number;
  montant_total: number;
  par_mode_paiement: Record<string, { count: number; montant: number }>;
  par_mois: Record<string, { count: number; montant: number }>;
}

// Constantes
export const CATEGORIES_FRAIS = [
  { value: 'inscription', label: 'Inscription' },
  { value: 'scolarite', label: 'Scolarité' },
  { value: 'examen', label: 'Examen' },
  { value: 'bibliotheque', label: 'Bibliothèque' },
  { value: 'sport', label: 'Sport' },
  { value: 'autre', label: 'Autre' },
];

export const PERIODES_APPLICATION = [
  { value: 'annuel', label: 'Annuel' },
  { value: 'semestriel', label: 'Semestriel' },
  { value: 'mensuel', label: 'Mensuel' },
];

export const MODES_PAIEMENT = [
  { value: 'especes', label: 'Espèces' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'virement', label: 'Virement bancaire' },
  { value: 'carte_bancaire', label: 'Carte bancaire' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'autre', label: 'Autre' },
];

export const STATUTS_FACTURE = [
  { value: 'en_attente', label: 'En attente', color: 'warning' },
  { value: 'partiellement_payee', label: 'Partiellement payée', color: 'info' },
  { value: 'payee', label: 'Payée', color: 'success' },
  { value: 'annulee', label: 'Annulée', color: 'error' },
];

export const STATUTS_PAIEMENT = [
  { value: 'en_attente', label: 'En attente', color: 'warning' },
  { value: 'valide', label: 'Validé', color: 'success' },
  { value: 'rejete', label: 'Rejeté', color: 'error' },
  { value: 'annule', label: 'Annulé', color: 'default' },
];

export const STATUTS_ECHEANCE = [
  { value: 'en_attente', label: 'En attente', color: 'warning' },
  { value: 'payee', label: 'Payée', color: 'success' },
  { value: 'en_retard', label: 'En retard', color: 'error' },
];

export const STATUTS_COMPTE = [
  { value: 'actif', label: 'Actif', color: 'success' },
  { value: 'suspendu', label: 'Suspendu', color: 'warning' },
  { value: 'bloque', label: 'Bloqué', color: 'error' },
  { value: 'solde', label: 'Soldé', color: 'info' },
];

export const TYPES_FACTURE = [
  { value: 'inscription', label: 'Inscription' },
  { value: 'scolarite', label: 'Scolarité' },
  { value: 'examen', label: 'Examen' },
  { value: 'autre', label: 'Autre' },
];

export const TYPES_REMISE = [
  { value: 'pourcentage', label: 'Pourcentage' },
  { value: 'montant_fixe', label: 'Montant fixe' },
];
