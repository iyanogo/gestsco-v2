import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Form, Nav, Row, Table } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../components/layouts';
import { usePermissions } from '../../../hooks/usePermissions';
import { getEtudiants } from '../../../services/etudiantService';
import anneeAcademiqueService from '../../../services/anneeAcademiqueService';
import { factureService } from '../../../services/factureService';
import type { CreateLigneFacture } from '../../../types/finance';
import type { Etudiant } from '../../../types/etudiant';
import type { AnneeAcademique } from '../../../types/anneeAcademique';

const TYPE_FACTURE = [
  { value: 'inscription', label: 'Inscription' },
  { value: 'scolarite', label: 'Scolarité' },
  { value: 'examen', label: 'Examen' },
  { value: 'autre', label: 'Autre' },
];

const defaultDateEcheance = (): string => {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().slice(0, 10);
};

const emptyLigne = (): CreateLigneFacture => ({
  libelle: '',
  quantite: 1,
  prix_unitaire: 0,
  tva_taux: 0,
});

const formatEtudiantLabel = (etudiant: Etudiant): string => {
  const nom = `${etudiant.nom || ''} ${etudiant.prenom || ''}`.trim();
  const matricule = etudiant.matricule ? ` (${etudiant.matricule})` : '';
  return `${nom || `Étudiant #${etudiant.id}`}${matricule}`;
};

const extractErrorMessage = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
    if (typeof detail === 'string') {
      return detail;
    }
  }
  return fallback;
};

const NouvelleFacturePage: React.FC = () => {
  const navigate = useNavigate();
  const { moduleActions } = usePermissions();
  const { canCreate } = moduleActions('finances');

  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [etudiants, setEtudiants] = useState<Etudiant[]>([]);
  const [annees, setAnnees] = useState<AnneeAcademique[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [etudiantId, setEtudiantId] = useState('');
  const [anneeId, setAnneeId] = useState('');
  const [typeFacture, setTypeFacture] = useState('scolarite');
  const [dateEcheance, setDateEcheance] = useState(defaultDateEcheance());
  const [description, setDescription] = useState('');
  const [observations, setObservations] = useState('');
  const [lignes, setLignes] = useState<CreateLigneFacture[]>([emptyLigne()]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [etudiantsData, anneesData, currentAnnee] = await Promise.all([
          getEtudiants({ limit: 500 }),
          anneeAcademiqueService.getAnnees({ limit: 100 }),
          anneeAcademiqueService.getCurrentAnnee().catch(() => null),
        ]);
        setEtudiants(etudiantsData);
        setAnnees(anneesData);
        if (currentAnnee) {
          setAnneeId(String(currentAnnee.id));
        } else if (anneesData.length > 0) {
          setAnneeId(String(anneesData[0].id));
        }
      } catch {
        setError('Impossible de charger les données nécessaires à la création de facture.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const etudiantsSorted = useMemo(
    () =>
      [...etudiants].sort((a, b) =>
        formatEtudiantLabel(a).localeCompare(formatEtudiantLabel(b), 'fr')
      ),
    [etudiants]
  );

  const totalManuel = useMemo(
    () =>
      lignes.reduce((sum, ligne) => {
        const quantite = ligne.quantite ?? 1;
        const prix = ligne.prix_unitaire ?? 0;
        const tva = ligne.tva_taux ?? 0;
        const ht = quantite * prix;
        return sum + ht + ht * (tva / 100);
      }, 0),
    [lignes]
  );

  const updateLigne = (index: number, patch: Partial<CreateLigneFacture>) => {
    setLignes((prev) => prev.map((ligne, i) => (i === index ? { ...ligne, ...patch } : ligne)));
  };

  const addLigne = () => {
    setLignes((prev) => [...prev, emptyLigne()]);
  };

  const removeLigne = (index: number) => {
    setLignes((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const validateCommonFields = (): string | null => {
    if (!etudiantId) {
      return 'Sélectionnez un étudiant.';
    }
    if (!anneeId) {
      return 'Sélectionnez une année académique.';
    }
    return null;
  };

  const handleSubmitAuto = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const validationError = validateCommonFields();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const facture = await factureService.genererFactureAutomatique(
        Number(etudiantId),
        Number(anneeId),
        typeFacture
      );
      navigate('/admin/finances/factures', {
        state: { successMessage: `Facture ${facture.numero_facture} créée avec succès.` },
      });
    } catch (err: unknown) {
      setError(
        extractErrorMessage(
          err,
          'Impossible de générer la facture automatiquement. Vérifiez les frais configurés.'
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitManual = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const validationError = validateCommonFields();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!dateEcheance) {
      setError('Indiquez une date d\'échéance.');
      return;
    }

    const lignesValides = lignes.filter(
      (ligne) => ligne.libelle.trim() && (ligne.prix_unitaire ?? 0) > 0
    );
    if (lignesValides.length === 0) {
      setError('Ajoutez au moins une ligne avec un libellé et un montant.');
      return;
    }

    setSubmitting(true);
    try {
      const facture = await factureService.createFacture({
        etudiant_id: Number(etudiantId),
        annee_academique_id: Number(anneeId),
        date_echeance: dateEcheance,
        type_facture: typeFacture,
        description: description.trim() || undefined,
        observations: observations.trim() || undefined,
        lignes: lignesValides.map((ligne) => ({
          libelle: ligne.libelle.trim(),
          description: ligne.description?.trim() || undefined,
          quantite: ligne.quantite ?? 1,
          prix_unitaire: Number(ligne.prix_unitaire),
          tva_taux: ligne.tva_taux ?? 0,
          frais_scolarite_id: ligne.frais_scolarite_id,
        })),
      });
      navigate('/admin/finances/factures', {
        state: { successMessage: `Facture ${facture.numero_facture} créée avec succès.` },
      });
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Impossible de créer la facture.'));
    } finally {
      setSubmitting(false);
    }
  };

  const commonFields = (
    <Row className="g-3">
      <Col md={6}>
        <Form.Group>
          <Form.Label>Étudiant *</Form.Label>
          <Form.Select
            value={etudiantId}
            onChange={(e) => setEtudiantId(e.target.value)}
            disabled={loading || submitting}
            required
          >
            <option value="">Sélectionner un étudiant</option>
            {etudiantsSorted.map((etudiant) => (
              <option key={etudiant.id} value={etudiant.id}>
                {formatEtudiantLabel(etudiant)}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group>
          <Form.Label>Année académique *</Form.Label>
          <Form.Select
            value={anneeId}
            onChange={(e) => setAnneeId(e.target.value)}
            disabled={loading || submitting}
            required
          >
            <option value="">Sélectionner une année</option>
            {annees.map((annee) => (
              <option key={annee.id} value={annee.id}>
                {annee.code} - {annee.libelle}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group>
          <Form.Label>Type de facture *</Form.Label>
          <Form.Select
            value={typeFacture}
            onChange={(e) => setTypeFacture(e.target.value)}
            disabled={submitting}
            required
          >
            {TYPE_FACTURE.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </Col>
    </Row>
  );

  return (
    <div className="fade-in">
      <PageHeader
        title="Nouvelle facture"
        subtitle="Création d'une facture étudiant"
        breadcrumbs={[
          { label: 'Finances', path: '/admin/finances/factures' },
          { label: 'Factures', path: '/admin/finances/factures' },
          { label: 'Nouvelle facture' },
        ]}
        actions={
          <Link to="/admin/finances/factures" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-2"></i>
            Retour à la liste
          </Link>
        }
      />

      {!canCreate && (
        <Alert variant="warning">
          Vous n&apos;avez pas la permission de créer des factures.
        </Alert>
      )}

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-4">
          <Nav variant="tabs" className="mb-4">
            <Nav.Item>
              <Nav.Link
                active={mode === 'auto'}
                onClick={() => setMode('auto')}
                style={{ cursor: 'pointer' }}
              >
                <i className="bi bi-magic me-2"></i>
                Depuis les frais configurés
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={mode === 'manual'}
                onClick={() => setMode('manual')}
                style={{ cursor: 'pointer' }}
              >
                <i className="bi bi-pencil-square me-2"></i>
                Saisie manuelle
              </Nav.Link>
            </Nav.Item>
          </Nav>

          {mode === 'auto' ? (
            <Form onSubmit={handleSubmitAuto}>
              <Alert variant="info" className="small">
                Génère automatiquement une facture à partir des frais de scolarité configurés
                pour le niveau et la filière de l&apos;étudiant.
              </Alert>
              {commonFields}
              <div className="d-flex justify-content-end gap-2 mt-4">
                <Link to="/admin/finances/factures" className="btn btn-outline-secondary">
                  Annuler
                </Link>
                <Button type="submit" variant="primary" disabled={!canCreate || loading || submitting}>
                  {submitting ? 'Génération…' : 'Générer la facture'}
                </Button>
              </div>
            </Form>
          ) : (
            <Form onSubmit={handleSubmitManual}>
              {commonFields}
              <Row className="g-3 mt-1">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Date d&apos;échéance *</Form.Label>
                    <Form.Control
                      type="date"
                      value={dateEcheance}
                      onChange={(e) => setDateEcheance(e.target.value)}
                      disabled={submitting}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={8}>
                  <Form.Group>
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={submitting}
                      placeholder="Objet de la facture"
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Observations</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      disabled={submitting}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-flex justify-content-between align-items-center mt-4 mb-2">
                <h6 className="mb-0">Lignes de facture</h6>
                <Button type="button" size="sm" variant="outline-primary" onClick={addLigne}>
                  <i className="bi bi-plus-lg me-1"></i>
                  Ajouter une ligne
                </Button>
              </div>

              <Table responsive bordered className="align-middle mb-3">
                <thead className="table-light">
                  <tr>
                    <th>Libellé</th>
                    <th style={{ width: '100px' }}>Qté</th>
                    <th style={{ width: '140px' }}>Prix unitaire</th>
                    <th style={{ width: '100px' }}>TVA %</th>
                    <th style={{ width: '60px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {lignes.map((ligne, index) => (
                    <tr key={index}>
                      <td>
                        <Form.Control
                          type="text"
                          value={ligne.libelle}
                          onChange={(e) => updateLigne(index, { libelle: e.target.value })}
                          disabled={submitting}
                          placeholder="Libellé"
                          required
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="number"
                          min={1}
                          value={ligne.quantite ?? 1}
                          onChange={(e) =>
                            updateLigne(index, { quantite: Number(e.target.value) || 1 })
                          }
                          disabled={submitting}
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="number"
                          min={0}
                          value={ligne.prix_unitaire}
                          onChange={(e) =>
                            updateLigne(index, { prix_unitaire: Number(e.target.value) || 0 })
                          }
                          disabled={submitting}
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="number"
                          min={0}
                          step={0.1}
                          value={ligne.tva_taux ?? 0}
                          onChange={(e) =>
                            updateLigne(index, { tva_taux: Number(e.target.value) || 0 })
                          }
                          disabled={submitting}
                        />
                      </td>
                      <td className="text-center">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline-danger"
                          onClick={() => removeLigne(index)}
                          disabled={submitting || lignes.length <= 1}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <div className="text-end fw-medium mb-3">
                Total TTC estimé : {totalManuel.toLocaleString('fr-FR')} FCFA
              </div>

              <div className="d-flex justify-content-end gap-2">
                <Link to="/admin/finances/factures" className="btn btn-outline-secondary">
                  Annuler
                </Link>
                <Button type="submit" variant="primary" disabled={!canCreate || loading || submitting}>
                  {submitting ? 'Création…' : 'Créer la facture'}
                </Button>
              </div>
            </Form>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default NouvelleFacturePage;
