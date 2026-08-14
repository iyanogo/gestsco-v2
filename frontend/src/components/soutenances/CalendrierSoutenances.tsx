import React, { useState, useMemo } from 'react';
import { Card, Button, ButtonGroup } from 'react-bootstrap';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus
} from 'react-bootstrap-icons';
import { Soutenance } from '../../types/anneeAcademique';

interface CalendrierSoutenancesProps {
  soutenances: Soutenance[];
  onSelectSoutenance: (soutenance: Soutenance) => void;
  onCreateSoutenance?: () => void;
}

type ViewType = 'month' | 'week' | 'day';

const CalendrierSoutenances: React.FC<CalendrierSoutenancesProps> = ({
  soutenances,
  onSelectSoutenance,
  onCreateSoutenance
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');

  const getStatutColor = (statut: string) => {
    const colors: Record<string, string> = {
      programmee: '#0dcaf0',
      en_cours: '#ffc107',
      terminee: '#198754',
      validee: '#0d6efd'
    };
    return colors[statut] || '#6c757d';
  };

  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    
    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getSoutenancesForDate = (date: Date) => {
    return soutenances.filter(s => {
      const soutenanceDate = new Date(s.date_soutenance);
      return (
        soutenanceDate.getDate() === date.getDate() &&
        soutenanceDate.getMonth() === date.getMonth() &&
        soutenanceDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const days = useMemo(() => getDaysInMonth(currentDate), [currentDate]);
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <Card className="calendrier-soutenances">
      <Card.Header className="bg-white">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <Button variant="outline-secondary" size="sm" onClick={navigatePrevious}>
              <ChevronLeft />
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={navigateNext}>
              <ChevronRight />
            </Button>
            <Button variant="outline-primary" size="sm" onClick={goToToday}>
              Aujourd'hui
            </Button>
            <h5 className="mb-0 ms-2 text-capitalize">{formatMonthYear(currentDate)}</h5>
          </div>
          
          <div className="d-flex align-items-center gap-2">
            <ButtonGroup size="sm">
              <Button variant={view === 'month' ? 'primary' : 'outline-primary'} onClick={() => setView('month')}>Mois</Button>
              <Button variant={view === 'week' ? 'primary' : 'outline-primary'} onClick={() => setView('week')}>Semaine</Button>
              <Button variant={view === 'day' ? 'primary' : 'outline-primary'} onClick={() => setView('day')}>Jour</Button>
            </ButtonGroup>
            {onCreateSoutenance && (
              <Button variant="primary" size="sm" onClick={onCreateSoutenance}>
                <Plus className="me-1" /> Nouvelle soutenance
              </Button>
            )}
          </div>
        </div>
      </Card.Header>

      <Card.Body className="p-0">
        <div className="calendar-grid">
          <div className="calendar-header">
            {weekDays.map(day => (
              <div key={day} className="calendar-header-cell">{day}</div>
            ))}
          </div>
          <div className="calendar-body">
            {days.map((day, index) => {
              const daySoutenances = day ? getSoutenancesForDate(day) : [];
              return (
                <div key={index} className={`calendar-cell ${!day ? 'empty' : ''} ${isToday(day) ? 'today' : ''}`}>
                  {day && (
                    <>
                      <div className="calendar-date">{day.getDate()}</div>
                      <div className="calendar-events">
                        {daySoutenances.slice(0, 3).map(soutenance => (
                          <div
                            key={soutenance.id}
                            className="calendar-event"
                            style={{ backgroundColor: getStatutColor(soutenance.statut) }}
                            onClick={() => onSelectSoutenance(soutenance)}
                          >
                            {new Date(soutenance.date_soutenance).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        ))}
                        {daySoutenances.length > 3 && (
                          <div className="calendar-more">+{daySoutenances.length - 3}</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Légende */}
        <div className="calendar-legend p-3 border-top">
          <div className="d-flex flex-wrap gap-3">
            <div className="d-flex align-items-center">
              <span className="legend-dot" style={{ backgroundColor: '#0dcaf0' }}></span>
              <small>Programmée</small>
            </div>
            <div className="d-flex align-items-center">
              <span className="legend-dot" style={{ backgroundColor: '#ffc107' }}></span>
              <small>En cours</small>
            </div>
            <div className="d-flex align-items-center">
              <span className="legend-dot" style={{ backgroundColor: '#198754' }}></span>
              <small>Terminée</small>
            </div>
            <div className="d-flex align-items-center">
              <span className="legend-dot" style={{ backgroundColor: '#0d6efd' }}></span>
              <small>Validée</small>
            </div>
          </div>
        </div>
      </Card.Body>

      <style>{`
        .calendar-grid { width: 100%; }
        .calendar-header { display: grid; grid-template-columns: repeat(7, 1fr); background: #f8f9fa; border-bottom: 1px solid #dee2e6; }
        .calendar-header-cell { padding: 0.75rem; text-align: center; font-weight: 600; color: #6c757d; }
        .calendar-body { display: grid; grid-template-columns: repeat(7, 1fr); }
        .calendar-cell { min-height: 100px; border: 1px solid #dee2e6; padding: 0.5rem; position: relative; }
        .calendar-cell.empty { background: #f8f9fa; }
        .calendar-cell.today { background: rgba(13, 110, 253, 0.1); }
        .calendar-date { font-weight: 600; margin-bottom: 0.25rem; }
        .calendar-events { display: flex; flex-direction: column; gap: 2px; }
        .calendar-event { padding: 2px 4px; border-radius: 3px; color: white; font-size: 0.75rem; cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .calendar-event:hover { opacity: 0.8; }
        .calendar-more { font-size: 0.75rem; color: #6c757d; }
        .legend-dot { width: 12px; height: 12px; border-radius: 50%; margin-right: 0.5rem; }
        @media (max-width: 768px) {
          .calendar-cell { min-height: 60px; padding: 0.25rem; }
          .calendar-header-cell { padding: 0.5rem; font-size: 0.75rem; }
        }
      `}</style>
    </Card>
  );
};

export default CalendrierSoutenances;
