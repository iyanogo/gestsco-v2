import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  Collapse,
  FormControl,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import { getAnneesScolaires } from '@/services';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  People as PeopleIcon,
  Logout as LogoutIcon,
  School as SchoolIcon,
  AccountBalance as AccountBalanceIcon,
  Business as BusinessIcon,
  Domain as DomainIcon,
  Loop as LoopIcon,
  AccountTree as AccountTreeIcon,
  Layers as LayersIcon,
  ViewModule as ViewModuleIcon,
  MenuBook as MenuBookIcon,
  ExpandLess,
  ExpandMore,
  CalendarMonth as CalendarMonthIcon,
  Badge as BadgeIcon,
  PersonAdd as PersonAddIcon,
  Description as DescriptionIcon,
  HowToReg as HowToRegIcon,
  Campaign as CampaignIcon,
  Folder as FolderIcon,
  Payment as PaymentIcon,
  Assessment as AssessmentIcon,
  EventNote as EventNoteIcon,
  NoteAdd as NoteAddIcon,
  Grading as GradingIcon,
  Gavel as GavelIcon,
  Receipt as ReceiptIcon,
  Schedule as ScheduleIcon,
  MeetingRoom as MeetingRoomIcon,
  EventAvailable as EventAvailableIcon,
  FactCheck as FactCheckIcon,
  BookOnline as BookOnlineIcon,
  Today as TodayIcon,
  Settings as SettingsIcon,
  Public as PublicIcon,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { useAnneeStore } from '@/store/anneeStore';

const drawerWidth = 240;

interface NavItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  adminOnly?: boolean;
}

interface SubNavItem {
  text: string;
  icon: React.ReactNode;
  path: string;
}

const navItems: NavItem[] = [
  { text: 'Tableau de bord', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Mon profil', icon: <PersonIcon />, path: '/profile' },
  { text: 'Utilisateurs', icon: <PeopleIcon />, path: '/users', adminOnly: true },
];

const referentielItems: SubNavItem[] = [
  { text: 'Années Scolaires', icon: <CalendarMonthIcon />, path: '/annees-scolaires' },
  { text: 'Universités', icon: <AccountBalanceIcon />, path: '/universites' },
  { text: 'Établissements', icon: <BusinessIcon />, path: '/etablissements' },
  { text: 'Départements', icon: <DomainIcon />, path: '/departements' },
  { text: 'Cycles', icon: <LoopIcon />, path: '/cycles' },
  { text: 'Filières', icon: <AccountTreeIcon />, path: '/filieres' },
  { text: 'Niveaux', icon: <LayersIcon />, path: '/niveaux' },
  { text: 'Modules', icon: <ViewModuleIcon />, path: '/modules' },
  { text: 'Matières', icon: <MenuBookIcon />, path: '/matieres' },
];

const etudiantsItems: SubNavItem[] = [
  { text: 'Liste des étudiants', icon: <BadgeIcon />, path: '/etudiants' },
  { text: 'Nouvel étudiant', icon: <PersonAddIcon />, path: '/etudiants/nouveau' },
  { text: 'Documents en attente', icon: <DescriptionIcon />, path: '/etudiants/documents' },
  { text: 'Inscriptions', icon: <HowToRegIcon />, path: '/etudiants/inscriptions' },
];

const inscriptionsItems: SubNavItem[] = [
  { text: 'Campagnes', icon: <CampaignIcon />, path: '/campagnes' },
  { text: 'Dossiers de candidature', icon: <FolderIcon />, path: '/dossiers-admin' },
  { text: 'Paiements en attente', icon: <PaymentIcon />, path: '/paiements-admin' },
  { text: 'Inscription par groupe', icon: <HowToRegIcon />, path: '/inscription-groupe' },
];

const evaluationsItems: SubNavItem[] = [
  { text: 'Sessions d\'examen', icon: <EventNoteIcon />, path: '/sessions' },
  { text: 'Examens', icon: <AssessmentIcon />, path: '/examens' },
  { text: 'Saisie des notes', icon: <NoteAddIcon />, path: '/saisie-notes' },
  { text: 'Résultats', icon: <GradingIcon />, path: '/resultats' },
  { text: 'Délibérations', icon: <GavelIcon />, path: '/deliberations' },
];

const etudiantMenuItems: SubNavItem[] = [
  { text: 'Mes Bulletins', icon: <ReceiptIcon />, path: '/mes-bulletins' },
];

const emploiTempsItems: SubNavItem[] = [
  { text: 'Salles', icon: <MeetingRoomIcon />, path: '/salles' },
  { text: 'Emploi du temps', icon: <ScheduleIcon />, path: '/emploi-temps' },
  { text: 'Présences', icon: <FactCheckIcon />, path: '/presences' },
  { text: 'Réservations', icon: <BookOnlineIcon />, path: '/reservations' },
];

const consultationItems: SubNavItem[] = [
  { text: 'Mon Emploi du Temps', icon: <TodayIcon />, path: '/mon-emploi-temps' },
  { text: 'Mon Planning', icon: <EventAvailableIcon />, path: '/planning-enseignant' },
];

const financesItems: SubNavItem[] = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/finances/dashboard' },
  { text: 'Factures', icon: <ReceiptIcon />, path: '/finances/factures' },
  { text: 'Paiements', icon: <PaymentIcon />, path: '/finances/paiements' },
  { text: 'Types de frais', icon: <MenuBookIcon />, path: '/finances/types-frais' },
];

const parametrageItems: SubNavItem[] = [
  { text: 'Paramètres système', icon: <SettingsIcon />, path: '/parametrage/parametres' },
  { text: 'Configuration établissement', icon: <BusinessIcon />, path: '/parametrage/configuration' },
  { text: 'Barèmes de notation', icon: <GradingIcon />, path: '/parametrage/baremes' },
  { text: 'Templates documents', icon: <DescriptionIcon />, path: '/parametrage/templates' },
  { text: 'Configurations pays', icon: <PublicIcon />, path: '/parametrage/pays' },
];

export const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { selectedAnnee, availableAnnees, setSelectedAnnee, setAvailableAnnees, initFromActiveAnnee } = useAnneeStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [referentielOpen, setReferentielOpen] = useState(true);
  const [etudiantsOpen, setEtudiantsOpen] = useState(true);
  const [inscriptionsOpen, setInscriptionsOpen] = useState(true);
  const [evaluationsOpen, setEvaluationsOpen] = useState(true);
  const [emploiTempsOpen, setEmploiTempsOpen] = useState(true);
  const [financesOpen, setFinancesOpen] = useState(true);
  const [parametrageOpen, setParametrageOpen] = useState(false);

  useEffect(() => {
    const loadAnnees = async () => {
      try {
        const annees = await getAnneesScolaires();
        setAvailableAnnees(annees);
        const activeAnnee = annees.find(a => a.statut);
        if (activeAnnee && !selectedAnnee) {
          initFromActiveAnnee(activeAnnee);
        }
      } catch (error) {
        console.error('Erreur chargement années scolaires:', error);
      }
    };
    loadAnnees();
  }, [setAvailableAnnees, initFromActiveAnnee]);

  const handleAnneeChange = (event: SelectChangeEvent) => {
    const anneeCode = event.target.value;
    const annee = availableAnnees.find(a => a.code === anneeCode);
    setSelectedAnnee(anneeCode, annee?.id);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleReferentielToggle = () => {
    setReferentielOpen(!referentielOpen);
  };

  const handleEtudiantsToggle = () => {
    setEtudiantsOpen(!etudiantsOpen);
  };

  const handleInscriptionsToggle = () => {
    setInscriptionsOpen(!inscriptionsOpen);
  };

  const handleEvaluationsToggle = () => {
    setEvaluationsOpen(!evaluationsOpen);
  };

  const handleEmploiTempsToggle = () => {
    setEmploiTempsOpen(!emploiTempsOpen);
  };

  const handleFinancesToggle = () => {
    setFinancesOpen(!financesOpen);
  };

  const handleParametrageToggle = () => {
    setParametrageOpen(!parametrageOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || user?.is_superuser
  );

  const getPageTitle = () => {
    const refItem = referentielItems.find((item) => location.pathname === item.path);
    if (refItem) return refItem.text;
    const etudItem = etudiantsItems.find((item) => location.pathname === item.path);
    if (etudItem) return etudItem.text;
    const inscItem = inscriptionsItems.find((item) => location.pathname === item.path);
    if (inscItem) return inscItem.text;
    const evalItem = evaluationsItems.find((item) => location.pathname === item.path);
    if (evalItem) return evalItem.text;
    const edtItem = emploiTempsItems.find((item) => location.pathname === item.path);
    if (edtItem) return edtItem.text;
    const consultItem = consultationItems.find((item) => location.pathname === item.path);
    if (consultItem) return consultItem.text;
    const etudMenuitem = etudiantMenuItems.find((item) => location.pathname === item.path);
    if (etudMenuitem) return etudMenuitem.text;
    const finItem = financesItems.find((item) => location.pathname === item.path);
    if (finItem) return finItem.text;
    const paramItem = parametrageItems.find((item) => location.pathname === item.path);
    if (paramItem) return paramItem.text;
    const navItem = filteredNavItems.find((item) => location.pathname === item.path);
    if (navItem) return navItem.text;
    if (location.pathname.startsWith('/etudiants/')) return 'Détails étudiant';
    if (location.pathname.startsWith('/finances/')) return 'Finances';
    if (location.pathname.startsWith('/parametrage/')) return 'Paramétrage';
    return 'GestSco';
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
          GestSco
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton
            selected={location.pathname === '/dashboard'}
            onClick={() => handleNavigation('/dashboard')}
          >
            <ListItemIcon><DashboardIcon /></ListItemIcon>
            <ListItemText primary="Tableau de bord" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton onClick={handleReferentielToggle}>
            <ListItemIcon><SchoolIcon /></ListItemIcon>
            <ListItemText primary="Référentiel" />
            {referentielOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={referentielOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {referentielItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  sx={{ pl: 4 }}
                  selected={location.pathname === item.path}
                  onClick={() => handleNavigation(item.path)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Collapse>

        <ListItem disablePadding>
          <ListItemButton onClick={handleEtudiantsToggle}>
            <ListItemIcon><PeopleIcon /></ListItemIcon>
            <ListItemText primary="Étudiants" />
            {etudiantsOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={etudiantsOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {etudiantsItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  sx={{ pl: 4 }}
                  selected={location.pathname === item.path}
                  onClick={() => handleNavigation(item.path)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Collapse>

        <ListItem disablePadding>
          <ListItemButton onClick={handleInscriptionsToggle}>
            <ListItemIcon><CampaignIcon /></ListItemIcon>
            <ListItemText primary="Inscriptions" />
            {inscriptionsOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={inscriptionsOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {inscriptionsItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  sx={{ pl: 4 }}
                  selected={location.pathname === item.path}
                  onClick={() => handleNavigation(item.path)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Collapse>

        <ListItem disablePadding>
          <ListItemButton onClick={handleEvaluationsToggle}>
            <ListItemIcon><AssessmentIcon /></ListItemIcon>
            <ListItemText primary="Évaluations" />
            {evaluationsOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={evaluationsOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {evaluationsItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  sx={{ pl: 4 }}
                  selected={location.pathname === item.path}
                  onClick={() => handleNavigation(item.path)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Collapse>

        <ListItem disablePadding>
          <ListItemButton onClick={handleEmploiTempsToggle}>
            <ListItemIcon><ScheduleIcon /></ListItemIcon>
            <ListItemText primary="Emploi du Temps" />
            {emploiTempsOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={emploiTempsOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {emploiTempsItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  sx={{ pl: 4 }}
                  selected={location.pathname === item.path}
                  onClick={() => handleNavigation(item.path)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Collapse>

        {/* Menu Finances */}
        <ListItem disablePadding>
          <ListItemButton onClick={handleFinancesToggle}>
            <ListItemIcon><PaymentIcon /></ListItemIcon>
            <ListItemText primary="Finances" />
            {financesOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={financesOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {financesItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  sx={{ pl: 4 }}
                  selected={location.pathname === item.path}
                  onClick={() => handleNavigation(item.path)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Collapse>

        {/* Menu Paramétrage - Admin only */}
        {user?.is_superuser && (
          <>
            <ListItem disablePadding>
              <ListItemButton onClick={handleParametrageToggle}>
                <ListItemIcon><SettingsIcon /></ListItemIcon>
                <ListItemText primary="Paramétrage" />
                {parametrageOpen ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>
            <Collapse in={parametrageOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {parametrageItems.map((item) => (
                  <ListItem key={item.text} disablePadding>
                    <ListItemButton
                      sx={{ pl: 4 }}
                      selected={location.pathname === item.path}
                      onClick={() => handleNavigation(item.path)}
                    >
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.text} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </>
        )}

        {/* Menu consultation */}
        <ListItem disablePadding>
          <ListItemButton
            selected={location.pathname === '/mon-emploi-temps'}
            onClick={() => handleNavigation('/mon-emploi-temps')}
          >
            <ListItemIcon><TodayIcon /></ListItemIcon>
            <ListItemText primary="Mon Emploi du Temps" />
          </ListItemButton>
        </ListItem>

        {/* Menu étudiant - Mes Bulletins */}
        <ListItem disablePadding>
          <ListItemButton
            selected={location.pathname === '/mes-bulletins'}
            onClick={() => handleNavigation('/mes-bulletins')}
          >
            <ListItemIcon><ReceiptIcon /></ListItemIcon>
            <ListItemText primary="Mes Bulletins" />
          </ListItemButton>
        </ListItem>

        <Divider sx={{ my: 1 }} />

        <ListItem disablePadding>
          <ListItemButton
            selected={location.pathname === '/profile'}
            onClick={() => handleNavigation('/profile')}
          >
            <ListItemIcon><PersonIcon /></ListItemIcon>
            <ListItemText primary="Mon profil" />
          </ListItemButton>
        </ListItem>

        {user?.is_superuser && (
          <ListItem disablePadding>
            <ListItemButton
              selected={location.pathname === '/users'}
              onClick={() => handleNavigation('/users')}
            >
              <ListItemIcon><PeopleIcon /></ListItemIcon>
              <ListItemText primary="Utilisateurs" />
            </ListItemButton>
          </ListItem>
        )}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {getPageTitle()}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarMonthIcon sx={{ fontSize: 20 }} />
              <FormControl size="small" variant="standard" sx={{ minWidth: 100 }}>
                <Select
                  value={selectedAnnee}
                  onChange={handleAnneeChange}
                  sx={{ 
                    color: 'white',
                    '&:before': { borderColor: 'rgba(255,255,255,0.5)' },
                    '&:after': { borderColor: 'white' },
                    '& .MuiSelect-icon': { color: 'white' },
                  }}
                >
                  {availableAnnees.map((annee) => (
                    <MenuItem key={annee.id} value={annee.code || ''}>
                      {annee.code || annee.libelle}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {user?.full_name || user?.email}
            </Typography>
            <IconButton onClick={handleMenuOpen} color="inherit">
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                Mon profil
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Déconnexion
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: 'background.default',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
