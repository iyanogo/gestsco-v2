import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { 
  GeoAlt, 
  Clock, 
  Eye, 
  Pencil, 
  ClipboardCheck,
  FileEarmarkText,
  Person,
  Award
} from 'react-bootstrap-icons';
import { Soutenance, Stage } from '../../types/anneeAcademique';

interface Etudiant {
  id: number;
  nom: string;
  prenom: string;
  photo_url?: string;
}

interface Enseignant {
  id: number;
  nom: string;
  prenom: string;
}

interface CardSoutenanceProps {
  soutenance: Soutenance;
  stage?: Stage;
  etudiant?: Etudiant;
  president?: Enseignant;
  rapporteur?: Enseignant;
  examinateur?: Enseignant;
  onView: (soutenance: Soutenance) => void;
  onEdit?: (soutenance: Soutenance) => void;
  onEvaluer?: (soutenance: Soutenance) => void;
  onGenererPV?: (soutenance: Soutenance) => void;
}

const CardSoutenance: React.FC<CardSoutenanceProps> = ({
  soutenance,
  stage,
  etudiant,
  president,
  rapporteur,
  examinateur,
  onView,
  onEdit,
  onEvaluer,
  onGenererPV
}) => {
  const getStatutConfig = (statut: string) => {
    const config: Record<string, { bg: string; text: string; border: string }> = {
      programmee: { bg: 'info', text: 'Programmée', border: 'border-info' },
      en_cours: { bg: 'warning', text: 'En cours', border: 'border-warning' },
      terminee: { bg: 'success', text: 'Terminée', border: 'border-success' },
      validee: { bg: 'primary', text: 'Validée', border: 'border-primary' }
    };
    return config[statut] || { bg: 'secondary', text: statut, border: '' };
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNoteColor = (note: number) => {
    if (note >= 16) return 'success';
    if (note >= 14) return 'info';
    if (note >= 12) return 'primary';
    if (note >= 10) return 'warning';
    return 'danger';
  };

  const statutConfig = getStatutConfig(soutenance.statut);
  const canEdit = soutenance.statut === 'programmee';
  const canEvaluer = soutenance.statut === 'terminee';
  const canGenererPV = soutenance.statut === 'validee';

  return (
    <Card className={`card-soutenance h-100 shadow-sm ${statutConfig.border}`} style={{ borderLeftWidth: 4 }}>
      <Card.Header className="bg-white">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <div className="fs-5 fw-bold text-primary">
              {formatDate(soutenance.date_soutenance)}
            </div>
            <div className="text-muted">
              <Clock className="me-1" />
              {formatTime(soutenance.date_soutenance)}
            </div>
          </div>
          <Badge bg={statutConfig.bg}>{statutConfig.text}</Badge>
        </div>
      </Card.Header>

      <Card.Body>
        {/* Étudiant */}
        <div className="d-flex align-items-center mb-3">
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
            {stage && (
              <small className="text-muted" style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical'
              }}>
                {stage.theme}
              </small>
            )}
          </div>
        </div>

        {/* Lieu et durée */}
        <div className="mb-3">
          <div className="d-flex align-items-center text-muted mb-1">
            <GeoAlt className="me-2" />
            <span>{soutenance.lieu}</span>
          </div>
          <div className="d-flex align-items-center text-muted">
            <Clock className="me-2" />
            <span>{soutenance.duree_minutes} minutes</span>
          </div>
        </div>

        {/* Composition du jury */}
        <div className="mb-3">
          <small className="text-muted d-block mb-2">Composition du jury :</small>
          <div className="d-flex flex-column gap-1">
            {president && (
              <div className="d-flex align-items-center">
                <Person className="text-primary me-2" />
                <small>
                  <strong>Président :</strong> {president.prenom} {president.nom}
                </small>
              </div>
            )}
            {rapporteur && (
              <div className="d-flex align-items-center">
                <Person className="text-info me-2" />
                <small>
                  <strong>Rapporteur :</strong> {rapporteur.prenom} {rapporteur.nom}
                </small>
              </div>
            )}
            {examinateur && (
              <div className="d-flex align-items-center">
                <Person className="text-secondary me-2" />
                <small>
                  <strong>Examinateur :</strong> {examinateur.prenom} {examinateur.nom}
                </small>
              </div>
            )}
          </div>
        </div>

        {/* Note finale si disponible */}
        {soutenance.note_finale !== undefined && soutenance.note_finale !== null && (
          <div className="p-3 bg-light rounded text-center">
            <div className="d-flex align-items-center justify-content-center">
              <Award className={`text-${getNoteColor(soutenance.note_finale)} me-2`} size={20} />
              <span className={`fs-4 fw-bold text-${getNoteColor(soutenance.note_finale)}`}>
                {soutenance.note_finale.toFixed(2)}/20
              </span>
            </div>
            {soutenance.appreciation && (
              <Badge bg={getNoteColor(soutenance.note_finale)} className="mt-1">
                {soutenance.appreciation}
              </Badge>
            )}
            {soutenance.mention && (
              <div className="small text-muted mt-1">Mention : {soutenance.mention}</div>
            )}
          </div>
        )}
      </Card.Body>

      <Card.Footer className="bg-white border-top d-flex flex-wrap justify-content-end gap-2">
        <Button variant="outline-primary" size="sm" onClick={() => onView(soutenance)}>
          <Eye className="me-1" /> Voir détails
        </Button>
        {canEdit && onEdit && (
          <Button variant="outline-secondary" size="sm" onClick={() => onEdit(soutenance)}>
            <Pencil className="me-1" /> Modifier
          </Button>
        )}
        {canEvaluer && onEvaluer && (
          <Button variant="outline-success" size="sm" onClick={() => onEvaluer(soutenance)}>
            <ClipboardCheck className="me-1" /> Évaluer
          </Button>
        )}
        {canGenererPV && onGenererPV && (
          <Button variant="outline-info" size="sm" onClick={() => onGenererPV(soutenance)}>
            <FileEarmarkText className="me-1" /> Générer PV
          </Button>
        )}
      </Card.Footer>

      <style>{`
        .card-soutenance:hover {
          transform: translateY(-2px);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
          transition: all 0.3s ease;
        }
      `}</style>
    </Card>
  );
};

export default CardSoutenance;
