/**
 * Page de gestion des soutenances.
 * Calendrier et liste des soutenances avec filtres.
 */

import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Badge, Form, Alert, Tab, Tabs } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layouts';
import { DataCard, DataTable, Column } from '../../components/ui';
import soutenanceService from '../../services/soutenanceService';
import type { Soutenance } from '../../types/anneeAcademique';
import { STATUTS_SOUTENANCE } from '../../types/anneeAcademique';

const SoutenancesPage: React.FC = () => {
  const navigate = useNavigate();
  const [soutenances, setSoutenances] = useState<Soutenance[]>([]);
  const [soutenancesAVenir, setSoutenancesAVenir] = useState<Soutenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatut, setFilterStatut] = useState<string>('');
  const [viewMode, setViewMode] = useState<'liste' | 'calendrier'>('liste');

  useEffect(() => {
    loadSoutenances();
  }, []);

  const loadSoutenances = async () => {
    setLoading(true);
    setError(null);
    try {
      const [all, aVenir] = await Promise.all([
        soutenanceService.getSoutenances(),
        soutenanceService.getSoutenancesAVenir(14),
      ]);
      setSoutenances(all);
      setSoutenancesAVenir(aVenir);
    } catch (err) {
      console.error('Erreur lors du chargement des soutenances:', err);
      setError('Impossible de charger les soutenances.');
    } finally {
      setLoading(false);
    }
  };

  const getStatutBadge = (statut: string) => {
    const statutInfo = STATUTS_SOUTENANCE.find(s => s.value === statut);
    const colors: Record<string, string> = {
      info: 'info',
      warning: 'warning',
      primary: 'primary',
      success: 'success',
    };
    return (
      <Badge bg={colors[statutInfo?.color || 'secondary'] || 'secondary'}>
        {statutInfo?.label || statut}
      </Badge>
    );
  };

  const columns: Column<Soutenance>[] = [
    { 
      key: 'date_soutenance', 
      header: 'Date',
      render: (item) => (
        <div>
          <div className="fw-bold">
            {new Date(item.date_soutenance).toLocaleDateString('fr-FR')}
          </div>
          <small className="text-muted">
            {new Date(item.date_soutenance).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </small>
        </div>
      )
    },
    { 
      key: 'stage_id', 
      header: 'Stage',
      render: (item) => <code>Stage #{item.stage_id}</code>
    },
    { 
      key: 'lieu', 
      header: 'Lieu'
    },
    { 
      key: 'duree_minutes', 
      header: 'Durée',
      render: (item) => `${item.duree_minutes} min`
    },
    { 
      key: 'president_jury_id', 
      header: 'Jury',
      render: (item) => (
        <div className="small">
          <div>Président: #{item.president_jury_id}</div>
          <div>Rapporteur: #{item.rapporteur_id}</div>
        </div>
      )
    },
    { 
      key: 'statut', 
      header: 'Statut',
      render: (item) => getStatutBadge(item.statut)
    },
    { 
      key: 'note_finale', 
      header: 'Note',
      render: (item) => item.note_finale ? (
        <Badge bg={Number(item.note_finale) >= 10 ? 'success' : 'danger'}>
          {item.note_finale}/20
        </Badge>
      ) : '-'
    },
    { 
      key: 'actions', 
      header: 'Actions', 
      width: '100px',
      render: (item) => (
        <div className="d-flex gap-1">
          <Button 
            size="sm" 
            variant="outline-primary"
            onClick={() => navigate(`/stages/${item.stage_id}`)}
          >
            <i className="bi bi-eye"></i>
          </Button>
        </div>
      )
    }
  ];

  const filteredSoutenances = soutenances.filter(s => 
    !filterStatut || s.statut === filterStatut
  );

  // Stats
  const stats = {
    total: soutenances.length,
    programmees: soutenances.filter(s => s.statut === 'programmee').length,
    terminees: soutenances.filter(s => s.statut === 'terminee').length,
    validees: soutenances.filter(s => s.statut === 'validee').length,
  };

  return (
    <div className="fade-in">
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <PageHeader
        title="Soutenances"
        subtitle="Calendrier et gestion des soutenances"
        breadcrumbs={[
          { label: 'Stages', path: '/stages' },
          { label: 'Soutenances' }
        ]}
        actions={
          <Button variant="outline-secondary" onClick={loadSoutenances}>
            <i className="bi bi-arrow-clockwise me-2"></i>
            Actualiser
          </Button>
        }
      />

      {/* Statistiques */}
      <Row className="g-3 mb-4">
        <Col sm={6} md={3}>
          <Card className="text-center h-100 border-primary">
            <Card.Body>
              <h3 className="mb-0 text-primary">{stats.total}</h3>
              <small className="text-muted">Total</small>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} md={3}>
          <Card className="text-center h-100 border-info">
            <Card.Body>
              <h3 className="mb-0 text-info">{stats.programmees}</h3>
              <small className="text-muted">Programmées</small>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} md={3}>
          <Card className="text-center h-100 border-warning">
            <Card.Body>
              <h3 className="mb-0 text-warning">{stats.terminees}</h3>
              <small className="text-muted">Terminées</small>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} md={3}>
          <Card className="text-center h-100 border-success">
            <Card.Body>
              <h3 className="mb-0 text-success">{stats.validees}</h3>
              <small className="text-muted">Validées</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Soutenances à venir */}
      {soutenancesAVenir.length > 0 && (
        <Card className="mb-4 border-warning">
          <Card.Header className="bg-warning bg-opacity-10">
            <i className="bi bi-calendar-event me-2"></i>
            Soutenances à venir (14 prochains jours)
          </Card.Header>
          <Card.Body>
            <Row className="g-3">
              {soutenancesAVenir.slice(0, 4).map(s => (
                <Col md={3} key={s.id}>
                  <Card 
                    className="h-100 cursor-pointer hover-shadow"
                    onClick={() => navigate(`/stages/${s.stage_id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <Badge bg="info">
                          {new Date(s.date_soutenance).toLocaleDateString('fr-FR')}
                        </Badge>
                        <small className="text-muted">
                          {new Date(s.date_soutenance).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </small>
                      </div>
                      <p className="mb-1"><strong>Stage #{s.stage_id}</strong></p>
                      <small className="text-muted">
                        <i className="bi bi-geo-alt me-1"></i>
                        {s.lieu}
                      </small>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Liste des soutenances */}
      <Tabs activeKey={viewMode} onSelect={(k) => setViewMode(k as 'liste' | 'calendrier')} className="mb-3">
        <Tab eventKey="liste" title={<><i className="bi bi-list me-1"></i>Liste</>}>
          <DataCard
            title={`Toutes les soutenances (${filteredSoutenances.length})`}
            actions={
              <Form.Select 
                size="sm" 
                style={{ width: '200px' }}
                value={filterStatut}
                onChange={(e) => setFilterStatut(e.target.value)}
              >
                <option value="">Tous les statuts</option>
                {STATUTS_SOUTENANCE.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Form.Select>
            }
          >
            <DataTable
              columns={columns}
              data={filteredSoutenances}
              loading={loading}
              emptyMessage="Aucune soutenance trouvée"
              onRowClick={(item) => navigate(`/stages/${item.stage_id}`)}
            />
          </DataCard>
        </Tab>
        
        <Tab eventKey="calendrier" title={<><i className="bi bi-calendar3 me-1"></i>Calendrier</>}>
          <Card>
            <Card.Body className="text-center py-5">
              <i className="bi bi-calendar3 fs-1 text-muted mb-3 d-block"></i>
              <p className="text-muted">
                Vue calendrier disponible dans une version ultérieure.
              </p>
              <p className="small text-muted">
                Utilisez la vue liste pour voir toutes les soutenances.
              </p>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
};

export default SoutenancesPage;
