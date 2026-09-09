import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  Drawer,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Repeat as RepeatIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  FileDownload as FileDownloadIcon,
  CheckCircle as CheckCircleIcon,
  Publish as PublishIcon,
  Archive as ArchiveIcon,
} from '@mui/icons-material';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';
import EmploiTempsGrid from './EmploiTempsGrid';
import SeanceForm from './SeanceForm';
import SeanceDetails from './SeanceDetails';
import { usePermissions } from '../../hooks/usePermissions';
import {
  SeanceWithDetails,
  CreateSeance,
  UpdateSeance,
  CreateSeanceRecurrente,
  JourSemaine,
  EmploiTemps,
  getStatutEmploiTempsLabel,
  getStatutEmploiTempsColor,
} from '../../types/emploiTemps';
import { seanceService } from '../../services/seanceService';
import { emploiTempsService } from '../../services/emploiTempsService';
import { getNiveaux } from '../../services/niveauService';
import { getFilieres } from '../../services/filiereService';
import { anneeAcademiqueService } from '../../services/anneeAcademiqueService';
import type { Niveau, Filiere } from '../../types/reference';
import type { AnneeAcademique } from '../../types/anneeAcademique';

interface EmploiTempsPlanningProps {
  showTitle?: boolean;
}

const extractErrorMessage = (error: unknown): string => {
  const err = error as { response?: { data?: { detail?: unknown } } };
  const detail = err.response?.data?.detail;
  if (Array.isArray(detail)) {
    return detail.map(String).join(' ; ');
  }
  if (typeof detail === 'string') {
    return detail;
  }
  return 'Erreur lors de l\'enregistrement';
};

const EmploiTempsPlanning: React.FC<EmploiTempsPlanningProps> = ({ showTitle = true }) => {
  const { canPerform, moduleActions } = usePermissions();
  const canCreateSeance = canPerform('edt', 'create');
  const canExportEdt = canPerform('edt', 'export');
  const { canValidate } = moduleActions('edt');
  const [seances, setSeances] = useState<SeanceWithDetails[]>([]);
  const [currentEdt, setCurrentEdt] = useState<EmploiTemps | null>(null);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [selectedSeance, setSelectedSeance] = useState<SeanceWithDetails | null>(null);
  const [isRecurrent, setIsRecurrent] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [exporting, setExporting] = useState(false);

  const [filters, setFilters] = useState({
    niveau_id: '',
    filiere_id: '',
    semestre: '1',
    annee_academique_id: '',
  });

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [anneesAcademiques, setAnneesAcademiques] = useState<AnneeAcademique[]>([]);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [niv, fil, annees, activeAnnee] = await Promise.all([
          getNiveaux(),
          getFilieres(),
          anneeAcademiqueService.getAnnees(),
          anneeAcademiqueService.getActiveAnnee(),
        ]);
        setNiveaux(niv);
        setFilieres(fil);
        setAnneesAcademiques(annees);
        if (activeAnnee) {
          setFilters((prev) => ({
            ...prev,
            annee_academique_id: String(activeAnnee.id),
          }));
        } else if (annees.length > 0) {
          setFilters((prev) => ({
            ...prev,
            annee_academique_id: String(annees[0].id),
          }));
        }
      } catch (error) {
        console.error('Erreur lors du chargement des filtres:', error);
      }
    };
    loadReferenceData();
  }, []);

  const loadSeances = useCallback(async () => {
    if (!filters.niveau_id) {
      setSeances([]);
      return;
    }
    setLoading(true);
    try {
      const dateDebutStr = format(currentWeekStart, 'yyyy-MM-dd');
      const joursData = await seanceService.getSeancesSemaine(
        dateDebutStr,
        Number(filters.niveau_id),
        filters.filiere_id ? Number(filters.filiere_id) : undefined
      );
      const allSeances = joursData.flatMap((jour: JourSemaine) => jour.seances);
      const semestreNum = Number(filters.semestre);
      const anneeId = filters.annee_academique_id
        ? Number(filters.annee_academique_id)
        : undefined;
      const filtered = anneeId
        ? allSeances.filter(
            (s) =>
              s.semestre === semestreNum && s.annee_academique_id === anneeId
          )
        : allSeances.filter((s) => s.semestre === semestreNum);
      setSeances(filtered);
    } catch (error) {
      console.error('Erreur lors du chargement des séances:', error);
      setSnackbar({
        open: true,
        message: 'Impossible de charger les séances',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, currentWeekStart]);

  const loadEmploiTemps = useCallback(async () => {
    if (!filters.niveau_id || !filters.annee_academique_id) {
      setCurrentEdt(null);
      return;
    }
    try {
      const list = await emploiTempsService.getEmploisTemps({
        niveau_id: Number(filters.niveau_id),
        filiere_id: filters.filiere_id ? Number(filters.filiere_id) : undefined,
        semestre: Number(filters.semestre),
        annee_id: Number(filters.annee_academique_id),
      });
      const active = list.filter((e) => e.statut !== 'archive');
      const priority: Record<string, number> = {
        brouillon: 0,
        valide: 1,
        publie: 2,
      };
      active.sort(
        (a, b) => (priority[a.statut] ?? 9) - (priority[b.statut] ?? 9)
      );
      setCurrentEdt(active[0] ?? null);
    } catch (error) {
      console.error('Erreur chargement emploi du temps:', error);
      setCurrentEdt(null);
    }
  }, [filters]);

  useEffect(() => {
    loadSeances();
  }, [loadSeances, refresh]);

  useEffect(() => {
    loadEmploiTemps();
  }, [loadEmploiTemps, refresh]);

  const weekLabel = `${format(currentWeekStart, 'dd/MM/yyyy', { locale: fr })} - ${format(
    endOfWeek(currentWeekStart, { weekStartsOn: 1 }),
    'dd/MM/yyyy',
    { locale: fr }
  )}`;

  const handleCreateSeance = () => {
    setSelectedSeance(null);
    setIsRecurrent(false);
    setFormDialogOpen(true);
  };

  const handleCreateRecurrent = () => {
    setSelectedSeance(null);
    setIsRecurrent(true);
    setFormDialogOpen(true);
  };

  const handleSeanceClick = (seance: SeanceWithDetails) => {
    setSelectedSeance(seance);
    setDetailsDrawerOpen(true);
  };

  const handleCellClick = () => {
    setSelectedSeance(null);
    setIsRecurrent(false);
    setFormDialogOpen(true);
  };

  const handleFormSubmit = async (
    data: CreateSeance | UpdateSeance | CreateSeanceRecurrente
  ) => {
    try {
      if (selectedSeance) {
        await seanceService.updateSeance(selectedSeance.id, data as UpdateSeance);
        setSnackbar({
          open: true,
          message: 'Séance modifiée avec succès',
          severity: 'success',
        });
      } else if ('seance_base' in data) {
        await seanceService.createSeanceRecurrente(data as CreateSeanceRecurrente);
        setSnackbar({
          open: true,
          message: 'Séances récurrentes créées avec succès',
          severity: 'success',
        });
      } else {
        await seanceService.createSeance(data as CreateSeance);
        setSnackbar({
          open: true,
          message: 'Séance créée avec succès',
          severity: 'success',
        });
      }
      setFormDialogOpen(false);
      setRefresh((r) => r + 1);
    } catch (error) {
      setSnackbar({
        open: true,
        message: extractErrorMessage(error),
        severity: 'error',
      });
    }
  };

  const handleConfirmer = async () => {
    if (!selectedSeance) return;
    try {
      await seanceService.confirmerSeance(selectedSeance.id);
      setSnackbar({ open: true, message: 'Séance confirmée', severity: 'success' });
      setDetailsDrawerOpen(false);
      setRefresh((r) => r + 1);
    } catch {
      setSnackbar({
        open: true,
        message: 'Erreur lors de la confirmation',
        severity: 'error',
      });
    }
  };

  const handleAnnuler = async () => {
    if (!selectedSeance) return;
    const motif = window.prompt("Motif d'annulation :");
    if (motif) {
      try {
        await seanceService.annulerSeance(selectedSeance.id, motif);
        setSnackbar({ open: true, message: 'Séance annulée', severity: 'success' });
        setDetailsDrawerOpen(false);
        setRefresh((r) => r + 1);
      } catch {
        setSnackbar({
          open: true,
          message: "Erreur lors de l'annulation",
          severity: 'error',
        });
      }
    }
  };

  const handleReporter = async () => {
    if (!selectedSeance) return;
    const nouvelleDate = window.prompt(
      'Nouvelle date (AAAA-MM-JJ) :',
      selectedSeance.date_seance
    );
    if (!nouvelleDate) return;
    const creneauStr = window.prompt(
      'ID du nouveau créneau horaire :',
      String(selectedSeance.creneau_id)
    );
    if (!creneauStr) return;
    try {
      await seanceService.reporterSeance(
        selectedSeance.id,
        nouvelleDate,
        Number(creneauStr)
      );
      setSnackbar({ open: true, message: 'Séance reportée', severity: 'success' });
      setDetailsDrawerOpen(false);
      setRefresh((r) => r + 1);
    } catch (error) {
      setSnackbar({
        open: true,
        message: extractErrorMessage(error),
        severity: 'error',
      });
    }
  };

  const handleExportExcel = async () => {
    if (!filters.niveau_id || !filters.annee_academique_id) {
      setSnackbar({
        open: true,
        message: 'Sélectionnez un niveau et une année académique',
        severity: 'error',
      });
      return;
    }
    setExporting(true);
    try {
      const edt = await emploiTempsService.getEmploiTempsActif(
        Number(filters.niveau_id),
        filters.filiere_id ? Number(filters.filiere_id) : null,
        Number(filters.semestre),
        Number(filters.annee_academique_id)
      );
      if (!edt) {
        setSnackbar({
          open: true,
          message: 'Aucun emploi du temps publié pour ces critères',
          severity: 'error',
        });
        return;
      }
      const blob = await emploiTempsService.exportExcel(edt.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `emploi-temps-${edt.libelle || edt.id}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
      setSnackbar({
        open: true,
        message: 'Export Excel téléchargé',
        severity: 'success',
      });
    } catch (error) {
      console.error('Erreur export Excel:', error);
      setSnackbar({
        open: true,
        message: "Erreur lors de l'export Excel",
        severity: 'error',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleInitEmploiTemps = async () => {
    if (!filters.niveau_id || !filters.annee_academique_id) return;
    setWorkflowLoading(true);
    try {
      const annee = anneesAcademiques.find(
        (a) => String(a.id) === filters.annee_academique_id
      );
      const niv = niveaux.find((n) => String(n.id) === filters.niveau_id);
      const suffix = Date.now().toString(36);
      const created = await emploiTempsService.createEmploiTemps({
        code: `EDT-N${filters.niveau_id}-S${filters.semestre}-${suffix}`,
        libelle: `EDT ${niv?.libelle ?? filters.niveau_id} - S${filters.semestre}`,
        niveau_id: Number(filters.niveau_id),
        filiere_id: filters.filiere_id ? Number(filters.filiere_id) : undefined,
        semestre: Number(filters.semestre),
        annee_academique_id: Number(filters.annee_academique_id),
        date_debut: annee?.date_debut?.slice(0, 10) ?? format(currentWeekStart, 'yyyy-MM-dd'),
        date_fin:
          annee?.date_fin?.slice(0, 10) ??
          format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      });
      setCurrentEdt(created);
      setSnackbar({
        open: true,
        message: 'Emploi du temps brouillon créé',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: extractErrorMessage(error),
        severity: 'error',
      });
    } finally {
      setWorkflowLoading(false);
    }
  };

  const handleValiderEmploiTemps = async () => {
    if (!currentEdt) return;
    setWorkflowLoading(true);
    try {
      const updated = await emploiTempsService.validerEmploiTemps(currentEdt.id);
      setCurrentEdt(updated);
      setSnackbar({ open: true, message: 'Emploi du temps validé', severity: 'success' });
    } catch (error) {
      setSnackbar({
        open: true,
        message: extractErrorMessage(error),
        severity: 'error',
      });
    } finally {
      setWorkflowLoading(false);
    }
  };

  const handlePublierEmploiTemps = async () => {
    if (!currentEdt) return;
    setWorkflowLoading(true);
    try {
      const updated = await emploiTempsService.publierEmploiTemps(currentEdt.id);
      setCurrentEdt(updated);
      setSnackbar({ open: true, message: 'Emploi du temps publié', severity: 'success' });
      setRefresh((r) => r + 1);
    } catch (error) {
      setSnackbar({
        open: true,
        message: extractErrorMessage(error),
        severity: 'error',
      });
    } finally {
      setWorkflowLoading(false);
    }
  };

  const handleArchiverEmploiTemps = async () => {
    if (!currentEdt) return;
    if (!window.confirm('Archiver cet emploi du temps ?')) return;
    setWorkflowLoading(true);
    try {
      const updated = await emploiTempsService.archiverEmploiTemps(currentEdt.id);
      setCurrentEdt(updated);
      setSnackbar({ open: true, message: 'Emploi du temps archivé', severity: 'success' });
    } catch (error) {
      setSnackbar({
        open: true,
        message: extractErrorMessage(error),
        severity: 'error',
      });
    } finally {
      setWorkflowLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!filters.niveau_id || !filters.annee_academique_id) {
      setSnackbar({
        open: true,
        message: 'Sélectionnez un niveau et une année académique',
        severity: 'error',
      });
      return;
    }
    setExporting(true);
    try {
      const edt = await emploiTempsService.getEmploiTempsActif(
        Number(filters.niveau_id),
        filters.filiere_id ? Number(filters.filiere_id) : null,
        Number(filters.semestre),
        Number(filters.annee_academique_id)
      );
      if (!edt) {
        setSnackbar({
          open: true,
          message: 'Aucun emploi du temps actif pour ces critères',
          severity: 'error',
        });
        return;
      }
      const blob = await emploiTempsService.exportPDF(edt.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `emploi-temps-${edt.libelle || edt.id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      setSnackbar({
        open: true,
        message: 'Export PDF téléchargé',
        severity: 'success',
      });
    } catch (error) {
      console.error('Erreur export PDF:', error);
      setSnackbar({
        open: true,
        message: "Erreur lors de l'export PDF",
        severity: 'error',
      });
    } finally {
      setExporting(false);
    }
  };

  const niveauLabel = (n: Niveau) => n.libelle || `Niveau #${n.id}`;
  const filiereLabel = (f: Filiere) => f.libelle || `Filière #${f.id}`;

  return (
    <Box>
      {showTitle && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography variant="h4">Emploi du Temps</Typography>
        </Box>
      )}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 1,
          mb: 2,
          flexWrap: 'wrap',
        }}
      >
        {canExportEdt && (
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportExcel}
            disabled={exporting || !filters.niveau_id}
          >
            Export Excel
          </Button>
        )}
        {canExportEdt && (
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportPDF}
            disabled={exporting || !filters.niveau_id}
          >
            Export PDF
          </Button>
        )}
        {canCreateSeance && (
          <Button
            variant="outlined"
            startIcon={<RepeatIcon />}
            onClick={handleCreateRecurrent}
            disabled={!filters.niveau_id}
          >
            Séance récurrente
          </Button>
        )}
        {canCreateSeance && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateSeance}
            disabled={!filters.niveau_id}
          >
            Nouvelle séance
          </Button>
        )}
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Niveau"
              value={filters.niveau_id}
              onChange={(e) => setFilters({ ...filters, niveau_id: e.target.value })}
            >
              <MenuItem value="">Sélectionner un niveau</MenuItem>
              {niveaux.map((niveau) => (
                <MenuItem key={niveau.id} value={String(niveau.id)}>
                  {niveauLabel(niveau)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Filière"
              value={filters.filiere_id}
              onChange={(e) => setFilters({ ...filters, filiere_id: e.target.value })}
            >
              <MenuItem value="">Toutes les filières</MenuItem>
              {filieres.map((filiere) => (
                <MenuItem key={filiere.id} value={String(filiere.id)}>
                  {filiereLabel(filiere)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Semestre"
              value={filters.semestre}
              onChange={(e) => setFilters({ ...filters, semestre: e.target.value })}
            >
              <MenuItem value="1">Semestre 1</MenuItem>
              <MenuItem value="2">Semestre 2</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Année académique"
              value={filters.annee_academique_id}
              onChange={(e) =>
                setFilters({ ...filters, annee_academique_id: e.target.value })
              }
            >
              <MenuItem value="">Sélectionner</MenuItem>
              {anneesAcademiques.map((annee) => (
                <MenuItem key={annee.id} value={String(annee.id)}>
                  {annee.libelle}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={() => setCurrentWeekStart((d) => subWeeks(d, 1))}
                aria-label="Semaine précédente"
              >
                <ChevronLeftIcon />
              </IconButton>
              <Typography variant="body2" sx={{ flex: 1, textAlign: 'center' }}>
                {weekLabel}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setCurrentWeekStart((d) => addWeeks(d, 1))}
                aria-label="Semaine suivante"
              >
                <ChevronRightIcon />
              </IconButton>
              <Button
                size="small"
                variant="text"
                onClick={() =>
                  setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
                }
              >
                Aujourd&apos;hui
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {filters.niveau_id && filters.annee_academique_id && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 2,
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Publication EDT
              </Typography>
              {currentEdt ? (
                <>
                  <Chip
                    label={getStatutEmploiTempsLabel(currentEdt.statut)}
                    color={getStatutEmploiTempsColor(currentEdt.statut)}
                    size="small"
                  />
                  <Typography variant="body2" color="text.secondary">
                    {currentEdt.libelle} (v{currentEdt.version})
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Aucun emploi du temps pour cette sélection
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {canCreateSeance && !currentEdt && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleInitEmploiTemps}
                  disabled={workflowLoading}
                >
                  Créer brouillon
                </Button>
              )}
              {canValidate && currentEdt?.statut === 'brouillon' && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<CheckCircleIcon />}
                  onClick={handleValiderEmploiTemps}
                  disabled={workflowLoading}
                >
                  Valider
                </Button>
              )}
              {canValidate &&
                currentEdt &&
                (currentEdt.statut === 'brouillon' || currentEdt.statut === 'valide') && (
                  <Button
                    variant="contained"
                    size="small"
                    color="success"
                    startIcon={<PublishIcon />}
                    onClick={handlePublierEmploiTemps}
                    disabled={workflowLoading}
                  >
                    Publier
                  </Button>
                )}
              {canValidate && currentEdt?.statut === 'publie' && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ArchiveIcon />}
                  onClick={handleArchiverEmploiTemps}
                  disabled={workflowLoading}
                >
                  Archiver
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      )}

      {filters.niveau_id ? (
        loading ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">Chargement des séances…</Typography>
          </Paper>
        ) : (
          <EmploiTempsGrid
            seances={seances}
            editable
            onSeanceClick={handleSeanceClick}
            onCellClick={handleCellClick}
          />
        )
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Sélectionnez un niveau pour afficher l&apos;emploi du temps
          </Typography>
        </Paper>
      )}

      <Dialog
        open={formDialogOpen}
        onClose={() => setFormDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedSeance
            ? 'Modifier la séance'
            : isRecurrent
              ? 'Nouvelle séance récurrente'
              : 'Nouvelle séance'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <SeanceForm
              initialData={selectedSeance}
              niveauId={filters.niveau_id ? Number(filters.niveau_id) : undefined}
              filiereId={filters.filiere_id ? Number(filters.filiere_id) : undefined}
              semestre={Number(filters.semestre)}
              anneeAcademiqueId={
                filters.annee_academique_id
                  ? Number(filters.annee_academique_id)
                  : undefined
              }
              onSubmit={handleFormSubmit}
              onCancel={() => setFormDialogOpen(false)}
            />
          </Box>
        </DialogContent>
      </Dialog>

      <Drawer
        anchor="right"
        open={detailsDrawerOpen}
        onClose={() => setDetailsDrawerOpen(false)}
        PaperProps={{ sx: { width: 400 } }}
      >
        <Box sx={{ p: 2 }}>
          {selectedSeance && (
            <SeanceDetails
              seanceId={selectedSeance.id}
              onEdit={() => {
                setDetailsDrawerOpen(false);
                setFormDialogOpen(true);
              }}
              onConfirmer={handleConfirmer}
              onAnnuler={handleAnnuler}
              onReporter={handleReporter}
            />
          )}
        </Box>
      </Drawer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EmploiTempsPlanning;
