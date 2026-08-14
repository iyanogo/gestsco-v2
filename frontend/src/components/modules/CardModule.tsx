import React from 'react';
import { Card, Badge, Form, Button } from 'react-bootstrap';
import { 
  Gear,
  Book,
  People,
  ClipboardCheck,
  Calendar3,
  CurrencyDollar,
  Briefcase,
  BookHalf,
  Megaphone
} from 'react-bootstrap-icons';
import { ModuleSysteme } from '../../types/anneeAcademique';

interface CardModuleProps {
  module: ModuleSysteme;
  estActif: boolean;
  onToggle: (moduleId: number, actif: boolean) => void;
  onConfigure: (module: ModuleSysteme) => void;
}

const CardModule: React.FC<CardModuleProps> = ({
  module,
  estActif,
  onToggle,
  onConfigure
}) => {
  const getModuleIcon = (code: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      REFERENTIEL: <Book size={32} />,
      ETUDIANTS: <People size={32} />,
      INSCRIPTIONS: <ClipboardCheck size={32} />,
      EVALUATIONS: <ClipboardCheck size={32} />,
      EMPLOI_TEMPS: <Calendar3 size={32} />,
      FINANCES: <CurrencyDollar size={32} />,
      STAGES: <Briefcase size={32} />,
      BIBLIOTHEQUE: <BookHalf size={32} />,
      COMMUNICATION: <Megaphone size={32} />
    };
    return iconMap[code] || <Gear size={32} />;
  };

  const getModuleColor = (code: string) => {
    const colorMap: Record<string, string> = {
      REFERENTIEL: 'primary',
      ETUDIANTS: 'info',
      INSCRIPTIONS: 'success',
      EVALUATIONS: 'warning',
      EMPLOI_TEMPS: 'purple',
      FINANCES: 'orange',
      STAGES: 'teal',
      BIBLIOTHEQUE: 'indigo',
      COMMUNICATION: 'pink'
    };
    return colorMap[code] || 'secondary';
  };

  const color = getModuleColor(module.code);

  return (
    <Card 
      className={`card-module h-100 shadow-sm ${!estActif ? 'opacity-50' : ''}`}
      style={{ transition: 'all 0.3s ease' }}
    >
      <Card.Header className="bg-white border-bottom-0 pt-4 pb-0">
        <div className="text-center">
          <div 
            className={`rounded-circle bg-${color} bg-opacity-10 p-3 d-inline-flex mb-2`}
            style={{ color: `var(--bs-${color})` }}
          >
            {getModuleIcon(module.code)}
          </div>
          <h5 className="mb-1">{module.libelle}</h5>
          {module.est_obligatoire && (
            <Badge bg="warning" text="dark" className="mb-2">
              Obligatoire
            </Badge>
          )}
        </div>
      </Card.Header>

      <Card.Body>
        {module.description && (
          <p className="text-muted small mb-3">{module.description}</p>
        )}

        {module.dependances && module.dependances.length > 0 && (
          <div className="mb-3">
            <small className="text-muted d-block mb-1">Dépendances :</small>
            <div className="d-flex flex-wrap gap-1">
              {module.dependances.map((dep, index) => (
                <Badge key={index} bg="light" text="dark">
                  {dep}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {module.permissions_requises && module.permissions_requises.length > 0 && (
          <div className="mb-3">
            <small className="text-muted d-block mb-1">Rôles autorisés :</small>
            <div className="d-flex flex-wrap gap-1">
              {module.permissions_requises.map((role, index) => (
                <Badge key={index} bg="info" text="dark">
                  {role}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Card.Body>

      <Card.Footer className="bg-white border-top d-flex justify-content-between align-items-center">
        <Form.Check
          type="switch"
          id={`switch-${module.id}`}
          label={estActif ? 'Actif' : 'Inactif'}
          checked={estActif}
          onChange={(e) => onToggle(module.id, e.target.checked)}
          disabled={module.est_obligatoire}
          className="mb-0"
        />
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => onConfigure(module)}
          disabled={!estActif}
        >
          <Gear className="me-1" /> Configurer
        </Button>
      </Card.Footer>

      <style>{`
        .card-module:hover {
          transform: translateY(-2px);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
        }
        .bg-purple { background-color: #6f42c1 !important; }
        .bg-orange { background-color: #fd7e14 !important; }
        .bg-teal { background-color: #20c997 !important; }
        .bg-indigo { background-color: #6610f2 !important; }
        .bg-pink { background-color: #d63384 !important; }
        .bg-purple.bg-opacity-10 { background-color: rgba(111, 66, 193, 0.1) !important; }
        .bg-orange.bg-opacity-10 { background-color: rgba(253, 126, 20, 0.1) !important; }
        .bg-teal.bg-opacity-10 { background-color: rgba(32, 201, 151, 0.1) !important; }
        .bg-indigo.bg-opacity-10 { background-color: rgba(102, 16, 242, 0.1) !important; }
        .bg-pink.bg-opacity-10 { background-color: rgba(214, 51, 132, 0.1) !important; }
      `}</style>
    </Card>
  );
};

export default CardModule;
