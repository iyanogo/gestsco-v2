import React from 'react';
import { Spinner } from 'react-bootstrap';
import { Check } from 'react-bootstrap-icons';

interface Etape {
  id: string;
  label: string;
}

interface IndicateurProgressionProps {
  etapes: Etape[];
  etapeActuelle: number;
}

const IndicateurProgression: React.FC<IndicateurProgressionProps> = ({
  etapes,
  etapeActuelle
}) => {
  return (
    <div className="indicateur-progression">
      <div className="etapes-container">
        {etapes.map((etape, index) => {
          const numero = index + 1;
          const isTerminee = numero < etapeActuelle;
          const isEnCours = numero === etapeActuelle;
          const isAVenir = numero > etapeActuelle;

          return (
            <div key={etape.id} className="etape-wrapper">
              <div className="etape-item">
                <div 
                  className={`etape-cercle ${isTerminee ? 'terminee' : ''} ${isEnCours ? 'en-cours' : ''} ${isAVenir ? 'a-venir' : ''}`}
                >
                  {isTerminee ? (
                    <Check />
                  ) : isEnCours ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    numero
                  )}
                </div>
                <div className={`etape-label ${isEnCours ? 'fw-bold text-primary' : ''} ${isAVenir ? 'text-muted' : ''}`}>
                  {etape.label}
                </div>
              </div>
              {index < etapes.length - 1 && (
                <div className={`etape-ligne ${isTerminee ? 'terminee' : ''}`} />
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        .indicateur-progression {
          padding: 1rem 0;
        }
        .etapes-container {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }
        .etape-wrapper {
          display: flex;
          align-items: center;
          flex: 1;
        }
        .etape-wrapper:last-child {
          flex: 0;
        }
        .etape-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          min-width: 80px;
        }
        .etape-cercle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          margin-bottom: 0.5rem;
          transition: all 0.3s ease;
        }
        .etape-cercle.terminee {
          background-color: var(--bs-success);
          color: white;
        }
        .etape-cercle.en-cours {
          background-color: var(--bs-primary);
          color: white;
          box-shadow: 0 0 0 4px rgba(var(--bs-primary-rgb), 0.25);
        }
        .etape-cercle.a-venir {
          background-color: #e9ecef;
          color: #6c757d;
        }
        .etape-label {
          font-size: 0.875rem;
          max-width: 100px;
        }
        .etape-ligne {
          flex: 1;
          height: 2px;
          background-color: #e9ecef;
          margin: 0 0.5rem;
          margin-top: -1.5rem;
        }
        .etape-ligne.terminee {
          background-color: var(--bs-success);
        }
        @media (max-width: 576px) {
          .etapes-container {
            flex-direction: column;
            align-items: flex-start;
          }
          .etape-wrapper {
            flex-direction: column;
            width: 100%;
            margin-bottom: 1rem;
          }
          .etape-item {
            flex-direction: row;
            text-align: left;
          }
          .etape-cercle {
            margin-bottom: 0;
            margin-right: 1rem;
          }
          .etape-ligne {
            width: 2px;
            height: 20px;
            margin: 0.5rem 0 0.5rem 19px;
          }
        }
      `}</style>
    </div>
  );
};

export default IndicateurProgression;
