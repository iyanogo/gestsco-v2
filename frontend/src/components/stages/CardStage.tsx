import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { 
  Calendar, 
  Person, 
  Building, 
  Eye, 
  Pencil, 
  Trash,
  Award
} from 'react-bootstrap-icons';
import { Stage } from '../../types/anneeAcademique';

interface Etudiant {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  photo_url?: string;
}

interface CardStageProps {
  stage: Stage;
  etudiant?: Etudiant;
  niveauLibelle?: string;
  filiereLibelle?: string;
  onView: (stage: Stage) => void;
  onEdit?: (stage: Stage) => void;
  onDelete?: (stage: Stage) => void;
}

const CardStage: React.FC<CardStageProps> = ({
  stage,
  etudiant,
  niveauLibelle,
  filiereLibelle,
  onView,
  onEdit,
  onDelete
}) => {
  const getStatutBadge = (statut: string) => {
    const config: Record<string, { bg: string; text: string }> = {
      en_cours: { bg: 'primary', text: 'En cours' },
      termine: { bg: 'info', text: 'Terminé' },
      valide: { bg: 'success', text: 'Validé' },
      invalide: { bg: 'danger', text: 'Invalidé' }
    };
    const { bg, text } = config[statut] || { bg: 'secondary', text: statut };
    return <Badge bg={bg}>{text}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const config: Record<string, { bg: string; text: string }> = {
      observation: { bg: 'light', text: 'Observation' },
      pratique: { bg: 'info', text: 'Pratique' },
      professionnel: { bg: 'warning', text: 'Professionnel' },
      recherche: { bg: 'purple', text: 'Recherche' }
    };
    const { bg, text } = config[type] || { bg: 'secondary', text: type };
    return <Badge bg={bg} text={bg === 'light' || bg === 'warning' ? 'dark' : 'white'}>{text}</Badge>;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getNoteColor = (note: number) => {
    if (note >= 16) return 'success';
    if (note >= 14) return 'info';
    if (note >= 12) return 'primary';
    if (note >= 10) return 'warning';
    return 'danger';
  };

  const getMention = (note: number) => {
    if (note >= 16) return 'Très Bien';
    if (note >= 14) return 'Bien';
    if (note >= 12) return 'Assez Bien';
    if (note >= 10) return 'Passable';
    return 'Insuffisant';
  };

  const canEdit = stage.statut === 'en_cours';

  return (
    <Card className="card-stage h-100 shadow-sm">
      <Card.Header className="bg-white d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          {etudiant?.photo_url ? (
            <img 
              src={etudiant.photo_url} 
              alt={`${etudiant.prenom} ${etudiant.nom}`}
              className="rounded-circle me-2"
              style={{ width: 40, height: 40, objectFit: 'cover' }}
            />
          ) : (
            <div 
              className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2"
              style={{ width: 40, height: 40 }}
            >
              {etudiant ? `${etudiant.prenom[0]}${etudiant.nom[0]}` : '?'}
            </div>
          )}
          <div>
            <div className="fw-bold">
              {etudiant ? `${etudiant.prenom} ${etudiant.nom}` : 'Étudiant inconnu'}
            </div>
            <small className="text-muted">{etudiant?.matricule}</small>
          </div>
        </div>
        {getStatutBadge(stage.statut)}
      </Card.Header>

      <Card.Body>
        <div className="mb-3">
          {getTypeBadge(stage.type_stage)}
          {niveauLibelle && (
            <Badge bg="secondary" className="ms-2">{niveauLibelle}</Badge>
          )}
          {filiereLibelle && (
            <Badge bg="outline-secondary" className="ms-2 border">{filiereLibelle}</Badge>
          )}
        </div>

        <div className="mb-2 d-flex align-items-center text-muted">
          <Building className="me-2" />
          <span>{stage.entreprise_nom}</span>
        </div>

        <div className="mb-2 d-flex align-items-center text-muted">
          <Calendar className="me-2" />
          <span>{formatDate(stage.date_debut)} - {formatDate(stage.date_fin)}</span>
        </div>

        {stage.encadrant_academique_id && (
          <div className="mb-2 d-flex align-items-center text-muted">
            <Person className="me-2" />
            <span>Encadrant #{stage.encadrant_academique_id}</span>
          </div>
        )}

        <p className="text-muted small mb-0 mt-3" style={{ 
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical'
        }}>
          {stage.theme}
        </p>

        {stage.note_finale !== undefined && stage.note_finale !== null && (
          <div className="mt-3 p-3 bg-light rounded text-center">
            <div className="d-flex align-items-center justify-content-center">
              <Award className={`text-${getNoteColor(stage.note_finale)} me-2`} size={24} />
              <span className={`fs-3 fw-bold text-${getNoteColor(stage.note_finale)}`}>
                {stage.note_finale.toFixed(2)}/20
              </span>
            </div>
            <Badge bg={getNoteColor(stage.note_finale)} className="mt-1">
              {getMention(stage.note_finale)}
            </Badge>
          </div>
        )}
      </Card.Body>

      <Card.Footer className="bg-white border-top d-flex justify-content-end gap-2">
        <Button variant="outline-primary" size="sm" onClick={() => onView(stage)}>
          <Eye className="me-1" /> Voir détails
        </Button>
        {canEdit && onEdit && (
          <Button variant="outline-secondary" size="sm" onClick={() => onEdit(stage)}>
            <Pencil className="me-1" /> Modifier
          </Button>
        )}
        {canEdit && onDelete && (
          <Button variant="outline-danger" size="sm" onClick={() => onDelete(stage)}>
            <Trash className="me-1" /> Supprimer
          </Button>
        )}
      </Card.Footer>

      <style>{`
        .card-stage:hover {
          transform: translateY(-2px);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
          transition: all 0.3s ease;
        }
        .bg-purple {
          background-color: #6f42c1 !important;
        }
      `}</style>
    </Card>
  );
};

export default CardStage;
