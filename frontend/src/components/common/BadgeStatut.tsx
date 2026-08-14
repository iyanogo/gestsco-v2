import React from 'react';
import { Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { 
  FileEarmark, 
  DoorOpen, 
  PlayCircle, 
  CheckCircle, 
  Archive,
  Gear,
  Briefcase,
  Mortarboard,
  ClipboardCheck
} from 'react-bootstrap-icons';

type StatutType = 'annee' | 'module' | 'stage' | 'soutenance' | 'deliberation';

interface BadgeStatutProps {
  statut: string;
  type: StatutType;
  showIcon?: boolean;
  showTooltip?: boolean;
}

const BadgeStatut: React.FC<BadgeStatutProps> = ({
  statut,
  type,
  showIcon = true,
  showTooltip = true
}) => {
  const getConfig = () => {
    const configs: Record<StatutType, Record<string, { bg: string; text: string; icon: React.ReactNode; description: string }>> = {
      annee: {
        brouillon: { bg: 'secondary', text: 'Brouillon', icon: <FileEarmark />, description: 'Année en préparation' },
        ouverte: { bg: 'info', text: 'Ouverte', icon: <DoorOpen />, description: 'Inscriptions ouvertes' },
        en_cours: { bg: 'primary', text: 'En cours', icon: <PlayCircle />, description: 'Année en cours' },
        cloturee: { bg: 'success', text: 'Clôturée', icon: <CheckCircle />, description: 'Année terminée' },
        archivee: { bg: 'dark', text: 'Archivée', icon: <Archive />, description: 'Année archivée' }
      },
      module: {
        actif: { bg: 'success', text: 'Actif', icon: <Gear />, description: 'Module activé' },
        inactif: { bg: 'secondary', text: 'Inactif', icon: <Gear />, description: 'Module désactivé' }
      },
      stage: {
        en_cours: { bg: 'primary', text: 'En cours', icon: <Briefcase />, description: 'Stage en cours' },
        termine: { bg: 'info', text: 'Terminé', icon: <Briefcase />, description: 'Stage terminé' },
        valide: { bg: 'success', text: 'Validé', icon: <CheckCircle />, description: 'Stage validé' },
        invalide: { bg: 'danger', text: 'Invalidé', icon: <Briefcase />, description: 'Stage non validé' }
      },
      soutenance: {
        programmee: { bg: 'info', text: 'Programmée', icon: <Mortarboard />, description: 'Soutenance planifiée' },
        en_cours: { bg: 'warning', text: 'En cours', icon: <Mortarboard />, description: 'Soutenance en cours' },
        terminee: { bg: 'success', text: 'Terminée', icon: <Mortarboard />, description: 'Soutenance effectuée' },
        validee: { bg: 'primary', text: 'Validée', icon: <CheckCircle />, description: 'Soutenance validée' }
      },
      deliberation: {
        en_attente: { bg: 'secondary', text: 'En attente', icon: <ClipboardCheck />, description: 'Délibération non commencée' },
        en_cours: { bg: 'warning', text: 'En cours', icon: <ClipboardCheck />, description: 'Délibération en cours' },
        terminee: { bg: 'success', text: 'Terminée', icon: <CheckCircle />, description: 'Délibération terminée' },
        validee: { bg: 'primary', text: 'Validée', icon: <CheckCircle />, description: 'Délibération validée' }
      }
    };

    return configs[type]?.[statut] || { bg: 'secondary', text: statut, icon: null, description: '' };
  };

  const config = getConfig();

  const badge = (
    <Badge bg={config.bg} className="d-inline-flex align-items-center gap-1">
      {showIcon && config.icon}
      {config.text}
    </Badge>
  );

  if (showTooltip && config.description) {
    return (
      <OverlayTrigger
        placement="top"
        overlay={<Tooltip>{config.description}</Tooltip>}
      >
        {badge}
      </OverlayTrigger>
    );
  }

  return badge;
};

export default BadgeStatut;
