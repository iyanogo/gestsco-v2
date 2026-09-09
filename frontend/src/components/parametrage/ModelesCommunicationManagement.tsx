import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  MenuItem,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Email as EmailIcon,
  Sms as SmsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Preview as PreviewIcon,
} from '@mui/icons-material';
import modeleCommunicationService from '../../services/modeleCommunicationService';
import { usePermissions } from '../../hooks/usePermissions';
import {
  ModeleEmail,
  ModeleEmailCreate,
  ModeleSMS,
  ModeleSMSCreate,
} from '../../types/parametrage';

interface ModelesCommunicationManagementProps {
  showTitle?: boolean;
}

const ModelesCommunicationManagement: React.FC<ModelesCommunicationManagementProps> = ({
  showTitle = true,
}) => {
  const { moduleActions } = usePermissions();
  const { canCreate, canUpdate, canDelete } = moduleActions('parametrage');
  const [tab, setTab] = useState(0);
  const [emails, setEmails] = useState<ModeleEmail[]>([]);
  const [smsList, setSmsList] = useState<ModeleSMS[]>([]);
  const [typesDest, setTypesDest] = useState<{ code: string; libelle: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [editingEmail, setEditingEmail] = useState<ModeleEmail | null>(null);
  const [editingSms, setEditingSms] = useState<ModeleSMS | null>(null);
  const [emailForm, setEmailForm] = useState<Partial<ModeleEmailCreate>>({
    code: '',
    libelle: '',
    type_destinataire: 'etudiant',
    objet: '',
    corps_html: '<p></p>',
  });
  const [smsForm, setSmsForm] = useState<Partial<ModeleSMSCreate>>({
    code: '',
    libelle: '',
    type_destinataire: 'etudiant',
    message: '',
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [emailData, smsData, types] = await Promise.all([
        modeleCommunicationService.getAllEmails(),
        modeleCommunicationService.getAllSMS(),
        modeleCommunicationService.getTypesDestinataires(),
      ]);
      setEmails(emailData);
      setSmsList(smsData);
      setTypesDest(types);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setSnackbar({ open: true, message: 'Erreur lors du chargement', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenEmailDialog = (modele?: ModeleEmail) => {
    setEditingSms(null);
    if (modele) {
      setEditingEmail(modele);
      setEmailForm({
        code: modele.code,
        libelle: modele.libelle,
        type_destinataire: modele.type_destinataire,
        objet: modele.objet,
        corps_html: modele.corps_html,
        corps_texte: modele.corps_texte,
      });
    } else {
      setEditingEmail(null);
      setEmailForm({
        code: '',
        libelle: '',
        type_destinataire: 'etudiant',
        objet: '',
        corps_html: '<p></p>',
      });
    }
    setDialogOpen(true);
  };

  const handleOpenSmsDialog = (modele?: ModeleSMS) => {
    setEditingEmail(null);
    if (modele) {
      setEditingSms(modele);
      setSmsForm({
        code: modele.code,
        libelle: modele.libelle,
        type_destinataire: modele.type_destinataire,
        message: modele.message,
      });
    } else {
      setEditingSms(null);
      setSmsForm({ code: '', libelle: '', type_destinataire: 'etudiant', message: '' });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingEmail(null);
    setEditingSms(null);
  };

  const handleSave = async () => {
    try {
      if (tab === 0) {
        if (editingEmail) {
          await modeleCommunicationService.updateEmail(editingEmail.id, emailForm);
          setSnackbar({ open: true, message: 'Modèle email mis à jour', severity: 'success' });
        } else {
          await modeleCommunicationService.createEmail(emailForm as ModeleEmailCreate);
          setSnackbar({ open: true, message: 'Modèle email créé', severity: 'success' });
        }
      } else if (editingSms) {
        await modeleCommunicationService.updateSMS(editingSms.id, smsForm);
        setSnackbar({ open: true, message: 'Modèle SMS mis à jour', severity: 'success' });
      } else {
        await modeleCommunicationService.createSMS(smsForm as ModeleSMSCreate);
        setSnackbar({ open: true, message: 'Modèle SMS créé', severity: 'success' });
      }
      handleCloseDialog();
      loadData();
    } catch (error) {
      console.error('Erreur:', error);
      setSnackbar({ open: true, message: 'Erreur lors de l\'enregistrement', severity: 'error' });
    }
  };

  const handleDeleteEmail = async (id: number) => {
    if (!window.confirm('Supprimer ce modèle email ?')) return;
    try {
      await modeleCommunicationService.deleteEmail(id);
      setSnackbar({ open: true, message: 'Modèle email supprimé', severity: 'success' });
      loadData();
    } catch (error) {
      setSnackbar({ open: true, message: 'Erreur lors de la suppression', severity: 'error' });
    }
  };

  const handleDeleteSms = async (id: number) => {
    if (!window.confirm('Supprimer ce modèle SMS ?')) return;
    try {
      await modeleCommunicationService.deleteSMS(id);
      setSnackbar({ open: true, message: 'Modèle SMS supprimé', severity: 'success' });
      loadData();
    } catch (error) {
      setSnackbar({ open: true, message: 'Erreur lors de la suppression', severity: 'error' });
    }
  };

  const handlePreviewEmail = async (modele: ModeleEmail) => {
    try {
      const result = await modeleCommunicationService.previewEmail(modele.id, {});
      setPreviewContent(`<strong>${result.objet}</strong><hr/>${result.corps_html}`);
      setPreviewOpen(true);
    } catch (error) {
      setSnackbar({ open: true, message: 'Erreur lors de l\'aperçu', severity: 'error' });
    }
  };

  const handlePreviewSms = async (modele: ModeleSMS) => {
    try {
      const result = await modeleCommunicationService.previewSMS(modele.id, {});
      setPreviewContent(result.message);
      setPreviewOpen(true);
    } catch (error) {
      setSnackbar({ open: true, message: 'Erreur lors de l\'aperçu', severity: 'error' });
    }
  };

  const getDestLabel = (code: string) => typesDest.find((t) => t.code === code)?.libelle || code;

  return (
    <Box>
      {showTitle && (
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <EmailIcon color="primary" />
          <Typography variant="h5">Modèles Email & SMS</Typography>
        </Box>
      )}

      <Paper sx={{ p: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab icon={<EmailIcon />} iconPosition="start" label={`Emails (${emails.length})`} />
          <Tab icon={<SmsIcon />} iconPosition="start" label={`SMS (${smsList.length})`} />
        </Tabs>

        <Box display="flex" justifyContent="flex-end" mb={2}>
          {canCreate && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => (tab === 0 ? handleOpenEmailDialog() : handleOpenSmsDialog())}
            >
              {tab === 0 ? 'Nouvel email' : 'Nouveau SMS'}
            </Button>
          )}
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : tab === 0 ? (
          emails.length === 0 ? (
            <Alert severity="info">Aucun modèle email configuré.</Alert>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Libellé</TableCell>
                    <TableCell>Destinataire</TableCell>
                    <TableCell>Objet</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {emails.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell><code>{m.code}</code></TableCell>
                      <TableCell>{m.libelle}</TableCell>
                      <TableCell><Chip label={getDestLabel(m.type_destinataire)} size="small" /></TableCell>
                      <TableCell>{m.objet}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Aperçu">
                          <IconButton size="small" onClick={() => handlePreviewEmail(m)}>
                            <PreviewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Modifier">
                          {canUpdate && (
                            <IconButton size="small" onClick={() => handleOpenEmailDialog(m)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Tooltip>
                        {canDelete && !m.est_systeme_defaut && (
                          <Tooltip title="Supprimer">
                            <IconButton size="small" color="error" onClick={() => handleDeleteEmail(m.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )
        ) : smsList.length === 0 ? (
          <Alert severity="info">Aucun modèle SMS configuré.</Alert>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Libellé</TableCell>
                  <TableCell>Destinataire</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {smsList.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell><code>{m.code}</code></TableCell>
                    <TableCell>{m.libelle}</TableCell>
                    <TableCell><Chip label={getDestLabel(m.type_destinataire)} size="small" /></TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {m.message.length > 50 ? `${m.message.slice(0, 50)}…` : m.message}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Aperçu">
                        <IconButton size="small" onClick={() => handlePreviewSms(m)}>
                          <PreviewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Modifier">
                        {canUpdate && (
                          <IconButton size="small" onClick={() => handleOpenSmsDialog(m)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Tooltip>
                      {canDelete && !m.est_systeme_defaut && (
                        <Tooltip title="Supprimer">
                          <IconButton size="small" color="error" onClick={() => handleDeleteSms(m.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {tab === 0
            ? editingEmail ? 'Modifier le modèle email' : 'Nouveau modèle email'
            : editingSms ? 'Modifier le modèle SMS' : 'Nouveau modèle SMS'}
        </DialogTitle>
        <DialogContent>
          {tab === 0 ? (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Code"
                  value={emailForm.code}
                  onChange={(e) => setEmailForm({ ...emailForm, code: e.target.value.toUpperCase() })}
                  disabled={!!editingEmail}
                  required
                />
              </Grid>
              <Grid item xs={8}>
                <TextField
                  fullWidth
                  label="Libellé"
                  value={emailForm.libelle}
                  onChange={(e) => setEmailForm({ ...emailForm, libelle: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  select
                  label="Destinataire"
                  value={emailForm.type_destinataire}
                  onChange={(e) => setEmailForm({ ...emailForm, type_destinataire: e.target.value })}
                >
                  {typesDest.map((t) => (
                    <MenuItem key={t.code} value={t.code}>{t.libelle}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Objet"
                  value={emailForm.objet}
                  onChange={(e) => setEmailForm({ ...emailForm, objet: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Corps HTML"
                  value={emailForm.corps_html}
                  onChange={(e) => setEmailForm({ ...emailForm, corps_html: e.target.value })}
                  multiline
                  rows={8}
                  required
                  sx={{ '& textarea': { fontFamily: 'monospace' } }}
                />
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Code"
                  value={smsForm.code}
                  onChange={(e) => setSmsForm({ ...smsForm, code: e.target.value.toUpperCase() })}
                  disabled={!!editingSms}
                  required
                />
              </Grid>
              <Grid item xs={8}>
                <TextField
                  fullWidth
                  label="Libellé"
                  value={smsForm.libelle}
                  onChange={(e) => setSmsForm({ ...smsForm, libelle: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  select
                  label="Destinataire"
                  value={smsForm.type_destinataire}
                  onChange={(e) => setSmsForm({ ...smsForm, type_destinataire: e.target.value })}
                >
                  {typesDest.map((t) => (
                    <MenuItem key={t.code} value={t.code}>{t.libelle}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Message"
                  value={smsForm.message}
                  onChange={(e) => setSmsForm({ ...smsForm, message: e.target.value })}
                  multiline
                  rows={4}
                  required
                  helperText={`${(smsForm.message || '').length} caractères`}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSave} variant="contained">Enregistrer</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Aperçu</DialogTitle>
        <DialogContent>
          {tab === 0 ? (
            <Box dangerouslySetInnerHTML={{ __html: previewContent }} />
          ) : (
            <Typography sx={{ whiteSpace: 'pre-wrap' }}>{previewContent}</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ModelesCommunicationManagement;
