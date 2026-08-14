/**
 * Export centralisé de tous les services
 */

// Auth
export * from './authService';

// Entités de référence
export * from './universiteService';
export * from './etablissementService';
export * from './departementService';
export * from './cycleService';
export * from './filiereService';
export * from './niveauService';
export * from './moduleService';
export * from './matiereService';
export * from './anneeScolaireService';

// Module Étudiants
export * from './etudiantService';
export * from './documentEtudiantService';
export * from './inscriptionService';

// Module Inscription en ligne
export * from './anneeAcademiqueService';
export * from './campagneInscriptionService';
export * from './dossierCandidatureService';
export * from './paiementService';
export * from './inscriptionPubliqueService';

// Module Évaluations
export { default as sessionExamenService } from './sessionExamenService';
export { default as examenService } from './examenService';
export { default as noteService } from './noteService';
export { default as resultatService } from './resultatService';
export { default as deliberationService } from './deliberationService';
export { default as bulletinService } from './bulletinService';

// API instance
export { default as api } from './api';
