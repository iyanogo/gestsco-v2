import React from 'react';
import { Card, Badge, Button, Row, Col } from 'react-bootstrap';
import { 
  Calendar, 
  CalendarCheck, 
  People, 
  ClipboardData, 
  CurrencyDollar, 
  Trophy,
  PlayCircle,
  StopCircle,
  Archive,
  FileEarmarkText
} from 'react-bootstrap-icons';
import { AnneeAcademique } from '../../types/anneeAcademique';

interface CardAnneeAcademiqueProps {
  annee: AnneeAcademique;
  onAction: (action: string, annee: AnneeAcademique) => void;
  statistiques?: {
    nbEtudiants?: number;
    nbInscriptions?: number;
    montantFacture?: number;
    tauxReussite?: number;
  };
}

const CardAnneeAcademique: React.FC<CardAnneeAcademiqueProps> = ({
  annee,
  onAction,
  statistiques
}) => {
  const getStatutBadge = (statut: string) => {
    const config: Record<string, { bg: string; text: string }> = {
      brouillon: { bg: 'secondary', text: 'Brouillon' },
      ouverte: { bg: 'info', text: 'Ouverte' },
      en_cours: { bg: 'primary', text: 'En cours' },
      cloturee: { bg: 'success', text: 'Clôturée' },
      archivee: { bg: 'dark', text: 'Archivée' }
    };
    const { bg, text } = config[statut] || { bg: 'secondary', text: statut };
    return <Badge bg={bg}>{text}</Badge>;
  };

  const getSemestreBadge = (semestre: number | null | undefined) => {
    if (!semestre) return <Badge bg="secondary">Non défini</Badge>;
    return <Badge bg="info">Semestre {semestre}</Badge>;
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const formatMontant = (montant: number | undefined) => {
    if (montant === undefined) return '-';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(montant);
  };

  const renderActionButtons = () => {
    const buttons: JSX.Element[] = [];

    switch (annee.statut) {
      case 'brouillon':
        buttons.push(
          <Button
            key="ouvrir"
            variant="primary"
            size="sm"
            onClick={() => onAction('ouvrir', annee)}
          >
            <PlayCircle className="me-1" /> Ouvrir l'année
          </Button>
        );
        break;
      case 'ouverte':
      case 'en_cours':
        buttons.push(
          <Button
            key="cloturer-semestre"
            variant="warning"
            size="sm"
            onClick={() => onAction('cloturer-semestre', annee)}
          >
            <StopCircle className="me-1" /> Clôturer semestre {annee.semestre_actif || 1}
          </Button>
        );
        if (annee.statut === 'en_cours' && annee.semestre_actif === 2) {
          buttons.push(
            <Button
              key="cloturer-annee"
              variant="danger"
              size="sm"
              className="ms-2"
              onClick={() => onAction('cloturer-annee', annee)}
            >
              <StopCircle className="me-1" /> Clôturer l'année
            </Button>
          );
        }
        break;
      case 'cloturee':
        buttons.push(
          <Button
            key="archiver"
            variant="secondary"
            size="sm"
            onClick={() => onAction('archiver', annee)}
          >
            <Archive className="me-1" /> Archiver
          </Button>
        );
        break;
    }

    buttons.push(
      <Button
        key="rapport"
        variant="outline-primary"
        size="sm"
        className="ms-2"
        onClick={() => onAction('rapport', annee)}
      >
        <FileEarmarkText className="me-1" /> Voir rapport
      </Button>
    );

    return buttons;
  };

  return (
    <Card className="card-annee-academique h-100 shadow-sm">
      <Card.Header className="d-flex justify-content-between align-items-center bg-white">
        <h5 className="mb-0 fw-bold">{annee.code}</h5>
        {getStatutBadge(annee.statut)}
      </Card.Header>
      
      <Card.Body>
        <p className="text-muted mb-2">{annee.libelle}</p>
        
        <div className="mb-3">
          <div className="d-flex align-items-center text-muted mb-1">
            <Calendar className="me-2" />
            <small>
              {formatDate(annee.date_debut)} - {formatDate(annee.date_fin)}
            </small>
          </div>
          
          <div className="d-flex align-items-center mb-2">
            <CalendarCheck className="me-2 text-primary" />
            <span className="me-2">Semestre actif :</span>
            {getSemestreBadge(annee.semestre_actif)}
          </div>
          
          {(annee.date_debut_semestre1 || annee.date_debut_semestre2) && (
            <div className="small text-muted">
              {annee.date_debut_semestre1 && (
                <div>S1: {formatDate(annee.date_debut_semestre1)} - {formatDate(annee.date_fin_semestre1)}</div>
              )}
              {annee.date_debut_semestre2 && (
                <div>S2: {formatDate(annee.date_debut_semestre2)} - {formatDate(annee.date_fin_semestre2)}</div>
              )}
            </div>
          )}
        </div>

        <Row className="g-2">
          <Col xs={6}>
            <div className="stat-item p-2 bg-light rounded">
              <div className="d-flex align-items-center">
                <People className="text-primary me-2" />
                <div>
                  <div className="small text-muted">Étudiants</div>
                  <div className="fw-bold">{statistiques?.nbEtudiants ?? '-'}</div>
                </div>
              </div>
            </div>
          </Col>
          <Col xs={6}>
            <div className="stat-item p-2 bg-light rounded">
              <div className="d-flex align-items-center">
                <ClipboardData className="text-success me-2" />
                <div>
                  <div className="small text-muted">Inscriptions</div>
                  <div className="fw-bold">{statistiques?.nbInscriptions ?? '-'}</div>
                </div>
              </div>
            </div>
          </Col>
          <Col xs={6}>
            <div className="stat-item p-2 bg-light rounded">
              <div className="d-flex align-items-center">
                <CurrencyDollar className="text-warning me-2" />
                <div>
                  <div className="small text-muted">Facturé</div>
                  <div className="fw-bold">{formatMontant(statistiques?.montantFacture)}</div>
                </div>
              </div>
            </div>
          </Col>
          <Col xs={6}>
            <div className="stat-item p-2 bg-light rounded">
              <div className="d-flex align-items-center">
                <Trophy className="text-info me-2" />
                <div>
                  <div className="small text-muted">Réussite</div>
                  <div className="fw-bold">
                    {statistiques?.tauxReussite !== undefined 
                      ? `${statistiques.tauxReussite}%` 
                      : '-'}
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>

      <Card.Footer className="bg-white border-top">
        <div className="d-flex flex-wrap gap-2">
          {renderActionButtons()}
        </div>
      </Card.Footer>
    </Card>
  );
};

export default CardAnneeAcademique;
