import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoginPage from '@/pages/bootstrap/auth/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import ProfileRedirect from '@/components/routing/ProfileRedirect';
import AnneesScolairesPage from '@/pages/AnneesScolairesPage';
import UniversitesPage from '@/pages/UniversitesPage';
import EtablissementsPage from '@/pages/EtablissementsPage';
import DepartementsPage from '@/pages/DepartementsPage';
import CyclesPage from '@/pages/CyclesPage';
import FilieresPage from '@/pages/FilieresPage';
import NiveauxPage from '@/pages/NiveauxPage';
import ModulesPage from '@/pages/ModulesPage';
import MatieresPage from '@/pages/MatieresPage';
import EtudiantsPage from '@/pages/EtudiantsPage';
import EtudiantDetailsPage from '@/pages/EtudiantDetailsPage';
import NouvelEtudiantPage from '@/pages/NouvelEtudiantPage';
import DocumentsAttentePage from '@/pages/DocumentsAttentePage';
import InscriptionsPage from '@/pages/InscriptionsPage';
import CampagnesPage from '@/pages/CampagnesPage';
import DossiersAdminPage from '@/pages/DossiersAdminPage';
import PaiementsAdminPage from '@/pages/PaiementsAdminPage';
import InscriptionPubliquePage from '@/pages/public/InscriptionPubliquePage';
import SuiviDossierPage from '@/pages/public/SuiviDossierPage';
import InscriptionGroupePage from '@/pages/InscriptionGroupePage';
import SessionsPage from '@/pages/SessionsPage';
import ExamensPage from '@/pages/ExamensPage';
import SaisieNotesPage from '@/pages/SaisieNotesPage';
import ResultatsPage from '@/pages/ResultatsPage';
import DeliberationsPage from '@/pages/DeliberationsPage';
import MesBulletinsPage from '@/pages/MesBulletinsPage';
import SallesPage from '@/pages/SallesPage';
import EmploiTempsPage from '@/pages/EmploiTempsPage';
import PresencesPage from '@/pages/PresencesPage';
import ReservationsPage from '@/pages/ReservationsPage';
import MonEmploiTempsPage from '@/pages/MonEmploiTempsPage';
import PlanningEnseignantPage from '@/pages/PlanningEnseignantPage';
import TypesFraisPage from '@/pages/TypesFraisPage';
import FacturesPage from '@/pages/FacturesPage';
import PaiementsPage from '@/pages/PaiementsPage';
import DashboardFinancesPage from '@/pages/DashboardFinancesPage';
import ParametresPage from '@/pages/ParametresPage';
import ConfigurationEtablissementPage from '@/pages/ConfigurationEtablissementPage';
import BaremesPage from '@/pages/BaremesPage';
import TemplatesPage from '@/pages/TemplatesPage';
import PaysConfigPage from '@/pages/PaysConfigPage';
import BootstrapDemo from '@/pages/BootstrapDemo';
import BootstrapRoutes from '@/routes/BootstrapRoutes';

function App() {
  const { loadUser, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    loadUser();
  }, []);

  if (isLoading && !isAuthenticated) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Routes>
      {/* Page démo Bootstrap */}
      <Route path="/bootstrap" element={<BootstrapDemo />} />
      
      {/* Routes Bootstrap (authentification requise) */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute portal="admin">
            <BootstrapRoutes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/enseignant/*"
        element={
          <ProtectedRoute portal="teacher">
            <BootstrapRoutes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/etudiant/*"
        element={
          <ProtectedRoute portal="student">
            <BootstrapRoutes />
          </ProtectedRoute>
        }
      />
      
      {/* Routes publiques (sans authentification) */}
      <Route path="/inscription" element={<InscriptionPubliquePage />} />
      <Route path="/suivi-dossier" element={<SuiviDossierPage />} />
      
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/annees-scolaires" element={<AnneesScolairesPage />} />
        <Route path="/universites" element={<UniversitesPage />} />
        <Route path="/etablissements" element={<EtablissementsPage />} />
        <Route path="/departements" element={<DepartementsPage />} />
        <Route path="/cycles" element={<CyclesPage />} />
        <Route path="/filieres" element={<FilieresPage />} />
        <Route path="/niveaux" element={<NiveauxPage />} />
        <Route path="/modules" element={<ModulesPage />} />
        <Route path="/matieres" element={<MatieresPage />} />
        <Route path="/etudiants" element={<EtudiantsPage />} />
        <Route path="/etudiants/nouveau" element={<NouvelEtudiantPage />} />
        <Route path="/etudiants/documents" element={<DocumentsAttentePage />} />
        <Route path="/etudiants/inscriptions" element={<InscriptionsPage />} />
        <Route path="/etudiants/:id" element={<EtudiantDetailsPage />} />
        {/* Routes inscription admin */}
        <Route path="/campagnes" element={<CampagnesPage />} />
        <Route path="/dossiers-admin" element={<DossiersAdminPage />} />
        <Route path="/paiements-admin" element={<PaiementsAdminPage />} />
        <Route path="/inscription-groupe" element={<InscriptionGroupePage />} />
        {/* Routes évaluations */}
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/examens" element={<ExamensPage />} />
        <Route path="/saisie-notes" element={<SaisieNotesPage />} />
        <Route path="/resultats" element={<ResultatsPage />} />
        <Route path="/deliberations" element={<DeliberationsPage />} />
        <Route path="/mes-bulletins" element={<MesBulletinsPage />} />
        {/* Routes emploi du temps */}
        <Route path="/salles" element={<SallesPage />} />
        <Route path="/emploi-temps" element={<EmploiTempsPage />} />
        <Route path="/presences" element={<PresencesPage />} />
        <Route path="/reservations" element={<ReservationsPage />} />
        <Route path="/mon-emploi-temps" element={<MonEmploiTempsPage />} />
        <Route path="/planning-enseignant" element={<PlanningEnseignantPage enseignantId={1} />} />
        {/* Routes finances */}
        <Route path="/finances/dashboard" element={<DashboardFinancesPage />} />
        <Route path="/finances/types-frais" element={<TypesFraisPage />} />
        <Route path="/finances/factures" element={<FacturesPage />} />
        <Route path="/finances/paiements" element={<PaiementsPage />} />
        {/* Routes paramétrage */}
        <Route path="/parametrage/parametres" element={<ParametresPage />} />
        <Route path="/parametrage/configuration" element={<ConfigurationEtablissementPage />} />
        <Route path="/parametrage/baremes" element={<BaremesPage />} />
        <Route path="/parametrage/templates" element={<TemplatesPage />} />
        <Route path="/parametrage/pays" element={<PaysConfigPage />} />
      </Route>
      <Route path="/profile" element={<ProfileRedirect />} />
      <Route path="/settings" element={<Navigate to="/admin/parametrage/parametres" replace />} />
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
}

export default App;
