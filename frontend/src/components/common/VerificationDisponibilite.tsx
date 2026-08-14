import React, { useState, useEffect } from 'react';
import { Spinner, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { CheckCircle, XCircle } from 'react-bootstrap-icons';

interface VerificationDisponibiliteProps {
  type: 'salle' | 'enseignant';
  id: number;
  date: string;
  heureDebut: string;
  heureFin: string;
  onResult?: (disponible: boolean, conflit?: string) => void;
}

const VerificationDisponibilite: React.FC<VerificationDisponibiliteProps> = ({
  type,
  id,
  date,
  heureDebut,
  heureFin,
  onResult
}) => {
  const [loading, setLoading] = useState(false);
  const [disponible, setDisponible] = useState<boolean | null>(null);
  const [conflit, setConflit] = useState<string | null>(null);

  useEffect(() => {
    if (id && date && heureDebut && heureFin) {
      verifierDisponibilite();
    }
  }, [id, date, heureDebut, heureFin]);

  const verifierDisponibilite = async () => {
    setLoading(true);
    try {
      // Simulation d'appel API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simulation de résultat (à remplacer par un vrai appel API)
      const estDisponible = Math.random() > 0.3;
      const conflitMessage = estDisponible ? null : `${type === 'salle' ? 'Salle' : 'Enseignant'} occupé(e) de 10h à 12h`;
      
      setDisponible(estDisponible);
      setConflit(conflitMessage);
      
      if (onResult) {
        onResult(estDisponible, conflitMessage || undefined);
      }
    } catch (error) {
      setDisponible(null);
      setConflit('Erreur de vérification');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner animation="border" size="sm" className="text-primary" />;
  }

  if (disponible === null) {
    return null;
  }

  if (disponible) {
    return (
      <OverlayTrigger
        placement="top"
        overlay={<Tooltip>Disponible</Tooltip>}
      >
        <CheckCircle className="text-success" />
      </OverlayTrigger>
    );
  }

  return (
    <OverlayTrigger
      placement="top"
      overlay={<Tooltip>{conflit || 'Non disponible'}</Tooltip>}
    >
      <XCircle className="text-danger" />
    </OverlayTrigger>
  );
};

export default VerificationDisponibilite;
