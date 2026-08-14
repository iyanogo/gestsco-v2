import React, { useState } from 'react';
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Button,
  Typography,
  Paper,
  Tabs,
  Tab,
  Chip,
  Divider,
} from '@mui/material';
import {
  Preview as PreviewIcon,
  Code as CodeIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import {
  TemplateDocument,
  TemplateDocumentCreate,
  TemplateDocumentUpdate,
  TYPES_DOCUMENTS,
  FORMATS_PAPIER,
  ORIENTATIONS,
} from '../../types/parametrage';

interface TemplateEditorProps {
  template?: TemplateDocument;
  variables?: { nom: string; description: string }[];
  onSave: (data: TemplateDocumentCreate | TemplateDocumentUpdate) => void;
  onPreview?: (variables: Record<string, any>) => void;
  loading?: boolean;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  variables = [],
  onSave,
  onPreview,
  loading = false,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState<TemplateDocumentCreate>({
    code: template?.code || '',
    libelle: template?.libelle || '',
    type_document: template?.type_document || 'bulletin',
    description: template?.description || '',
    template_html: template?.template_html || '',
    template_css: template?.template_css || '',
    format_papier: template?.format_papier || 'A4',
    orientation: template?.orientation || 'portrait',
    en_tete_html: template?.en_tete_html || '',
    pied_page_html: template?.pied_page_html || '',
  });
  const [previewHtml, setPreviewHtml] = useState<string>('');

  const handleChange = (field: keyof TemplateDocumentCreate, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleInsertVariable = (variableName: string) => {
    const textarea = document.getElementById('template-html') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.template_html;
      const newText = text.substring(0, start) + `{{ ${variableName} }}` + text.substring(end);
      handleChange('template_html', newText);
    }
  };

  const handlePreview = () => {
    if (onPreview) {
      const testVariables: Record<string, any> = {};
      variables.forEach(v => {
        testVariables[v.nom] = `[${v.nom}]`;
      });
      onPreview(testVariables);
    }
    
    // Aperçu local
    let html = formData.template_html;
    variables.forEach(v => {
      const regex = new RegExp(`\\{\\{\\s*${v.nom}\\s*\\}\\}`, 'g');
      html = html.replace(regex, `<span style="background:#fff3cd;padding:2px 4px;">[${v.nom}]</span>`);
    });
    
    if (formData.template_css) {
      html = `<style>${formData.template_css}</style>${html}`;
    }
    
    setPreviewHtml(html);
    setActiveTab(1);
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Informations de base */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Code"
            value={formData.code}
            onChange={(e) => handleChange('code', e.target.value)}
            required
            disabled={!!template}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Libellé"
            value={formData.libelle}
            onChange={(e) => handleChange('libelle', e.target.value)}
            required
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            select
            label="Type de document"
            value={formData.type_document}
            onChange={(e) => handleChange('type_document', e.target.value)}
          >
            {TYPES_DOCUMENTS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            select
            label="Format papier"
            value={formData.format_papier}
            onChange={(e) => handleChange('format_papier', e.target.value)}
          >
            {FORMATS_PAPIER.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            select
            label="Orientation"
            value={formData.orientation}
            onChange={(e) => handleChange('orientation', e.target.value)}
          >
            {ORIENTATIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            multiline
            rows={2}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Variables disponibles */}
      {variables.length > 0 && (
        <Box mb={2}>
          <Typography variant="subtitle2" gutterBottom>
            Variables disponibles (cliquez pour insérer)
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {variables.map((v) => (
              <Chip
                key={v.nom}
                label={v.nom}
                size="small"
                onClick={() => handleInsertVariable(v.nom)}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Éditeur / Aperçu */}
      <Paper variant="outlined">
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab icon={<CodeIcon />} label="HTML" />
          <Tab icon={<PreviewIcon />} label="Aperçu" />
          <Tab label="CSS" />
        </Tabs>

        <Box p={2}>
          {activeTab === 0 && (
            <TextField
              id="template-html"
              fullWidth
              multiline
              rows={15}
              value={formData.template_html}
              onChange={(e) => handleChange('template_html', e.target.value)}
              placeholder="Entrez le code HTML du template..."
              sx={{ fontFamily: 'monospace' }}
            />
          )}

          {activeTab === 1 && (
            <Box
              sx={{
                minHeight: 400,
                border: '1px solid #ddd',
                p: 2,
                backgroundColor: '#fff',
              }}
            >
              {previewHtml ? (
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              ) : (
                <Typography color="text.secondary" textAlign="center">
                  Cliquez sur "Aperçu" pour voir le rendu
                </Typography>
              )}
            </Box>
          )}

          {activeTab === 2 && (
            <TextField
              fullWidth
              multiline
              rows={15}
              value={formData.template_css}
              onChange={(e) => handleChange('template_css', e.target.value)}
              placeholder="Entrez le CSS du template..."
              sx={{ fontFamily: 'monospace' }}
            />
          )}
        </Box>
      </Paper>

      <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
        <Button
          variant="outlined"
          startIcon={<PreviewIcon />}
          onClick={handlePreview}
        >
          Aperçu
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={loading}
        >
          Enregistrer
        </Button>
      </Box>
    </Box>
  );
};

export default TemplateEditor;
