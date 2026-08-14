import React from 'react';
import { 
  Calendar, 
  PlayCircle, 
  CalendarCheck, 
  StopCircle, 
  Archive,
  PersonCircle
} from 'react-bootstrap-icons';
import { AnneeAcademique } from '../../types/anneeAcademique';

interface TimelineEvent {
  id: string;
  date: string | null;
  label: string;
  description?: string;
  icon: React.ReactNode;
  color: string;
  utilisateur?: string;
  isCurrent?: boolean;
}

interface TimelineAnneeProps {
  annee: AnneeAcademique;
}

const TimelineAnnee: React.FC<TimelineAnneeProps> = ({ annee }) => {
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

  const isCurrentPeriod = (start: string | null | undefined, end: string | null | undefined) => {
    if (!start || !end) return false;
    const startDate = new Date(start);
    const endDate = new Date(end);
    return startDate <= now && now <= endDate;
  };

  const events: TimelineEvent[] = [
    {
      id: 'creation',
      date: annee.created_at || null,
      label: 'Création',
      description: `Année académique ${annee.code} créée`,
      icon: <Calendar />,
      color: 'secondary',
      isCurrent: annee.statut === 'brouillon'
    },
    {
      id: 'ouverture',
      date: annee.date_ouverture || null,
      label: 'Ouverture',
      description: 'Ouverture de l\'année académique',
      icon: <PlayCircle />,
      color: 'info',
      isCurrent: annee.statut === 'ouverte' && !annee.semestre_actif
    },
    {
      id: 'debut_s1',
      date: annee.date_debut_semestre1 || null,
      label: 'Début Semestre 1',
      description: 'Début des cours du semestre 1',
      icon: <CalendarCheck />,
      color: 'primary',
      isCurrent: isCurrentPeriod(annee.date_debut_semestre1, annee.date_fin_semestre1)
    },
    {
      id: 'fin_s1',
      date: annee.date_fin_semestre1 || null,
      label: 'Fin Semestre 1',
      description: 'Fin des cours du semestre 1',
      icon: <StopCircle />,
      color: 'warning'
    },
    {
      id: 'debut_s2',
      date: annee.date_debut_semestre2 || null,
      label: 'Début Semestre 2',
      description: 'Début des cours du semestre 2',
      icon: <CalendarCheck />,
      color: 'primary',
      isCurrent: isCurrentPeriod(annee.date_debut_semestre2, annee.date_fin_semestre2)
    },
    {
      id: 'fin_s2',
      date: annee.date_fin_semestre2 || null,
      label: 'Fin Semestre 2',
      description: 'Fin des cours du semestre 2',
      icon: <StopCircle />,
      color: 'warning'
    },
    {
      id: 'cloture',
      date: annee.date_cloture || null,
      label: 'Clôture',
      description: 'Clôture de l\'année académique',
      icon: <Archive />,
      color: 'success',
      isCurrent: annee.statut === 'cloturee'
    }
  ];

  const filteredEvents = events.filter(event => {
    if (event.id === 'creation') return true;
    if (event.id === 'ouverture') return annee.date_ouverture;
    if (event.id === 'cloture') return annee.date_cloture;
    return event.date;
  });

  return (
    <div className="timeline-annee">
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
                      {event.id === 'ouverture' || event.id === 'cloture' 
                        ? formatDateTime(event.date) 
                        : formatDate(event.date)}
                    </small>
                  )}
                </div>
                {event.description && (
                  <p className="text-muted small mb-0">{event.description}</p>
                )}
                {event.utilisateur && (
                  <div className="d-flex align-items-center mt-1">
                    <PersonCircle className="text-muted me-1" size={12} />
                    <small className="text-muted">{event.utilisateur}</small>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .timeline-annee {
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

export default TimelineAnnee;
