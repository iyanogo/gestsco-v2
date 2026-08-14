import React from 'react';
import { Card, Badge, Spinner, Alert } from 'react-bootstrap';
import { 
  CheckCircle, 
  Calendar, 
  Person,
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
import { ModuleActif, ModuleSysteme } from '../../types/anneeAcademique';

interface ListeModulesActifsProps {
  universiteId?: number;
  anneeId?: number;
  modulesActifs?: ModuleActif[];
  modulesSysteme?: ModuleSysteme[];
  loading?: boolean;
}

const ListeModulesActifs: React.FC<ListeModulesActifsProps> = ({
  modulesActifs = [],
  modulesSysteme = [],
  loading = false
}) => {
  const getModuleIcon = (code: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      REFERENTIEL: <Book size={16} />,
      ETUDIANTS: <People size={16} />,
      INSCRIPTIONS: <ClipboardCheck size={16} />,
      EVALUATIONS: <ClipboardCheck size={16} />,
      EMPLOI_TEMPS: <Calendar3 size={16} />,
      FINANCES: <CurrencyDollar size={16} />,
      STAGES: <Briefcase size={16} />,
      BIBLIOTHEQUE: <BookHalf size={16} />,
      COMMUNICATION: <Megaphone size={16} />
    };
    return iconMap[code] || <Gear size={16} />;
  };

  const getModuleInfo = (moduleId: number) => {
    return modulesSysteme.find(m => m.id === moduleId);
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" size="sm" className="me-2" />
        Chargement des modules...
      </div>
    );
  }

  if (modulesActifs.length === 0) {
    return (
      <Alert variant="info" className="mb-0">
        <div className="text-center py-3">
          <Gear size={32} className="text-muted mb-2" />
          <p className="mb-0">Aucun module actif pour le moment.</p>
        </div>
      </Alert>
    );
  }

  return (
    <Card>
      <Card.Header className="bg-white">
        <div className="d-flex justify-content-between align-items-center">
          <span className="fw-bold">Modules actifs</span>
          <Badge bg="primary">{modulesActifs.length}</Badge>
        </div>
      </Card.Header>
      <Card.Body className="p-0">
        <ul className="list-group list-group-flush">
          {modulesActifs.map(moduleActif => {
            const moduleInfo = getModuleInfo(moduleActif.module_id);
            if (!moduleInfo) return null;

            return (
              <li 
                key={moduleActif.id} 
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                <div className="d-flex align-items-center">
                  <div className="me-3 text-primary">
                    {getModuleIcon(moduleInfo.code)}
                  </div>
                  <div>
                    <div className="fw-medium">{moduleInfo.libelle}</div>
                    <div className="d-flex align-items-center text-muted small">
                      <Calendar className="me-1" size={12} />
                      <span className="me-3">
                        Activé le {formatDate(moduleActif.date_activation)}
                      </span>
                      {moduleActif.active_par && (
                        <>
                          <Person className="me-1" size={12} />
                          <span>Par utilisateur #{moduleActif.active_par}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="d-flex align-items-center">
                  {moduleInfo.est_obligatoire && (
                    <Badge bg="warning" text="dark" className="me-2">
                      Obligatoire
                    </Badge>
                  )}
                  <CheckCircle className="text-success" />
                </div>
              </li>
            );
          })}
        </ul>
      </Card.Body>
    </Card>
  );
};

export default ListeModulesActifs;
