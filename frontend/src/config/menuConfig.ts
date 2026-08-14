import { MenuItem } from '../components/layouts';

// Menu Administration - tous les chemins commencent par /admin
export const adminMenuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    icon: 'speedometer2',
    path: '/admin/dashboard'
  },
  {
    id: 'referentiel',
    label: 'Référentiel',
    icon: 'database',
    children: [
      { id: 'universites', label: 'Universités', icon: 'building', path: '/admin/referentiel/universites' },
      { id: 'etablissements', label: 'Établissements', icon: 'buildings', path: '/admin/referentiel/etablissements' },
      { id: 'departements', label: 'Départements', icon: 'diagram-3', path: '/admin/referentiel/departements' },
      { id: 'cycles', label: 'Cycles', icon: 'arrow-repeat', path: '/admin/referentiel/cycles' },
      { id: 'filieres', label: 'Filières', icon: 'signpost-split', path: '/admin/referentiel/filieres' },
      { id: 'niveaux', label: 'Niveaux', icon: 'layers', path: '/admin/referentiel/niveaux' },
      { id: 'modules', label: 'Modules', icon: 'grid-3x3', path: '/admin/referentiel/modules' },
      { id: 'matieres', label: 'Matières', icon: 'book', path: '/admin/referentiel/matieres' },
      { id: 'salles', label: 'Salles', icon: 'door-open', path: '/admin/referentiel/salles' }
    ]
  },
  {
    id: 'etudiants',
    label: 'Étudiants',
    icon: 'mortarboard',
    children: [
      { id: 'liste-etudiants', label: 'Liste des étudiants', icon: 'people', path: '/admin/etudiants' },
      { id: 'nouveau-etudiant', label: 'Nouvel étudiant', icon: 'person-plus-fill', path: '/admin/etudiants/nouveau' },
      { id: 'inscriptions', label: 'Inscriptions', icon: 'person-plus', path: '/admin/etudiants/inscriptions' },
      { id: 'inscription-groupe', label: 'Inscription groupe', icon: 'people-fill', path: '/admin/etudiants/inscription-groupe' },
      { id: 'reinscriptions', label: 'Réinscriptions', icon: 'arrow-repeat', path: '/admin/etudiants/reinscriptions' },
      { id: 'dossiers', label: 'Dossiers administratifs', icon: 'folder2-open', path: '/admin/etudiants/dossiers' }
    ]
  },
  {
    id: 'enseignants',
    label: 'Enseignants',
    icon: 'person-workspace',
    path: '/admin/enseignants'
  },
  {
    id: 'evaluations',
    label: 'Évaluations',
    icon: 'clipboard-check',
    children: [
      { id: 'notes', label: 'Saisie des notes', icon: 'pencil-square', path: '/admin/evaluations/notes' },
      { id: 'examens', label: 'Examens', icon: 'file-earmark-text', path: '/admin/evaluations/examens' },
      { id: 'sessions', label: 'Sessions', icon: 'calendar-event', path: '/admin/evaluations/sessions' },
      { id: 'deliberations', label: 'Délibérations', icon: 'people-fill', path: '/admin/evaluations/deliberations' },
      { id: 'resultats', label: 'Résultats', icon: 'graph-up', path: '/admin/evaluations/resultats' }
    ]
  },
  {
    id: 'emploi-temps',
    label: 'Emploi du temps',
    icon: 'calendar3',
    children: [
      { id: 'planning', label: 'Planning', icon: 'calendar-week', path: '/admin/emploi-temps/planning' },
      { id: 'salles', label: 'Salles', icon: 'door-open', path: '/admin/emploi-temps/salles' },
      { id: 'reservations', label: 'Réservations', icon: 'calendar-check', path: '/admin/emploi-temps/reservations' }
    ]
  },
  {
    id: 'presences',
    label: 'Présences',
    icon: 'person-check',
    children: [
      { id: 'appel', label: 'Appel', icon: 'clipboard-check', path: '/admin/presences/appel' },
      { id: 'statistiques', label: 'Statistiques', icon: 'graph-up', path: '/admin/presences/statistiques' }
    ]
  },
  {
    id: 'finances',
    label: 'Finances',
    icon: 'cash-stack',
    children: [
      { id: 'factures', label: 'Factures', icon: 'receipt', path: '/admin/finances/factures' },
      { id: 'paiements', label: 'Paiements', icon: 'credit-card', path: '/admin/finances/paiements' },
      { id: 'types-frais', label: 'Types de frais', icon: 'tags', path: '/admin/finances/types-frais' }
    ]
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: 'file-earmark-text',
    children: [
      { id: 'documents-liste', label: 'Documents générés', icon: 'files', path: '/admin/documents/liste' },
      { id: 'templates', label: 'Templates', icon: 'file-earmark-code', path: '/admin/documents/templates' }
    ]
  },
  {
    id: 'parametrage',
    label: 'Paramétrage',
    icon: 'gear',
    children: [
      { id: 'parametres-systeme', label: 'Paramètres généraux', icon: 'sliders', path: '/admin/parametrage/parametres' },
      { id: 'annees-scolaires', label: 'Années scolaires', icon: 'calendar-range', path: '/admin/parametrage/annees-scolaires' }
    ]
  },
  {
    id: 'utilisateurs',
    label: 'Utilisateurs',
    icon: 'people-fill',
    path: '/admin/utilisateurs'
  },
  {
    id: 'administration',
    label: 'Administration',
    icon: 'shield-lock',
    children: [
      { id: 'logs', label: 'Logs système', icon: 'journal-text', path: '/admin/administration/logs' },
      { id: 'backup', label: 'Sauvegardes', icon: 'cloud-download', path: '/admin/administration/backup' },
      { id: 'permissions', label: 'Permissions', icon: 'key', path: '/admin/administration/permissions' },
      { id: 'audit', label: 'Audit', icon: 'clipboard-data', path: '/admin/administration/audit' }
    ]
  }
];

// Menu Enseignant
export const teacherMenuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    icon: 'speedometer2',
    path: '/enseignant/dashboard'
  },
  {
    id: 'mes-cours',
    label: 'Mes cours',
    icon: 'book',
    path: '/enseignant/cours'
  },
  {
    id: 'emploi-temps',
    label: 'Mon emploi du temps',
    icon: 'calendar3',
    path: '/enseignant/emploi-temps'
  },
  {
    id: 'notes',
    label: 'Saisie des notes',
    icon: 'pencil-square',
    children: [
      { id: 'saisie-notes', label: 'Saisir les notes', icon: 'pencil', path: '/enseignant/notes/saisie' },
      { id: 'historique-notes', label: 'Historique', icon: 'clock-history', path: '/enseignant/notes/historique' }
    ]
  },
  {
    id: 'presences',
    label: 'Gestion présences',
    icon: 'person-check',
    children: [
      { id: 'appel', label: 'Faire l\'appel', icon: 'clipboard-check', path: '/enseignant/presences/appel' },
      { id: 'historique-presences', label: 'Historique', icon: 'clock-history', path: '/enseignant/presences/historique' }
    ]
  },
  {
    id: 'mes-etudiants',
    label: 'Mes étudiants',
    icon: 'mortarboard',
    path: '/enseignant/etudiants'
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: 'file-earmark-text',
    path: '/enseignant/documents'
  }
];

// Menu Étudiant
export const studentMenuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    icon: 'speedometer2',
    path: '/etudiant/dashboard'
  },
  {
    id: 'mon-profil',
    label: 'Mon profil',
    icon: 'person-circle',
    path: '/etudiant/profil'
  },
  {
    id: 'mes-notes',
    label: 'Mes notes',
    icon: 'graph-up',
    children: [
      { id: 'notes-semestre', label: 'Notes du semestre', icon: 'clipboard-data', path: '/etudiant/notes' },
      { id: 'bulletins', label: 'Mes bulletins', icon: 'file-earmark-text', path: '/etudiant/bulletins' },
      { id: 'releves', label: 'Relevés de notes', icon: 'file-text', path: '/etudiant/releves' }
    ]
  },
  {
    id: 'emploi-temps',
    label: 'Mon emploi du temps',
    icon: 'calendar3',
    path: '/etudiant/emploi-temps'
  },
  {
    id: 'mes-presences',
    label: 'Mes présences',
    icon: 'person-check',
    path: '/etudiant/presences'
  },
  {
    id: 'finances',
    label: 'Mes finances',
    icon: 'wallet2',
    children: [
      { id: 'compte', label: 'Mon compte', icon: 'cash-stack', path: '/etudiant/finances/compte' },
      { id: 'factures', label: 'Mes factures', icon: 'receipt', path: '/etudiant/finances/factures' },
      { id: 'paiements', label: 'Mes paiements', icon: 'credit-card', path: '/etudiant/finances/paiements' }
    ]
  },
  {
    id: 'documents',
    label: 'Mes documents',
    icon: 'folder2-open',
    children: [
      { id: 'attestations', label: 'Attestations', icon: 'file-earmark-check', path: '/etudiant/documents/attestations' },
      { id: 'certificats', label: 'Certificats', icon: 'award', path: '/etudiant/documents/certificats' }
    ]
  }
];

export const getMenuByRole = (role: string): MenuItem[] => {
  switch (role) {
    case 'admin':
    case 'superuser':
      return adminMenuItems;
    case 'teacher':
    case 'enseignant':
      return teacherMenuItems;
    case 'student':
    case 'etudiant':
      return studentMenuItems;
    default:
      return adminMenuItems;
  }
};
