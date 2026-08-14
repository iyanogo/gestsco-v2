import React from 'react';
import { 
  PlusCircle, 
  PlayCircle, 
  FileEarmarkText, 
  Calendar, 
  Mortarboard,
  CheckCircle,
  StopCircle
} from 'react-bootstrap-icons';
import { Stage } from '../../types/anneeAcademique';

interface Soutenance {
  id: number;
  date_soutenance: string;
  statut: string;
}

interface TimelineStageProps {
  stage: Stage;
  soutenance?: Soutenance;
}

const TimelineStage: React.FC<TimelineStageProps> = ({ stage, soutenance }) => {
  const formatDate = (date: string | null | undefined) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateTime = (date: string | null | undefined) => {
    if (!date) return null;
    return new Date(date).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const now = new Date();
  const isDatePassed = (date: string | null | undefined) => {
    if (!date) return false;
    return new Date(date) < now;
  };

  interface TimelineEvent {
    id: string;
    date: string | null;
    label: string;
    description?: string;
    icon: React.ReactNode;
    color: string;
    isCurrent?: boolean;
  }

  const events: TimelineEvent[] = [
    {
      id: 'creation',
      date: stage.created_at || null,
      label: 'Création du stage',
      description: 'Stage enregistré dans le système',
      icon: <PlusCircle />,
      color: 'secondary'
    },
    {
      id: 'debut',
      date: stage.date_debut,
      label: 'Début du stage',
      description: `Stage chez ${stage.entreprise_nom}`,
      icon: <PlayCircle />,
      color: 'primary',
      isCurrent: stage.statut === 'en_cours' && isDatePassed(stage.date_debut) && !isDatePassed(stage.date_fin)
    },
    ...(stage.date_depot_rapport ? [{
      id: 'rapport',
      date: stage.date_depot_rapport,
      label: 'Dépôt du rapport',
      description: 'Rapport de stage déposé',
      icon: <FileEarmarkText />,
      color: 'info'
    }] : []),
    ...(soutenance ? [{
      id: 'programmation_soutenance',
      date: soutenance.date_soutenance,
      label: 'Soutenance programmée',
      description: 'Soutenance planifiée',
      icon: <Calendar />,
      color: 'warning'
    }] : []),
    ...(soutenance && soutenance.statut === 'terminee' ? [{
      id: 'soutenance',
      date: soutenance.date_soutenance,
      label: 'Soutenance effectuée',
      description: 'Soutenance terminée',
      icon: <Mortarboard />,
      color: 'success'
    }] : []),
    ...(stage.statut === 'valide' ? [{
      id: 'validation',
      date: stage.updated_at || null,
      label: 'Stage validé',
      description: `Note finale : ${stage.note_finale?.toFixed(2)}/20`,
      icon: <CheckCircle />,
      color: 'success'
    }] : []),
    {
      id: 'fin',
      date: stage.date_fin,
      label: 'Fin du stage',
      description: 'Fin de la période de stage',
      icon: <StopCircle />,
      color: isDatePassed(stage.date_fin) ? 'success' : 'secondary'
    }
  ];

  const filteredEvents = events.filter(event => event.date);

  return (
    <div className="timeline-stage">
      <div className="timeline-container">
        {filteredEvents.map((event, index) => {
          const isPassed = isDatePassed(event.date);
          const isLast = index === filteredEvents.length - 1;

          return (
            <div 
              key={event.id} 
              className={`timeline-item ${event.isCurrent ? 'current' : ''} ${isPassed ? 'passed' : ''}`}
            >
              <div className="timeline-marker">
                <div 
                  className={`timeline-icon bg-${event.isCurrent ? event.color : isPassed ? event.color : 'light'} 
                    ${event.isCurrent ? 'text-white pulse' : isPassed ? 'text-white' : 'text-muted'}`}
                >
                  {event.icon}
                </div>
                {!isLast && <div className={`timeline-line ${isPassed ? 'bg-' + event.color : 'bg-light'}`} />}
              </div>
              
              <div className="timeline-content">
                <div className="timeline-header">
                  <h6 className={`mb-0 ${event.isCurrent ? 'fw-bold text-' + event.color : ''}`}>
                    {event.label}
                  </h6>
                  {event.date && (
                    <small className="text-muted">
                      {event.id === 'programmation_soutenance' || event.id === 'soutenance'
                        ? formatDateTime(event.date)
                        : formatDate(event.date)}
                    </small>
                  )}
                </div>
                {event.description && (
                  <p className="text-muted small mb-0">{event.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .timeline-stage {
          padding: 1rem 0;
        }
        .timeline-container {
          position: relative;
        }
        .timeline-item {
          display: flex;
          margin-bottom: 1.5rem;
        }
        .timeline-item:last-child {
          margin-bottom: 0;
        }
        .timeline-marker {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-right: 1rem;
        }
        .timeline-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          flex-shrink: 0;
        }
        .timeline-line {
          width: 2px;
          flex-grow: 1;
          margin-top: 0.5rem;
          min-height: 30px;
        }
        .timeline-content {
          flex-grow: 1;
          padding-top: 0.5rem;
        }
        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .timeline-item.current .timeline-icon {
          box-shadow: 0 0 0 4px rgba(var(--bs-primary-rgb), 0.25);
        }
        .pulse {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(var(--bs-primary-rgb), 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(var(--bs-primary-rgb), 0); }
          100% { box-shadow: 0 0 0 0 rgba(var(--bs-primary-rgb), 0); }
        }
        @media (max-width: 576px) {
          .timeline-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default TimelineStage;
