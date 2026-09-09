import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout, TeacherLayout, StudentLayout } from '../components/layouts';
import { AdminDashboard, TeacherDashboard, StudentDashboard } from '../pages/dashboards';
import { 
  EtablissementsListPage, 
  FilieresListPage, 
  UniversitesListPage, 
  DepartementsListPage, 
  CyclesListPage, 
  NiveauxListPage, 
  ModulesListPage, 
  MatieresListPage 
} from '../pages/bootstrap/referentiel';
import { 
  EtudiantsListPage, 
  EtudiantDetailsPage,
  EditEtudiantPage,
  NouvelEtudiantPage, 
  InscriptionsPage, 
  InscriptionGroupePage, 
  ReinscriptionsPage, 
  DossiersPage,
  InscriptionsMatieresPage,
} from '../pages/bootstrap/etudiants';
import {
  FacturesListPage,
  NouvelleFacturePage,
  PaiementsListPage,
  TypesFraisPage,
  RemisesListPage,
  EcheanciersListPage,
} from '../pages/bootstrap/finances';
import { EmploiTempsPage, BatimentsListPage, SallesListPage, CreneauxListPage, ReservationsPage } from '../pages/bootstrap/emploi-temps';
import { LogsPage, BackupPage, PermissionsPage, AuditPage } from '../pages/bootstrap/administration';
import { SaisieNotesPage, ResultatsPage, ExamensPage, SessionsPage, DeliberationsPage } from '../pages/bootstrap/evaluations';
// LoginPage importé dans App.tsx directement
import { ParametresGenerauxPage, AnneesScolairesPage, BaremesPage, PaysConfigPage, ReglesCalculPage, ModelesCommunicationPage } from '../pages/bootstrap/parametrage';
import { UtilisateursListPage } from '../pages/bootstrap/utilisateurs';
import { EnseignantsListPage } from '../pages/bootstrap/enseignants';
import { PresencesPage, StatistiquesPresencesPage } from '../pages/bootstrap/presences';
import { DocumentsListPage, TemplatesListPage } from '../pages/bootstrap/documents';
import GestionAnneesPage from '../pages/admin/GestionAnneesPage';
import GestionModulesPage from '../pages/admin/GestionModulesPage';
import ConfigurationDeliberationPage from '../pages/admin/ConfigurationDeliberationPage';
import StagesPage from '../pages/stages/StagesPage';
import StageDetailPage from '../pages/stages/StageDetailPage';
import NouveauStagePage from '../pages/stages/NouveauStagePage';
import SoutenancesPage from '../pages/stages/SoutenancesPage';
import StudentResultatsPage from '../pages/portail/StudentResultatsPage';
import StudentEmploiTempsPage from '../pages/portail/StudentEmploiTempsPage';
import StudentPresencesPage from '../pages/portail/StudentPresencesPage';
import StudentProfilPage from '../pages/portail/StudentProfilPage';
import StudentBulletinsPage from '../pages/portail/StudentBulletinsPage';
import StudentRelevesPage from '../pages/portail/StudentRelevesPage';
import StudentDocumentsPage from '../pages/portail/StudentDocumentsPage';
import StudentDossierAdministratifPage from '../pages/portail/StudentDossierAdministratifPage';
import StudentFinancesComptePage from '../pages/portail/StudentFinancesComptePage';
import StudentFinancesFacturesPage from '../pages/portail/StudentFinancesFacturesPage';
import StudentFinancesPaiementsPage from '../pages/portail/StudentFinancesPaiementsPage';
import StudentStagesPage from '../pages/portail/StudentStagesPage';
import TeacherCoursPage from '../pages/portail/TeacherCoursPage';
import TeacherDocumentsPage from '../pages/portail/TeacherDocumentsPage';
import TeacherEtudiantsPage from '../pages/portail/TeacherEtudiantsPage';
import TeacherEmploiTempsPage from '../pages/portail/TeacherEmploiTempsPage';
import TeacherPresencesPage from '../pages/portail/TeacherPresencesPage';
import TeacherResultatsPage from '../pages/portail/TeacherResultatsPage';
import TeacherSaisieNotesPage from '../pages/portail/TeacherSaisieNotesPage';
import TeacherStagesPage from '../pages/portail/TeacherStagesPage';
import AccountProfilePage from '../pages/bootstrap/account/AccountProfilePage';


// Composant placeholder pour les pages non encore implémentées
const PlaceholderPage: React.FC<{ title: string; description?: string }> = ({ title, description }) => (
  <div className="p-4">
    <div className="card border-0 shadow-sm">
      <div className="card-body text-center py-5">
        <i className="bi bi-gear-wide-connected display-1 text-primary mb-3"></i>
        <h3 className="fw-bold">{title}</h3>
        <p className="text-muted mb-4">{description || 'Cette page est en cours de développement.'}</p>
        <span className="badge bg-warning text-dark">En développement</span>
      </div>
    </div>
  </div>
);

// Routes Administration
const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="profil" element={<AccountProfilePage />} />
        
        {/* Référentiel */}
        <Route path="referentiel/universites" element={<UniversitesListPage />} />
        <Route path="referentiel/etablissements" element={<EtablissementsListPage />} />
        <Route path="referentiel/departements" element={<DepartementsListPage />} />
        <Route path="referentiel/cycles" element={<CyclesListPage />} />
        <Route path="referentiel/filieres" element={<FilieresListPage />} />
        <Route path="referentiel/niveaux" element={<NiveauxListPage />} />
        <Route path="referentiel/modules" element={<ModulesListPage />} />
        <Route path="referentiel/matieres" element={<MatieresListPage />} />
        <Route path="referentiel/salles" element={<SallesListPage />} />
        
        {/* Étudiants */}
        <Route path="etudiants" element={<EtudiantsListPage />} />
        <Route path="etudiants/nouveau" element={<NouvelEtudiantPage />} />
        <Route path="etudiants/:id/edit" element={<EditEtudiantPage />} />
        <Route path="etudiants/:id" element={<EtudiantDetailsPage />} />
        <Route path="etudiants/inscriptions" element={<InscriptionsPage />} />
        <Route path="etudiants/inscription-groupe" element={<InscriptionGroupePage />} />
        <Route path="etudiants/reinscriptions" element={<ReinscriptionsPage />} />
        <Route path="etudiants/inscriptions-matieres" element={<InscriptionsMatieresPage />} />
        <Route path="etudiants/dossiers" element={<DossiersPage />} />
        
        {/* Enseignants */}
        <Route path="enseignants" element={<EnseignantsListPage />} />
        
        {/* Évaluations */}
        <Route path="evaluations/notes" element={<SaisieNotesPage />} />
        <Route path="evaluations/examens" element={<ExamensPage />} />
        <Route path="evaluations/sessions" element={<SessionsPage />} />
        <Route path="evaluations/deliberations" element={<DeliberationsPage />} />
        <Route path="evaluations/resultats" element={<ResultatsPage />} />
        
        {/* Emploi du temps */}
        <Route path="emploi-temps/planning" element={<EmploiTempsPage />} />
        <Route path="emploi-temps/batiments" element={<BatimentsListPage />} />
        <Route path="emploi-temps/salles" element={<SallesListPage />} />
        <Route path="emploi-temps/creneaux" element={<CreneauxListPage />} />
        <Route path="emploi-temps/reservations" element={<ReservationsPage />} />
        
        {/* Présences */}
        <Route path="presences/appel" element={<PresencesPage />} />
        <Route path="presences/statistiques" element={<StatistiquesPresencesPage />} />
        
        {/* Finances */}
        <Route path="finances/factures" element={<FacturesListPage />} />
        <Route path="finances/factures/nouveau" element={<NouvelleFacturePage />} />
        <Route path="finances/paiements" element={<PaiementsListPage />} />
        <Route path="finances/types-frais" element={<TypesFraisPage />} />
        <Route path="finances/remises" element={<RemisesListPage />} />
        <Route path="finances/echeanciers" element={<EcheanciersListPage />} />
        
        {/* Documents */}
        <Route path="documents/liste" element={<DocumentsListPage />} />
        <Route path="documents/templates" element={<TemplatesListPage />} />
        
        {/* Paramétrage */}
        <Route path="parametrage/parametres" element={<ParametresGenerauxPage />} />
        <Route path="parametrage/annees-scolaires" element={<AnneesScolairesPage />} />
        <Route path="parametrage/baremes" element={<BaremesPage />} />
        <Route path="parametrage/pays" element={<PaysConfigPage />} />
        <Route path="parametrage/regles-calcul" element={<ReglesCalculPage />} />
        <Route path="parametrage/modeles-communication" element={<ModelesCommunicationPage />} />
        
        {/* Utilisateurs */}
        <Route path="utilisateurs" element={<UtilisateursListPage />} />
        
        {/* Administration (SuperAdmin) */}
        <Route path="administration/logs" element={<LogsPage />} />
        <Route path="administration/backup" element={<BackupPage />} />
        <Route path="administration/permissions" element={<PermissionsPage />} />
        <Route path="administration/audit" element={<AuditPage />} />
        
        {/* Gestion des années académiques LMD */}
        <Route path="gestion-annees" element={<GestionAnneesPage />} />
        <Route path="gestion-modules" element={<GestionModulesPage />} />
        <Route path="configuration-deliberation" element={<ConfigurationDeliberationPage />} />
        
        {/* Stages et Soutenances */}
        <Route path="stages" element={<StagesPage />} />
        <Route path="stages/nouveau" element={<NouveauStagePage />} />
        <Route path="stages/:id" element={<StageDetailPage />} />
        <Route path="soutenances" element={<SoutenancesPage />} />
        
        {/* Route par défaut */}
        <Route path="*" element={<PlaceholderPage title="Page non trouvée" description="Cette page n'existe pas ou n'est pas encore disponible." />} />
      </Route>
    </Routes>
  );
};

// Routes Enseignant
const TeacherRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<TeacherLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<TeacherDashboard />} />
        <Route path="profil" element={<AccountProfilePage />} />
        <Route path="cours/*" element={<TeacherCoursPage />} />
        <Route path="emploi-temps" element={<TeacherEmploiTempsPage />} />
        <Route path="stages" element={<TeacherStagesPage />} />
        <Route path="notes/historique" element={<TeacherResultatsPage />} />
        <Route path="notes/saisie" element={<TeacherSaisieNotesPage />} />
        <Route path="notes/*" element={<TeacherSaisieNotesPage />} />
        <Route path="presences/appel" element={<TeacherPresencesPage />} />
        <Route path="presences/historique" element={<TeacherPresencesPage />} />
        <Route path="presences/*" element={<TeacherPresencesPage />} />
        <Route path="resultats" element={<TeacherResultatsPage />} />
        <Route path="etudiants" element={<TeacherEtudiantsPage />} />
        <Route path="documents" element={<TeacherDocumentsPage />} />
      </Route>
    </Routes>
  );
};

// Routes Étudiant
const StudentRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<StudentLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="profil" element={<StudentProfilPage />} />
        <Route path="notes" element={<StudentResultatsPage />} />
        <Route path="bulletins" element={<StudentBulletinsPage />} />
        <Route path="releves" element={<StudentRelevesPage />} />
        <Route path="emploi-temps" element={<StudentEmploiTempsPage />} />
        <Route path="presences" element={<StudentPresencesPage />} />
        <Route path="stages" element={<StudentStagesPage />} />
        <Route path="finances/compte" element={<StudentFinancesComptePage />} />
        <Route path="finances/factures" element={<StudentFinancesFacturesPage />} />
        <Route path="finances/paiements" element={<StudentFinancesPaiementsPage />} />
        <Route path="finances/*" element={<StudentFinancesComptePage />} />
        <Route path="documents/dossier" element={<StudentDossierAdministratifPage />} />
        <Route path="documents" element={<StudentDocumentsPage />} />
      </Route>
    </Routes>
  );
};

// Routes principales Bootstrap - utilisé depuis App.tsx avec /admin/*, /enseignant/*, /etudiant/*
const BootstrapRoutes: React.FC = () => {
  // Déterminer le type de route basé sur l'URL actuelle
  const path = window.location.pathname;
  
  if (path.startsWith('/admin')) {
    return <AdminRoutes />;
  } else if (path.startsWith('/enseignant')) {
    return <TeacherRoutes />;
  } else if (path.startsWith('/etudiant')) {
    return <StudentRoutes />;
  }
  
  // Par défaut, afficher les routes admin
  return <AdminRoutes />;
};

export default BootstrapRoutes;
export { AdminRoutes, TeacherRoutes, StudentRoutes };
