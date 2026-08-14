import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridCellEditStopParams,
  GridCellEditStopReasons,
  MuiEvent,
} from '@mui/x-data-grid';
import {
  Save as SaveIcon,
  CheckCircle as ValidateIcon,
} from '@mui/icons-material';

import {
  NoteWithEtudiant,
  StatistiquesExamen,
  StatutPresence,
} from '../../types/evaluation';
import noteService from '../../services/noteService';
import examenService from '../../services/examenService';

interface SaisieNotesTableProps {
  examenId: number;
  noteSur?: number;
  onSaved?: () => void;
}

interface NoteRow {
  id: number;
  etudiant_id: number;
  inscription_matiere_id: number;
  matricule: string;
  nom: string;
  prenom: string;
  note: number | null;
  note_sur_20: number | null;
  statut_presence: StatutPresence;
  observation: string;
  is_valide: boolean;
  isModified?: boolean;
}

const SaisieNotesTable: React.FC<SaisieNotesTableProps> = ({
  examenId,
  noteSur = 20,
  onSaved,
}) => {
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<StatistiquesExamen | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    loadData();
  }, [examenId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [notesData, statsData] = await Promise.all([
        noteService.getNotesByExamen(examenId),
        examenService.getStatistiques(examenId),
      ]);

      const rows: NoteRow[] = notesData.map((n: NoteWithEtudiant) => ({
        id: n.id,
        etudiant_id: n.etudiant_id,
        inscription_matiere_id: n.inscription_matiere_id,
        matricule: n.etudiant?.matricule || '',
        nom: n.etudiant?.nom || '',
        prenom: n.etudiant?.prenom || '',
        note: n.note ?? null,
        note_sur_20: n.note_sur_20 ?? null,
        statut_presence: n.statut_presence,
        observation: n.observation || '',
        is_valide: n.is_valide,
        isModified: false,
      }));

      setNotes(rows);
      setStats(statsData);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      showSnackbar('Erreur lors du chargement des notes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCellEditStop = (params: GridCellEditStopParams, event: MuiEvent) => {
    if (params.reason === GridCellEditStopReasons.cellFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const processRowUpdate = useCallback((newRow: NoteRow, oldRow: NoteRow) => {
    // Calculer note_sur_20 si la note a changé
    let note_sur_20 = newRow.note_sur_20;
    if (newRow.note !== oldRow.note && newRow.note !== null) {
      if (noteSur !== 20) {
        note_sur_20 = Math.round((newRow.note / noteSur) * 20 * 100) / 100;
      } else {
        note_sur_20 = newRow.note;
      }
    }

    const updatedRow = {
      ...newRow,
      note_sur_20,
      isModified: true,
    };

    setNotes((prev) =>
      prev.map((row) => (row.id === newRow.id ? updatedRow : row))
    );

    return updatedRow;
  }, [noteSur]);

  const handleSaveAll = async () => {
    const modifiedNotes = notes.filter((n) => n.isModified);
    if (modifiedNotes.length === 0) {
      showSnackbar('Aucune modification à enregistrer', 'error');
      return;
    }

    setSaving(true);
    try {
      for (const note of modifiedNotes) {
        await noteService.updateNote(note.id, {
          note: note.note ?? undefined,
          statut_presence: note.statut_presence,
          observation: note.observation,
        });
      }

      showSnackbar(`${modifiedNotes.length} note(s) enregistrée(s)`, 'success');
      
      // Recharger les données
      await loadData();
      onSaved?.();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      showSnackbar('Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleValidateAll = async () => {
    setSaving(true);
    try {
      const result = await noteService.validerNotesExamen(examenId);
      showSnackbar(result.message, 'success');
      await loadData();
      onSaved?.();
    } catch (error) {
      console.error('Erreur validation:', error);
      showSnackbar('Erreur lors de la validation', 'error');
    } finally {
      setSaving(false);
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'matricule',
      headerName: 'Matricule',
      width: 120,
      editable: false,
    },
    {
      field: 'nom',
      headerName: 'Nom',
      width: 150,
      editable: false,
    },
    {
      field: 'prenom',
      headerName: 'Prénom',
      width: 150,
      editable: false,
    },
    {
      field: 'note',
      headerName: `Note /${noteSur}`,
      width: 100,
      editable: true,
      type: 'number',
      renderCell: (params: GridRenderCellParams) => {
        const value = params.value;
        if (value === null || value === undefined) return '-';
        return (
          <Typography
            color={value >= noteSur / 2 ? 'success.main' : 'error.main'}
            fontWeight="medium"
          >
            {value.toFixed(2)}
          </Typography>
        );
      },
    },
    {
      field: 'note_sur_20',
      headerName: 'Note /20',
      width: 100,
      editable: false,
      renderCell: (params: GridRenderCellParams) => {
        const value = params.value;
        if (value === null || value === undefined) return '-';
        return (
          <Typography
            color={value >= 10 ? 'success.main' : 'error.main'}
            fontWeight="medium"
          >
            {value.toFixed(2)}
          </Typography>
        );
      },
    },
    {
      field: 'statut_presence',
      headerName: 'Présence',
      width: 140,
      editable: true,
      type: 'singleSelect',
      valueOptions: [
        { value: 'present', label: 'Présent' },
        { value: 'absent', label: 'Absent' },
        { value: 'absent_justifie', label: 'Absent justifié' },
      ],
      renderCell: (params: GridRenderCellParams) => {
        const colors: Record<string, 'success' | 'error' | 'warning'> = {
          present: 'success',
          absent: 'error',
          absent_justifie: 'warning',
        };
        const labels: Record<string, string> = {
          present: 'Présent',
          absent: 'Absent',
          absent_justifie: 'Absent J.',
        };
        return (
          <Chip
            label={labels[params.value] || params.value}
            size="small"
            color={colors[params.value] || 'default'}
          />
        );
      },
    },
    {
      field: 'observation',
      headerName: 'Observation',
      flex: 1,
      minWidth: 150,
      editable: true,
    },
    {
      field: 'is_valide',
      headerName: 'Validé',
      width: 80,
      renderCell: (params: GridRenderCellParams) => (
        params.value ? (
          <Chip label="Oui" size="small" color="success" />
        ) : (
          <Chip label="Non" size="small" color="default" />
        )
      ),
    },
  ];

  const modifiedCount = notes.filter((n) => n.isModified).length;

  return (
    <Box>
      {/* Statistiques en temps réel */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary">
                  Moyenne
                </Typography>
                <Typography variant="h5" color="primary">
                  {stats.moyenne?.toFixed(2) || '-'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary">
                  Min / Max
                </Typography>
                <Typography variant="h5">
                  {stats.min?.toFixed(1) || '-'} / {stats.max?.toFixed(1) || '-'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary">
                  Présents / Absents
                </Typography>
                <Typography variant="h5">
                  {stats.nombre_presents} / {stats.nombre_absents}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary">
                  Taux réussite
                </Typography>
                <Typography
                  variant="h5"
                  color={stats.taux_reussite && stats.taux_reussite >= 50 ? 'success.main' : 'error.main'}
                >
                  {stats.taux_reussite?.toFixed(1) || '-'}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Actions */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={handleSaveAll}
          disabled={saving || modifiedCount === 0}
        >
          Enregistrer {modifiedCount > 0 && `(${modifiedCount})`}
        </Button>
        <Button
          variant="outlined"
          color="success"
          startIcon={<ValidateIcon />}
          onClick={handleValidateAll}
          disabled={saving}
        >
          Valider toutes les notes
        </Button>
        {modifiedCount > 0 && (
          <Alert severity="warning" sx={{ py: 0 }}>
            {modifiedCount} modification(s) non enregistrée(s)
          </Alert>
        )}
      </Box>

      {/* Tableau */}
      <Paper sx={{ height: 500 }}>
        <DataGrid
          rows={notes}
          columns={columns}
          loading={loading}
          pageSizeOptions={[25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 50 } },
          }}
          processRowUpdate={processRowUpdate}
          onCellEditStop={handleCellEditStop}
          disableRowSelectionOnClick
          localeText={{
            noRowsLabel: 'Aucune note',
          }}
          sx={{
            '& .MuiDataGrid-cell--editing': {
              bgcolor: 'primary.light',
            },
          }}
        />
      </Paper>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SaisieNotesTable;
