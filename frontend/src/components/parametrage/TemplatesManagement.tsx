import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  Tooltip,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Description as DescriptionIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Star as StarIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import { TemplateEditor } from './index';
import templateService from '../../services/templateService';
import { usePermissions } from '../../hooks/usePermissions';
import {
  TemplateDocument,
  TemplateDocumentCreate,
  TemplateDocumentUpdate,
  TYPES_DOCUMENTS,
} from '../../types/parametrage';

interface TemplatesManagementProps {
  showTitle?: boolean;
}

const TemplatesManagement: React.FC<TemplatesManagementProps> = ({ showTitle = true }) => {
  const { moduleActions } = usePermissions();
  const { canCreate, canUpdate, canDelete } = moduleActions('parametrage');
  const [templates, setTemplates] = useState<TemplateDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateDocument | undefined>(undefined);
  const [variables, setVariables] = useState<{ nom: string; description: string }[]>([]);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await templateService.getAll();
      setTemplates(data);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors du chargement des templates',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleOpenDialog = async (template?: TemplateDocument) => {
    setEditingTemplate(template);
    const typeDoc = template?.type_document || 'bulletin';
    try {
      const vars = await templateService.getVariables(typeDoc);
      setVariables(vars);
    } catch {
      setVariables([]);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTemplate(undefined);
  };

  const handleSave = async (data: TemplateDocumentCreate | TemplateDocumentUpdate) => {
    try {
      if (editingTemplate) {
        await templateService.update(editingTemplate.id, data as TemplateDocumentUpdate);
        setSnackbar({ open: true, message: 'Template mis à jour avec succès', severity: 'success' });
      } else {
        await templateService.create(data as TemplateDocumentCreate);
        setSnackbar({ open: true, message: 'Template créé avec succès', severity: 'success' });
      }
      handleCloseDialog();
      loadTemplates();
    } catch (error) {
      console.error('Erreur:', error);
      setSnackbar({ open: true, message: 'Erreur lors de l\'enregistrement', severity: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) return;
    try {
      await templateService.delete(id);
      setSnackbar({ open: true, message: 'Template supprimé avec succès', severity: 'success' });
      loadTemplates();
    } catch (error) {
      console.error('Erreur:', error);
      setSnackbar({ open: true, message: 'Erreur lors de la suppression', severity: 'error' });
    }
  };

  const handleInitialiser = async () => {
    try {
      const result = await templateService.initialiser();
      setSnackbar({
        open: true,
        message: `${result.templates_crees} templates initialisés`,
        severity: 'success',
      });
      loadTemplates();
    } catch (error) {
      console.error('Erreur:', error);
      setSnackbar({ open: true, message: 'Erreur lors de l\'initialisation', severity: 'error' });
    }
  };

  const handlePreview = async (previewVariables: Record<string, unknown>) => {
    if (!editingTemplate?.id) return;
    try {
      await templateService.preview(editingTemplate.id, previewVariables);
    } catch (error) {
      console.error('Erreur preview:', error);
    }
  };

  const handleExportPdf = async (template: TemplateDocument) => {
    try {
      const vars = await templateService.getVariables(template.type_document);
      const variables: Record<string, string> = {};
      vars.forEach((v) => { variables[v.nom] = `[${v.nom}]`; });
      const blob = await templateService.exportPDF(template.id, variables);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `template_${template.code}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur export PDF:', error);
      setSnackbar({ open: true, message: 'Erreur lors de l\'export PDF', severity: 'error' });
    }
  };

  const getTypeLabel = (type: string) => {
    const t = TYPES_DOCUMENTS.find((td) => td.value === type);
    return t ? t.label : type;
  };

  const templatesByType = templates.reduce((acc, t) => {
    if (!acc[t.type_document]) acc[t.type_document] = [];
    acc[t.type_document].push(t);
    return acc;
  }, {} as Record<string, TemplateDocument[]>);

  const actionButtons = (canCreate || canUpdate) ? (
    <Box display="flex" gap={1}>
      {canCreate && (
        <Button variant="outlined" size={showTitle ? 'medium' : 'small'} startIcon={<RefreshIcon />} onClick={handleInitialiser}>
          Initialiser
        </Button>
      )}
      {canCreate && (
        <Button variant="contained" size={showTitle ? 'medium' : 'small'} startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Nouveau template
        </Button>
      )}
    </Box>
  ) : null;

  return (
    <Box>
      {showTitle && (
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={1}>
            <DescriptionIcon color="primary" />
            <Typography variant="h5">Templates de Documents</Typography>
          </Box>
          {actionButtons}
        </Box>
      )}

      {!showTitle && (
        <Box display="flex" justifyContent="flex-end" gap={1} mb={2}>{actionButtons}</Box>
      )}

      <Paper sx={{ p: 3 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : templates.length === 0 ? (
          <Alert severity="info">Aucun template configuré. Initialisez les templates par défaut.</Alert>
        ) : (
          Object.entries(templatesByType).map(([type, typeTemplates]) => (
            <Box key={type} mb={3}>
              <Typography variant="h6" color="primary" gutterBottom>
                {getTypeLabel(type)}
              </Typography>
              <List>
                {typeTemplates.map((template, index) => (
                  <React.Fragment key={template.id}>
                    {index > 0 && <Divider />}
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            {template.libelle}
                            {template.est_systeme_defaut && (
                              <Tooltip title="Template par défaut">
                                <StarIcon color="warning" fontSize="small" />
                              </Tooltip>
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              Code: {template.code}
                            </Typography>
                            <Box display="flex" gap={1} mt={0.5}>
                              <Chip label={template.format_papier} size="small" variant="outlined" />
                              <Chip label={template.orientation} size="small" variant="outlined" />
                            </Box>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Export PDF">
                          <IconButton onClick={() => handleExportPdf(template)}>
                            <PdfIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Modifier">
                          {canUpdate && (
                            <IconButton onClick={() => handleOpenDialog(template)}>
                              <EditIcon />
                            </IconButton>
                          )}
                        </Tooltip>
                        {canDelete && !template.est_systeme_defaut && (
                          <Tooltip title="Supprimer">
                            <IconButton color="error" onClick={() => handleDelete(template.id)}>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </ListItemSecondaryAction>
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </Box>
          ))
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>{editingTemplate ? 'Modifier le template' : 'Nouveau template'}</DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <TemplateEditor
              template={editingTemplate}
              variables={variables}
              onSave={handleSave}
              onPreview={editingTemplate ? handlePreview : undefined}
            />
          </Box>
        </DialogContent>
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

export default TemplatesManagement;
