import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import { 
  People, 
  ClipboardData, 
  CurrencyDollar, 
  Trophy 
} from 'react-bootstrap-icons';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { AnneeAcademique } from '../../types/anneeAcademique';

interface StatistiquesAnneeProps {
  annee: AnneeAcademique;
  statistiques?: {
    nbEtudiants: number;
    nbInscriptions: number;
    montantFacture: number;
    tauxReussite: number;
    evolutionInscriptions?: { mois: string; inscriptions: number }[];
    repartitionFilieres?: { filiere: string; nombre: number }[];
    tauxReussiteParNiveau?: { niveau: string; taux: number }[];
    situationFinanciere?: { paye: number; impaye: number };
  };
}

const StatistiquesAnnee: React.FC<StatistiquesAnneeProps> = ({
  statistiques
}) => {
  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      notation: 'compact'
    }).format(montant);
  };

  const COLORS = ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#6f42c1', '#0dcaf0'];

  const defaultEvolutionInscriptions = [
    { mois: 'Sept', inscriptions: 150 },
    { mois: 'Oct', inscriptions: 320 },
    { mois: 'Nov', inscriptions: 180 },
    { mois: 'Déc', inscriptions: 90 },
    { mois: 'Jan', inscriptions: 45 },
    { mois: 'Fév', inscriptions: 25 }
  ];

  const defaultRepartitionFilieres = [
    { filiere: 'Informatique', nombre: 250 },
    { filiere: 'Gestion', nombre: 180 },
    { filiere: 'Droit', nombre: 150 },
    { filiere: 'Économie', nombre: 120 },
    { filiere: 'Autres', nombre: 100 }
  ];

  const defaultTauxReussiteParNiveau = [
    { niveau: 'L1', taux: 65 },
    { niveau: 'L2', taux: 78 },
    { niveau: 'L3', taux: 85 },
    { niveau: 'M1', taux: 88 },
    { niveau: 'M2', taux: 92 }
  ];

  const evolutionData = statistiques?.evolutionInscriptions || defaultEvolutionInscriptions;
  const repartitionData = statistiques?.repartitionFilieres || defaultRepartitionFilieres;
  const tauxReussiteData = statistiques?.tauxReussiteParNiveau || defaultTauxReussiteParNiveau;
  const situationFinanciere = statistiques?.situationFinanciere || { paye: 75, impaye: 25 };

  return (
    <div className="statistiques-annee">
      {/* StatCards */}
      <Row className="g-3 mb-4">
        <Col xs={6} lg={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="rounded-circle bg-primary bg-opacity-10 p-3 d-inline-flex mb-2">
                <People className="text-primary" size={24} />
              </div>
              <h3 className="mb-1">{statistiques?.nbEtudiants || 0}</h3>
              <p className="text-muted mb-0 small">Étudiants inscrits</p>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} lg={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="rounded-circle bg-success bg-opacity-10 p-3 d-inline-flex mb-2">
                <ClipboardData className="text-success" size={24} />
              </div>
              <h3 className="mb-1">{statistiques?.nbInscriptions || 0}</h3>
              <p className="text-muted mb-0 small">Inscriptions totales</p>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} lg={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="rounded-circle bg-warning bg-opacity-10 p-3 d-inline-flex mb-2">
                <CurrencyDollar className="text-warning" size={24} />
              </div>
              <h3 className="mb-1">{formatMontant(statistiques?.montantFacture || 0)}</h3>
              <p className="text-muted mb-0 small">Montant facturé</p>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} lg={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="rounded-circle bg-info bg-opacity-10 p-3 d-inline-flex mb-2">
                <Trophy className="text-info" size={24} />
              </div>
              <h3 className="mb-1">{statistiques?.tauxReussite || 0}%</h3>
              <p className="text-muted mb-0 small">Taux de réussite</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Graphiques */}
      <Row className="g-3">
        {/* Évolution des inscriptions */}
        <Col lg={6}>
          <Card className="h-100 shadow-sm">
            <Card.Header className="bg-white">
              <h6 className="mb-0">Évolution des inscriptions</h6>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="inscriptions" 
                    stroke="#0d6efd" 
                    strokeWidth={2}
                    dot={{ fill: '#0d6efd' }}
                    name="Inscriptions"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        {/* Répartition par filière */}
        <Col lg={6}>
          <Card className="h-100 shadow-sm">
            <Card.Header className="bg-white">
              <h6 className="mb-0">Répartition par filière</h6>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={repartitionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="nombre"
                    nameKey="filiere"
                    label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} (${((percent || 0) * 100).toFixed(0)}%)`}
                  >
                    {repartitionData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        {/* Taux de réussite par niveau */}
        <Col lg={6}>
          <Card className="h-100 shadow-sm">
            <Card.Header className="bg-white">
              <h6 className="mb-0">Taux de réussite par niveau</h6>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={tauxReussiteData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="niveau" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                  <Bar 
                    dataKey="taux" 
                    fill="#198754" 
                    name="Taux de réussite"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        {/* Situation financière */}
        <Col lg={6}>
          <Card className="h-100 shadow-sm">
            <Card.Header className="bg-white">
              <h6 className="mb-0">Situation financière</h6>
            </Card.Header>
            <Card.Body className="d-flex flex-column justify-content-center">
              <div className="text-center mb-3">
                <h2 className="text-success mb-0">{situationFinanciere.paye}%</h2>
                <p className="text-muted">Taux de recouvrement</p>
              </div>
              <div className="progress" style={{ height: '30px' }}>
                <div 
                  className="progress-bar bg-success" 
                  style={{ width: `${situationFinanciere.paye}%` }}
                >
                  Payé ({situationFinanciere.paye}%)
                </div>
                <div 
                  className="progress-bar bg-danger" 
                  style={{ width: `${situationFinanciere.impaye}%` }}
                >
                  Impayé ({situationFinanciere.impaye}%)
                </div>
              </div>
              <div className="d-flex justify-content-between mt-3">
                <div>
                  <span className="badge bg-success me-2">●</span>
                  <span className="text-muted">Montant payé</span>
                </div>
                <div>
                  <span className="badge bg-danger me-2">●</span>
                  <span className="text-muted">Montant impayé</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StatistiquesAnnee;
