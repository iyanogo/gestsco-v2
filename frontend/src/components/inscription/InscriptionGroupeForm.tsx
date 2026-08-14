/**
 * Composant pour l'inscription par groupe via fichier Excel
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider,
  Grid,
  SelectChangeEvent,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

import { inscriptionGroupeService, InscriptionGroupeResult } from '../../services/inscriptionGroupeService';
import { getFilieres } from '../../services/filiereService';
import { getNiveaux } from '../../services/niveauService';
import { Filiere, Niveau } from '../../types/reference';
import { useAnneeStore } from '../../store/anneeStore';

const InscriptionGroupeForm: React.FC = () => {
  const { selectedAnnee } = useAnneeStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [selectedFiliere, setSelectedFiliere] = useState<string>('');
  const [selectedNiveau, setSelectedNiveau] = useState<string>('');
  const [typeInscription, setTypeInscription] = useState<string>('nouvelle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InscriptionGroupeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [filieresData, niveauxData] = await Promise.all([
          getFilieres(),
          getNiveaux(),
        ]);
        setFilieres(filieresData);
        setNiveaux(niveauxData);
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
      }
    };
    loadData();
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        setError('Le fichier doit être au format Excel (.xlsx ou .xls)');
        return;
      }
      setSelectedFile(file);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedFiliere || !selectedNiveau || !selectedAnnee) {
      setError('Veuillez remplir tous les champs et sélectionner un fichier');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const uploadResult = await inscriptionGroupeService.uploadInscriptions(
        selectedFile,
        parseInt(selectedFiliere),
        parseInt(selectedNiveau),
        selectedAnnee,
        typeInscription
      );
      setResult(uploadResult);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'importation');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Créer un fichier Excel template
    const headers = ['Matricule', 'Nom', 'Prenom', 'Sexe', 'Telephone', 'Date de naissance', 'Lieu de naissance', 'Nationalite'];
    const exampleData = [
      ['0222-SG2-2022', 'GARANE', 'Nafissatou', 'Feminin', '64 26 86 36', '04/09/2000', 'Bobo-Dioulasso', 'Burkinabé'],
      ['', 'KABORE', 'Fadel Moustapha', 'Masculin', '63 33 44 27', '07/01/2001', 'Ouagadougou', 'Burkinabé'],
    ];

    // Créer le contenu CSV (compatible Excel)
    const csvContent = [
      headers.join(';'),
      ...exampleData.map(row => row.join(';'))
    ].join('\n');

    // Télécharger le fichier
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_inscription_groupe.csv';
    link.click();
  };

  const resetForm = () => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Inscription par groupe via fichier Excel
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Importez un fichier Excel contenant la liste des étudiants à inscrire.
          </Typography>

          {/* Format attendu */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Format du fichier Excel attendu :
            </Typography>
            <Typography variant="body2">
              Colonnes : <strong>Matricule</strong> (optionnel), <strong>Nom</strong>, <strong>Prenom</strong>, 
              <strong> Sexe</strong>, <strong>Telephone</strong>, <strong>Date de naissance</strong> (JJ/MM/AAAA), 
              <strong> Lieu de naissance</strong>, <strong>Nationalite</strong>
            </Typography>
          </Alert>

          <Grid container spacing={3}>
            {/* Sélection de la filière */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Filière *</InputLabel>
                <Select
                  value={selectedFiliere}
                  label="Filière *"
                  onChange={(e: SelectChangeEvent) => setSelectedFiliere(e.target.value)}
                >
                  {filieres.map((filiere) => (
                    <MenuItem key={filiere.id} value={filiere.id.toString()}>
                      {filiere.libelle}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Sélection du niveau */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Niveau *</InputLabel>
                <Select
                  value={selectedNiveau}
                  label="Niveau *"
                  onChange={(e: SelectChangeEvent) => setSelectedNiveau(e.target.value)}
                >
                  {niveaux.map((niveau) => (
                    <MenuItem key={niveau.id} value={niveau.id.toString()}>
                      {niveau.libelle}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Type d'inscription */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Type d'inscription</InputLabel>
                <Select
                  value={typeInscription}
                  label="Type d'inscription"
                  onChange={(e: SelectChangeEvent) => setTypeInscription(e.target.value)}
                >
                  <MenuItem value="nouvelle">Nouvelle inscription</MenuItem>
                  <MenuItem value="renouvellement">Renouvellement</MenuItem>
                  <MenuItem value="transfert">Transfert</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Zone de téléchargement */}
          <Box
            sx={{
              border: '2px dashed',
              borderColor: selectedFile ? 'success.main' : 'grey.400',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              bgcolor: selectedFile ? 'success.50' : 'grey.50',
              cursor: 'pointer',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'primary.50',
              },
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
            />
            {selectedFile ? (
              <>
                <SuccessIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                <Typography variant="h6" color="success.main">
                  {selectedFile.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Cliquez pour changer de fichier
                </Typography>
              </>
            ) : (
              <>
                <UploadIcon sx={{ fontSize: 48, color: 'grey.500', mb: 1 }} />
                <Typography variant="h6" color="text.secondary">
                  Cliquez ou glissez un fichier Excel ici
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Formats acceptés : .xlsx, .xls
                </Typography>
              </>
            )}
          </Box>

          {/* Boutons d'action */}
          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadTemplate}
            >
              Télécharger le modèle
            </Button>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {result && (
                <Button variant="outlined" onClick={resetForm}>
                  Nouvelle importation
                </Button>
              )}
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={handleUpload}
                disabled={!selectedFile || !selectedFiliere || !selectedNiveau || loading}
              >
                {loading ? 'Importation en cours...' : 'Importer'}
              </Button>
            </Box>
          </Box>

          {loading && <LinearProgress sx={{ mt: 2 }} />}
        </CardContent>
      </Card>

      {/* Erreur */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Résultats */}
      {result && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Résultat de l'importation
            </Typography>

            {/* Statistiques */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Chip
                icon={<InfoIcon />}
                label={`Total: ${result.total}`}
                color="default"
              />
              <Chip
                icon={<SuccessIcon />}
                label={`Réussis: ${result.success}`}
                color="success"
              />
              <Chip
                icon={<ErrorIcon />}
                label={`Erreurs: ${result.errors.length}`}
                color={result.errors.length > 0 ? 'error' : 'default'}
              />
            </Box>

            {/* Liste des étudiants créés */}
            {result.created_students.length > 0 && (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  Étudiants inscrits avec succès :
                </Typography>
                <TableContainer component={Paper} sx={{ mb: 3, maxHeight: 300 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Matricule</TableCell>
                        <TableCell>Nom</TableCell>
                        <TableCell>Prénom</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {result.created_students.map((student, index) => (
                        <TableRow key={index}>
                          <TableCell>{student.matricule}</TableCell>
                          <TableCell>{student.nom}</TableCell>
                          <TableCell>{student.prenom}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}

            {/* Liste des erreurs */}
            {result.errors.length > 0 && (
              <>
                <Typography variant="subtitle1" gutterBottom color="error">
                  Erreurs rencontrées :
                </Typography>
                <TableContainer component={Paper} sx={{ maxHeight: 200 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Ligne</TableCell>
                        <TableCell>Erreur</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {result.errors.map((err, index) => (
                        <TableRow key={index}>
                          <TableCell>{err.line}</TableCell>
                          <TableCell>{err.error}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default InscriptionGroupeForm;
