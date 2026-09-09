import React from 'react';
import { Badge, Card } from 'react-bootstrap';

export interface PlannedFeatureBannerProps {
  /** Texte principal sous le titre (obligatoire). */
  description: React.ReactNode;
  /** Titre du bandeau. */
  title?: string;
  /** Libellé du badge phase (ex. « Phase 2 »). */
  phaseLabel?: string;
  /** Icône Bootstrap Icons (sans préfixe bi-). */
  icon?: string;
  /** Liste optionnelle de capacités prévues. */
  plannedFeatures?: string[];
  /** Contenu additionnel (ex. note RBAC sur PermissionsPage). */
  children?: React.ReactNode;
}

/**
 * Bandeau très visible pour les pages sans API backend.
 * Objectif : signaler clairement « non développé », pas « cassé ».
 */
const PlannedFeatureBanner: React.FC<PlannedFeatureBannerProps> = ({
  title = 'Fonctionnalité planifiée - pas d\'API backend',
  description,
  phaseLabel = 'Phase 2',
  icon = 'hourglass-split',
  plannedFeatures,
  children,
}) => {
  return (
    <Card className="border-warning border-2 shadow-sm mb-4 planned-feature-banner">
      <Card.Body className="p-4 p-md-5">
        <div className="d-flex flex-column flex-md-row align-items-start gap-4">
          <div
            className="rounded-circle bg-warning bg-opacity-25 d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: 72, height: 72 }}
            aria-hidden
          >
            <i className={`bi bi-${icon} text-warning fs-1`} />
          </div>

          <div className="flex-grow-1">
            <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
              <h4 className="fw-bold mb-0 text-dark">{title}</h4>
              <Badge bg="warning" text="dark" className="fs-6 px-3 py-2">
                {phaseLabel}
              </Badge>
              <Badge bg="secondary" className="fs-6 px-3 py-2">
                Pas d&apos;API backend
              </Badge>
            </div>

            <p className="fs-5 mb-3 text-body-secondary">
              Cette page n&apos;est <strong>pas encore connectée</strong> à un module backend.
              L&apos;interface affichée auparavant était une <strong>maquette de démonstration</strong> -
              ce n&apos;est <strong>pas un dysfonctionnement</strong> de l&apos;application.
            </p>

            <p className="mb-0">{description}</p>

            {plannedFeatures && plannedFeatures.length > 0 && (
              <div className="mt-4">
                <p className="fw-semibold mb-2">Prévu en {phaseLabel}&nbsp;:</p>
                <ul className="mb-0 ps-3">
                  {plannedFeatures.map((feature) => (
                    <li key={feature} className="mb-1">{feature}</li>
                  ))}
                </ul>
              </div>
            )}

            {children && <div className="mt-4 pt-3 border-top">{children}</div>}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default PlannedFeatureBanner;
