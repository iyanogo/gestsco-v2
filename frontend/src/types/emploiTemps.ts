// Types pour le module Emploi du Temps

export interface Batiment {
  id: number;
  code: string;
  libelle: string;
  etablissement_id: number;
  adresse?: string;
  nombre_etages?: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBatiment {
  code: string;
  libelle: string;
  etablissement_id: number;
  adresse?: string;
  nombre_etages?: number;
  description?: string;
  is_active?: boolean;
}

export interface UpdateBatiment {
  code?: string;
  libelle?: string;
  etablissement_id?: number;
  adresse?: string;
  nombre_etages?: number;
  description?: string;
  is_active?: boolean;
}

export interface Salle {
  id: number;
  code: string;
  libelle: string;
  batiment_id: number;
  type_salle: string;
  etage?: number;
  capacite: number;
  superficie?: number;
  equipements?: string;
  description?: string;
  is_accessible_pmr: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SalleWithDisponibilite extends Salle {
  est_disponible: boolean;
  prochaine_seance: string | null;
}

export interface SalleWithBatiment extends Salle {
  batiment_libelle?: string;
  batiment_code?: string;
}

export interface CreateSalle {
  code: string;
  libelle: string;
  batiment_id: number;
  type_salle: string;
  etage?: number;
  capacite: number;
  superficie?: number;
  equipements?: string;
  description?: string;
  is_accessible_pmr?: boolean;
  is_active?: boolean;
}

export interface UpdateSalle {
  code?: string;
  libelle?: string;
  batiment_id?: number;
  type_salle?: string;
  etage?: number;
  capacite?: number;
  superficie?: number;
  equipements?: string;
  description?: string;
  is_accessible_pmr?: boolean;
  is_active?: boolean;
}

export interface CreneauHoraire {
  id: number;
  code: string;
  libelle: string;
  heure_debut: string;
  heure_fin: string;
  periode: string;
  ordre: number;
  duree_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCreneauHoraire {
  code: string;
  libelle: string;
  heure_debut: string;
  heure_fin: string;
  periode: string;
  ordre: number;
  is_active?: boolean;
}

export interface UpdateCreneauHoraire {
  code?: string;
  libelle?: string;
  heure_debut?: string;
  heure_fin?: string;
  periode?: string;
  ordre?: number;
  is_active?: boolean;
}

export interface Seance {
  id: number;
  code: string;
  matiere_id: number;
  niveau_id: number;
  filiere_id?: number;
  enseignant_id: number;
  salle_id?: number;
  creneau_id: number;
  type_seance: string;
  date_seance: string;
  jour_semaine: number;
  semestre: number;
  annee_academique_id: number;
  duree_minutes: number;
  effectif_prevu?: number;
  effectif_present?: number;
  statut: string;
  est_recurrente: boolean;
  recurrence_id?: number;
  observations?: string;
  created_at: string;
  updated_at: string;
}

export interface SeanceWithDetails extends Seance {
  matiere_libelle?: string;
  matiere_code?: string;
  enseignant_nom?: string;
  salle_libelle?: string;
  salle_code?: string;
  creneau_libelle?: string;
  niveau_libelle?: string;
  filiere_libelle?: string;
}

export interface CreateSeance {
  matiere_id: number;
  niveau_id: number;
  filiere_id?: number;
  enseignant_id: number;
  salle_id?: number;
  creneau_id: number;
  type_seance: string;
  date_seance: string;
  semestre: number;
  annee_academique_id: number;
  effectif_prevu?: number;
  observations?: string;
}

export interface CreateSeanceRecurrente {
  seance_base: CreateSeance;
  date_fin_recurrence: string;
  jours_semaine: number[];
}

export interface UpdateSeance {
  matiere_id?: number;
  niveau_id?: number;
  filiere_id?: number;
  enseignant_id?: number;
  salle_id?: number;
  creneau_id?: number;
  type_seance?: string;
  date_seance?: string;
  semestre?: number;
  effectif_prevu?: number;
  statut?: string;
  observations?: string;
}

export interface Presence {
  id: number;
  seance_id: number;
  etudiant_id: number;
  statut: string;
  heure_arrivee?: string;
  justificatif_url?: string;
  observation?: string;
  saisie_par?: number;
  date_saisie?: string;
  created_at: string;
  updated_at: string;
}

export interface PresenceWithEtudiant extends Presence {
  etudiant_nom?: string;
  etudiant_prenom?: string;
  etudiant_matricule?: string;
}

export interface CreatePresence {
  seance_id: number;
  etudiant_id: number;
  statut: string;
  heure_arrivee?: string;
  observation?: string;
}

export interface UpdatePresence {
  statut?: string;
  heure_arrivee?: string;
  observation?: string;
  justificatif_url?: string;
}

export interface PresenceItem {
  etudiant_id: number;
  statut: string;
  heure_arrivee?: string;
  observation?: string;
}

export interface PresenceBulkCreate {
  seance_id: number;
  presences: PresenceItem[];
}

export interface ReservationSalle {
  id: number;
  numero_reservation: string;
  salle_id: number;
  demandeur_id: number;
  date_reservation: string;
  heure_debut: string;
  heure_fin: string;
  motif: string;
  description?: string;
  nombre_participants?: number;
  equipements_requis?: string;
  statut: string;
  approuve_par?: number;
  date_approbation?: string;
  motif_refus?: string;
  created_at: string;
  updated_at: string;
}

export interface ReservationSalleWithDetails extends ReservationSalle {
  salle_libelle?: string;
  salle_code?: string;
  demandeur_nom?: string;
  approbateur_nom?: string;
}

export interface CreateReservationSalle {
  salle_id: number;
  date_reservation: string;
  heure_debut: string;
  heure_fin: string;
  motif: string;
  description?: string;
  nombre_participants?: number;
  equipements_requis?: string;
}

export interface UpdateReservationSalle {
  salle_id?: number;
  date_reservation?: string;
  heure_debut?: string;
  heure_fin?: string;
  motif?: string;
  description?: string;
  nombre_participants?: number;
  equipements_requis?: string;
}

export interface EmploiTemps {
  id: number;
  code: string;
  libelle: string;
  niveau_id: number;
  filiere_id?: number;
  semestre: number;
  annee_academique_id: number;
  date_debut: string;
  date_fin: string;
  statut: string;
  version: number;
  publie_le?: string;
  publie_par?: number;
  observations?: string;
  created_at: string;
  updated_at: string;
}

export interface EmploiTempsWithSeances extends EmploiTemps {
  seances: SeanceWithDetails[];
}

export interface EmploiTempsWithDetails extends EmploiTemps {
  niveau_libelle?: string;
  filiere_libelle?: string;
  annee_academique_libelle?: string;
}

export interface CreateEmploiTemps {
  code: string;
  libelle: string;
  niveau_id: number;
  filiere_id?: number;
  semestre: number;
  annee_academique_id: number;
  date_debut: string;
  date_fin: string;
  observations?: string;
}

export interface UpdateEmploiTemps {
  code?: string;
  libelle?: string;
  niveau_id?: number;
  filiere_id?: number;
  semestre?: number;
  date_debut?: string;
  date_fin?: string;
  observations?: string;
}

export interface StatistiquesPresence {
  total_seances: number;
  presences: number;
  absences: number;
  retards: number;
  absences_justifiees?: number;
  taux_presence: number;
}

export interface ConflitSeance {
  seance_id: number;
  code: string;
  matiere_id: number;
}

export interface Conflits {
  salle: ConflitSeance | null;
  enseignant: ConflitSeance | null;
}

export interface JourSemaine {
  jour: number;
  jour_libelle: string;
  seances: SeanceWithDetails[];
}

// Types de séances
export const TYPES_SEANCE = [
  { value: 'cours', label: 'Cours magistral', color: '#1976d2' },
  { value: 'td', label: 'Travaux Dirigés', color: '#388e3c' },
  { value: 'tp', label: 'Travaux Pratiques', color: '#f57c00' },
  { value: 'examen', label: 'Examen', color: '#d32f2f' },
  { value: 'rattrapage', label: 'Rattrapage', color: '#7b1fa2' },
];

// Types de salles
export const TYPES_SALLE = [
  { value: 'cours', label: 'Salle de cours' },
  { value: 'tp', label: 'Salle de TP' },
  { value: 'amphi', label: 'Amphithéâtre' },
  { value: 'labo', label: 'Laboratoire' },
  { value: 'salle_info', label: 'Salle informatique' },
  { value: 'salle_reunion', label: 'Salle de réunion' },
];

// Statuts de séance
export const STATUTS_SEANCE = [
  { value: 'planifiee', label: 'Planifiée', color: 'default' },
  { value: 'confirmee', label: 'Confirmée', color: 'primary' },
  { value: 'en_cours', label: 'En cours', color: 'info' },
  { value: 'terminee', label: 'Terminée', color: 'success' },
  { value: 'annulee', label: 'Annulée', color: 'error' },
  { value: 'reportee', label: 'Reportée', color: 'warning' },
];

// Statuts de présence
export const STATUTS_PRESENCE = [
  { value: 'present', label: 'Présent', color: 'success' },
  { value: 'absent', label: 'Absent', color: 'error' },
  { value: 'retard', label: 'Retard', color: 'warning' },
  { value: 'absent_justifie', label: 'Absence justifiée', color: 'info' },
];

// Statuts de réservation
export const STATUTS_RESERVATION = [
  { value: 'en_attente', label: 'En attente', color: 'warning' },
  { value: 'approuvee', label: 'Approuvée', color: 'success' },
  { value: 'refusee', label: 'Refusée', color: 'error' },
  { value: 'annulee', label: 'Annulée', color: 'default' },
];

// Statuts d'emploi du temps
export const STATUTS_EMPLOI_TEMPS = [
  { value: 'brouillon', label: 'Brouillon', color: 'default' },
  { value: 'valide', label: 'Validé', color: 'info' },
  { value: 'publie', label: 'Publié', color: 'success' },
  { value: 'archive', label: 'Archivé', color: 'secondary' },
];

// Périodes de créneaux
export const PERIODES_CRENEAU = [
  { value: 'matin', label: 'Matin' },
  { value: 'apres_midi', label: 'Après-midi' },
  { value: 'soir', label: 'Soir' },
];

// Jours de la semaine
export const JOURS_SEMAINE = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 7, label: 'Dimanche' },
];

// Équipements de salle
export const EQUIPEMENTS_SALLE = [
  { value: 'projecteur', label: 'Projecteur' },
  { value: 'tableau', label: 'Tableau' },
  { value: 'ordinateurs', label: 'Ordinateurs' },
  { value: 'wifi', label: 'WiFi' },
  { value: 'climatisation', label: 'Climatisation' },
  { value: 'sonorisation', label: 'Sonorisation' },
  { value: 'visioconference', label: 'Visioconférence' },
];

// Helper functions
export const getTypeSeanceColor = (type: string): string => {
  const found = TYPES_SEANCE.find(t => t.value === type);
  return found?.color || '#9e9e9e';
};

export const getTypeSeanceLabel = (type: string): string => {
  const found = TYPES_SEANCE.find(t => t.value === type);
  return found?.label || type;
};

export const getStatutSeanceColor = (statut: string): string => {
  const found = STATUTS_SEANCE.find(s => s.value === statut);
  return found?.color || 'default';
};

export const getStatutPresenceColor = (statut: string): string => {
  const found = STATUTS_PRESENCE.find(s => s.value === statut);
  return found?.color || 'default';
};

export const getStatutReservationColor = (statut: string): string => {
  const found = STATUTS_RESERVATION.find(s => s.value === statut);
  return found?.color || 'default';
};

export const getJourSemaineLabel = (jour: number): string => {
  const found = JOURS_SEMAINE.find(j => j.value === jour);
  return found?.label || '';
};
