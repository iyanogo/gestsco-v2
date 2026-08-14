/**
 * Page de configuration des délibérations.
 * Paramétrage des règles de validation par niveau et année académique.
 */

import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form, Alert, InputGroup } from 'react-bootstrap';
import { PageHeader } from '../../components/layouts';
import { anneeAcademiqueService } from '../../services/anneeAcademiqueService';
import api from '../../services/api';
import type { AnneeAcademique } from '../../types/anneeAcademique';
import type { ConfigurationDeliberation, CreateConfigurationDeliberation } from '../../types/anneeAcademique';

const ConfigurationDeliberationPage: React.FC = () => {
  const [annees, setAnnees] = useState<AnneeAcademique[]>([]);
  const [niveaux, setNiveaux] = useState<{ id: number; libelle: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Sélection
  const [selectedAnneeId, setSelectedAnneeId] = useState<number | null>(null);
  const [selectedNiveauId, setSelectedNiveauId] = useState<number | null>(null);
  
  // Configuration
  const [config, setConfig] = useState<CreateConfigurationDeliberation>({
    annee_academique_id: 0,
    niveau_id: undefined,
    periodicite: 'semestrielle',
    compensation_semestres: true,
    note_eliminatoire: undefined,
    nombre_matieres_dette_max: 2,
    moyenne_validation: 10,
    moyenne_passage_conditionnel: 8,
    credits_min_passage: undefined,
    taux_presence_min: 75,
    autoriser_rattrapage: true,
    nombre_sessions_max: 2,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedAnneeId && selectedNiveauId !== undefined) {
      loadConfiguration();
    }
  }, [selectedAnneeId, selectedNiveauId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [anneesData, niveauxData] = await Promise.all([
        anneeAcademiqueService.getAnnees(),
        api.get('/api/v1/niveaux/').then(res => res.data),
      ]);
      setAnnees(anneesData);
      setNiveaux(niveauxData);
      
      if (anneesData.length > 0) {
        const anneeCourante = anneesData.find(a => a.is_current) || anneesData[0];
        setSelectedAnneeId(anneeCourante.id);
      }
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      setError('Impossible de charger les données.');
    } finally {
      setLoading(false);
    }
  };

  const loadConfiguration = async () => {
    if (!selectedAnneeId) return;
    
    try {
      const params: Record<string, number | undefined> = {
        annee_academique_id: selectedAnneeId,
      };
      if (selectedNiveauId) {
        params.niveau_id = selectedNiveauId;
      }
      
      const response = await api.get('/api/v1/configurations-deliberation/', { params });
      const configs: ConfigurationDeliberation[] = response.data;
      
      // Chercher la config spécifique ou globale
      const configTrouvee = configs.find(c => 
        c.annee_academique_id === selectedAnneeId && 
        c.niveau_id === (selectedNiveauId || null)
      );
      
      if (configTrouvee) {
        setConfig({
          annee_academique_id: configTrouvee.annee_academique_id,
          niveau_id: configTrouvee.niveau_id || undefined,
          periodicite: configTrouvee.periodicite,
          compensation_semestres: configTrouvee.compensation_semestres,
          note_eliminatoire: configTrouvee.note_eliminatoire || undefined,
          nombre_matieres_dette_max: configTrouvee.nombre_matieres_dette_max || undefined,
          moyenne_validation: configTrouvee.moyenne_validation,
          moyenne_passage_conditionnel: configTrouvee.moyenne_passage_conditionnel || undefined,
          credits_min_passage: configTrouvee.credits_min_passage || undefined,
          taux_presence_min: configTrouvee.taux_presence_min || undefined,
          autoriser_rattrapage: configTrouvee.autoriser_rattrapage,
          nombre_sessions_max: configTrouvee.nombre_sessions_max,
        });
      } else {
        // Réinitialiser avec les valeurs par défaut
        setConfig(prev => ({
          ...prev,
          annee_academique_id: selectedAnneeId,
          niveau_id: selectedNiveauId || undefined,
        }));
      }
    } catch (err) {
      console.error('Erreur lors du chargement de la configuration:', err);
    }
  };

  const handleSave = async () => {
    if (!selectedAnneeId) {
      setError('Veuillez sélectionner une année académique.');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      const dataToSave = {
        ...config,
        annee_academique_id: selectedAnneeId,
        niveau_id: selectedNiveauId || null,
      };
      
      await api.post('/api/v1/configurations-deliberation/', dataToSave);
      setSuccess('Configuration enregistrée avec succès.');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDupliquer = async () => {
    // TODO: Implémenter la duplication vers d'autres niveaux
    setSuccess('Fonctionnalité de duplication à venir.');
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      
      <PageHeader
        title="Configuration des Délibérations"
        subtitle="Paramétrage des règles de validation et compensation"
        breadcrumbs={[
          { label: 'Administration', path: '/admin' },
          { label: 'Configuration Délibérations' }
        ]}
      />

      {/* Sélection */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Année académique</Form.Label>
                <Form.Select
                  value={selectedAnneeId || ''}
                  onChange={(e) => setSelectedAnneeId(Number(e.target.value) || null)}
                >
                  <option value="">Sélectionner une année</option>
                  {annees.map(annee => (
                    <option key={annee.id} value={annee.id}>
                      {annee.libelle} {annee.is_current && '(en cours)'}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Niveau (optionnel)</Form.Label>
                <Form.Select
                  value={selectedNiveauId || ''}
                  onChange={(e) => setSelectedNiveauId(Number(e.target.value) || null)}
                >
                  <option value="">Configuration globale</option>
                  {niveaux.map(niveau => (
                    <option key={niveau.id} value={niveau.id}>
                      {niveau.libelle}
                    </option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted">
                  Laissez vide pour une configuration globale applicable à tous les niveaux.
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Formulaire de configuration */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">Paramètres de délibération</h5>
        </Card.Header>
        <Card.Body>
          <Row className="g-4">
            {/* Périodicité */}
            <Col md={6}>
              <Form.Group>
                <Form.Label>Périodicité des délibérations</Form.Label>
                <div>
                  <Form.Check
                    inline
                    type="radio"
                    id="periodicite-semestrielle"
                    label="Semestrielle"
                    name="periodicite"
                    checked={config.periodicite === 'semestrielle'}
                    onChange={() => setConfig({ ...config, periodicite: 'semestrielle' })}
                  />
                  <Form.Check
                    inline
                    type="radio"
                    id="periodicite-annuelle"
                    label="Annuelle"
                    name="periodicite"
                    checked={config.periodicite === 'annuelle'}
                    onChange={() => setConfig({ ...config, periodicite: 'annuelle' })}
                  />
                </div>
                <Form.Text className="text-muted">
                  Semestrielle : délibération à chaque fin de semestre. Annuelle : délibération uniquement en fin d'année.
                </Form.Text>
              </Form.Group>
            </Col>

            {/* Compensation */}
            <Col md={6}>
              <Form.Group>
                <Form.Check
                  type="checkbox"
                  id="compensation"
                  label="Compensation des semestres"
                  checked={config.compensation_semestres}
                  onChange={(e) => setConfig({ ...config, compensation_semestres: e.target.checked })}
                />
                <Form.Text className="text-muted">
                  Si activé, les moyennes des deux semestres peuvent se compenser pour valider l'année.
                </Form.Text>
              </Form.Group>
            </Col>

            {/* Note éliminatoire */}
            <Col md={4}>
              <Form.Group>
                <Form.Label>Note éliminatoire</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="number"
                    step="0.5"
                    min="0"
                    max="20"
                    value={config.note_eliminatoire || ''}
                    onChange={(e) => setConfig({ 
                      ...config, 
                      note_eliminatoire: e.target.value ? Number(e.target.value) : undefined 
                    })}
                    placeholder="Non définie"
                  />
                  <InputGroup.Text>/20</InputGroup.Text>
                </InputGroup>
                <Form.Text className="text-muted">
                  Note en dessous de laquelle l'étudiant est éliminé.
                </Form.Text>
              </Form.Group>
            </Col>

            {/* Matières en dette */}
            <Col md={4}>
              <Form.Group>
                <Form.Label>Nombre max de matières en dette</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  max="10"
                  value={config.nombre_matieres_dette_max || ''}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    nombre_matieres_dette_max: e.target.value ? Number(e.target.value) : undefined 
                  })}
                />
              </Form.Group>
            </Col>

            {/* Moyenne de validation */}
            <Col md={4}>
              <Form.Group>
                <Form.Label>Moyenne de validation *</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="number"
                    step="0.5"
                    min="0"
                    max="20"
                    value={config.moyenne_validation}
                    onChange={(e) => setConfig({ ...config, moyenne_validation: Number(e.target.value) })}
                    required
                  />
                  <InputGroup.Text>/20</InputGroup.Text>
                </InputGroup>
                <Form.Text className="text-muted">
                  Moyenne requise pour valider le semestre/année.
                </Form.Text>
              </Form.Group>
            </Col>

            {/* Moyenne passage conditionnel */}
            <Col md={4}>
              <Form.Group>
                <Form.Label>Moyenne de passage conditionnel</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="number"
                    step="0.5"
                    min="0"
                    max="20"
                    value={config.moyenne_passage_conditionnel || ''}
                    onChange={(e) => setConfig({ 
                      ...config, 
                      moyenne_passage_conditionnel: e.target.value ? Number(e.target.value) : undefined 
                    })}
                    placeholder="Non définie"
                  />
                  <InputGroup.Text>/20</InputGroup.Text>
                </InputGroup>
              </Form.Group>
            </Col>

            {/* Crédits min */}
            <Col md={4}>
              <Form.Group>
                <Form.Label>Crédits minimum pour passage</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  max="60"
                  value={config.credits_min_passage || ''}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    credits_min_passage: e.target.value ? Number(e.target.value) : undefined 
                  })}
                  placeholder="Non défini"
                />
              </Form.Group>
            </Col>

            {/* Taux de présence */}
            <Col md={4}>
              <Form.Group>
                <Form.Label>Taux de présence minimum</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="number"
                    step="5"
                    min="0"
                    max="100"
                    value={config.taux_presence_min || ''}
                    onChange={(e) => setConfig({ 
                      ...config, 
                      taux_presence_min: e.target.value ? Number(e.target.value) : undefined 
                    })}
                    placeholder="Non défini"
                  />
                  <InputGroup.Text>%</InputGroup.Text>
                </InputGroup>
              </Form.Group>
            </Col>

            {/* Rattrapage */}
            <Col md={6}>
              <Form.Group>
                <Form.Check
                  type="checkbox"
                  id="rattrapage"
                  label="Autoriser le rattrapage"
                  checked={config.autoriser_rattrapage}
                  onChange={(e) => setConfig({ ...config, autoriser_rattrapage: e.target.checked })}
                />
              </Form.Group>
            </Col>

            {/* Nombre de sessions */}
            <Col md={6}>
              <Form.Group>
                <Form.Label>Nombre de sessions maximum</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  max="5"
                  value={config.nombre_sessions_max}
                  onChange={(e) => setConfig({ ...config, nombre_sessions_max: Number(e.target.value) })}
                />
                <Form.Text className="text-muted">
                  Nombre maximum de sessions d'examen (normale + rattrapages).
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
        <Card.Footer className="d-flex justify-content-between">
          <Button variant="outline-secondary" onClick={handleDupliquer}>
            <i className="bi bi-files me-2"></i>
            Dupliquer vers d'autres niveaux
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || !selectedAnneeId}>
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Enregistrement...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg me-2"></i>
                Enregistrer
              </>
            )}
          </Button>
        </Card.Footer>
      </Card>
    </div>
  );
};

export default ConfigurationDeliberationPage;
