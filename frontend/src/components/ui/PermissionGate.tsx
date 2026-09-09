import React from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { usePermissions } from '@/hooks/usePermissions';
import type { RbacAction, RbacModule } from '@/utils/rbacActions';
import { RBAC_DENIED_TOOLTIP } from '@/utils/rbacActions';

export interface PermissionGateProps {
  module: RbacModule;
  action: RbacAction;
  children: React.ReactElement;
  /** hide (défaut) : ne rend rien ; disable : rend l'enfant désactivé avec tooltip */
  mode?: 'hide' | 'disable';
  tooltip?: string;
  fallback?: React.ReactNode;
}

/**
 * Affiche ou masque une action UI selon la matrice RBAC centralisée.
 * Ne remplace pas les gardes backend - cohérence UX uniquement.
 */
const PermissionGate: React.FC<PermissionGateProps> = ({
  module,
  action,
  children,
  mode = 'hide',
  tooltip = RBAC_DENIED_TOOLTIP,
  fallback = null,
}) => {
  const { canPerform } = usePermissions();

  if (canPerform(module, action)) {
    return children;
  }

  if (mode === 'hide') {
    return <>{fallback}</>;
  }

  const disabledChild = React.cloneElement(children, {
    disabled: true,
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
    },
    style: { ...(children.props.style ?? {}), pointerEvents: 'none' as const },
  });

  return (
    <OverlayTrigger overlay={<Tooltip>{tooltip}</Tooltip>} placement="top">
      <span className="d-inline-block">{disabledChild}</span>
    </OverlayTrigger>
  );
};

export default PermissionGate;
