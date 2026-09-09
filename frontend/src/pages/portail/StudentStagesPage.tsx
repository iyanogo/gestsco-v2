import React, { useEffect, useState } from 'react';
import { Alert, Badge, Col, Modal, Row, Spinner } from 'react-bootstrap';
import { PageHeader } from '../../components/layouts';
import { CardStage } from '../../components/stages';
import portalService from '../../services/portalService';
import type { Stage } from '../../types/anneeAcademique';

const StudentStagesPage: React.FC = () => {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Stage | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await portalService.getMesStages();
        setStages(data);
      } catch (err: unknown) {
        const message =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
            : null;
        setError(typeof message === 'string' ? message : 'Impossible de charger vos stages.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="fade-in">
      <PageHeader
        title="Mon stage"
        subtitle="Suivi de vos stages et soutenances"
        breadcrumbs={[
          { label: 'Tableau de bord', path: '/etudiant/dashboard' },
          { label: 'Mon stage' },
        ]}
      />

      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      )}

      {error && <Alert variant="warning">{error}</Alert>}

      {!loading && !error && stages.length === 0 && (
        <Alert variant="secondary" className="text-center">
          Aucun stage enregistré pour votre dossier.
        </Alert>
      )}

      {!loading && !error && stages.length > 0 && (
        <Row className="g-4">
          {stages.map((stage) => (
            <Col md={6} lg={4} key={stage.id}>
              <CardStage
                stage={stage}
                onView={() => setSelected(stage)}
              />
            </Col>
          ))}
        </Row>
      )}

      <Modal show={!!selected} onHide={() => setSelected(null)} size="lg">
        {selected && (
          <>
            <Modal.Header closeButton>
              <Modal.Title>Stage {selected.code}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p className="text-muted mb-3">{selected.theme}</p>
              <Row className="g-3">
                <Col md={6}>
                  <strong>Entreprise</strong>
                  <p className="mb-0">{selected.entreprise_nom}</p>
                  {selected.entreprise_adresse && (
                    <small className="text-muted d-block">{selected.entreprise_adresse}</small>
                  )}
                </Col>
                <Col md={6}>
                  <strong>Maître de stage</strong>
                  <p className="mb-0">{selected.maitre_stage_nom}</p>
                </Col>
                <Col md={6}>
                  <strong>Période</strong>
                  <p className="mb-0">
                    {new Date(selected.date_debut).toLocaleDateString('fr-FR')}
                    {' → '}
                    {new Date(selected.date_fin).toLocaleDateString('fr-FR')}
                  </p>
                </Col>
                <Col md={6}>
                  <strong>Statut</strong>
                  <div>
                    <Badge bg={selected.statut === 'valide' ? 'success' : 'secondary'}>
                      {selected.statut}
                    </Badge>
                  </div>
                </Col>
                {selected.objectifs && (
                  <Col md={12}>
                    <strong>Objectifs</strong>
                    <p className="mb-0">{selected.objectifs}</p>
                  </Col>
                )}
                {(selected.note_finale != null) && (
                  <Col md={12}>
                    <div className="p-3 bg-light rounded">
                      <Row>
                        <Col xs={4} className="text-center">
                          <small className="text-muted">Entreprise</small>
                          <div className="fw-bold">{selected.note_entreprise ?? '-'}/20</div>
                        </Col>
                        <Col xs={4} className="text-center">
                          <small className="text-muted">Rapport</small>
                          <div className="fw-bold">{selected.note_rapport ?? '-'}/20</div>
                        </Col>
                        <Col xs={4} className="text-center">
                          <small className="text-muted">Finale</small>
                          <div className="fw-bold text-primary">{selected.note_finale}/20</div>
                        </Col>
                      </Row>
                    </div>
                  </Col>
                )}
              </Row>
            </Modal.Body>
          </>
        )}
      </Modal>
    </div>
  );
};

export default StudentStagesPage;
