import React from 'react';
import { Card, Alert, Table, Badge, Button } from 'react-bootstrap';
import { CheckCircle, XCircle, Download, Clock } from 'react-bootstrap-icons';

interface ElementReconduction {
  id: string;
  label: string;
  nombreCopie: number;
  duree: number;
  statut: 'succes' | 'erreur' | 'ignore';
  erreur?: string;
}

interface RapportReconductionProps {
  rapport: {
    elements: ElementReconduction[];
    dureeTotale: number;
    erreurs?: string[];
  };
  onClose?: () => void;
}

const RapportReconduction: React.FC<RapportReconductionProps> = ({
  rapport,
  onClose
}) => {
  const totalCopie = rapport.elements.reduce((sum, e) => sum + e.nombreCopie, 0);
  const elementsReussis = rapport.elements.filter(e => e.statut === 'succes').length;
  const tauxReussite = Math.round((elementsReussis / rapport.elements.length) * 100);

  const getStatutIcon = (statut: ElementReconduction['statut']) => {
    switch (statut) {
      case 'succes':
        return <CheckCircle className="text-success" />;
      case 'erreur':
        return <XCircle className="text-danger" />;
      case 'ignore':
        return <Clock className="text-secondary" />;
    }
  };

  const getStatutBadge = (statut: ElementReconduction['statut']) => {
    switch (statut) {
      case 'succes':
        return <Badge bg="success">Succès</Badge>;
      case 'erreur':
        return <Badge bg="danger">Erreur</Badge>;
      case 'ignore':
        return <Badge bg="secondary">Ignoré</Badge>;
    }
  };

  const formatDuree = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const hasErrors = rapport.erreurs && rapport.erreurs.length > 0;

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <span className="fw-bold">Rapport de reconduction</span>
        {onClose && (
          <Button variant="close" onClick={onClose} aria-label="Fermer" />
        )}
      </Card.Header>
      
      <Card.Body>
        <Alert variant="success" className="mb-3">
          <CheckCircle className="me-2" />
          <strong>Reconduction terminée avec succès !</strong>
        </Alert>

        <Table responsive striped className="mb-3">
          <thead>
            <tr>
              <th>Élément</th>
              <th className="text-center">Nombre copié</th>
              <th className="text-center">Durée</th>
              <th className="text-center">Statut</th>
            </tr>
          </thead>
          <tbody>
            {rapport.elements.map(element => (
              <tr key={element.id}>
                <td>
                  <div className="d-flex align-items-center">
                    {getStatutIcon(element.statut)}
                    <span className="ms-2">{element.label}</span>
                  </div>
                  {element.erreur && (
                    <small className="text-danger d-block ms-4">
                      {element.erreur}
                    </small>
                  )}
                </td>
                <td className="text-center">{element.nombreCopie}</td>
                <td className="text-center">{formatDuree(element.duree)}</td>
                <td className="text-center">{getStatutBadge(element.statut)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="table-light fw-bold">
              <td>Total</td>
              <td className="text-center">{totalCopie}</td>
              <td className="text-center">{formatDuree(rapport.dureeTotale)}</td>
              <td></td>
            </tr>
          </tfoot>
        </Table>

        {hasErrors && (
          <Alert variant="warning" className="mb-3">
            <strong>Erreurs rencontrées :</strong>
            <ul className="mb-0 mt-2">
              {rapport.erreurs!.map((erreur, index) => (
                <li key={index}>{erreur}</li>
              ))}
            </ul>
          </Alert>
        )}

        <div className="bg-light p-3 rounded">
          <h6 className="mb-3">Statistiques</h6>
          <div className="row">
            <div className="col-md-4">
              <div className="text-muted small">Durée totale</div>
              <div className="fw-bold">{formatDuree(rapport.dureeTotale)}</div>
            </div>
            <div className="col-md-4">
              <div className="text-muted small">Éléments copiés</div>
              <div className="fw-bold">{totalCopie}</div>
            </div>
            <div className="col-md-4">
              <div className="text-muted small">Taux de réussite</div>
              <div className="fw-bold">{tauxReussite}%</div>
            </div>
          </div>
        </div>
      </Card.Body>

      <Card.Footer className="bg-white">
        <Button variant="outline-primary" size="sm">
          <Download className="me-1" /> Télécharger rapport PDF
        </Button>
        {onClose && (
          <Button variant="secondary" size="sm" className="ms-2" onClick={onClose}>
            Fermer
          </Button>
        )}
      </Card.Footer>
    </Card>
  );
};

export default RapportReconduction;
