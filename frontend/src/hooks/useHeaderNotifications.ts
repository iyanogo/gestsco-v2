import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchHeaderNotifications,
  getNotificationsViewAllHref,
  type NotificationPortal,
} from '../services/headerNotificationService';
import { usePermissions } from './usePermissions';
import type { HeaderNotification } from '../types/notification';

export function useHeaderNotifications(portal: NotificationPortal) {
  const { canPerform, matrixLoaded } = usePermissions();
  const canPerformRef = useRef(canPerform);
  canPerformRef.current = canPerform;
  const [items, setItems] = useState<HeaderNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await fetchHeaderNotifications(portal, canPerformRef.current);
      setItems(next);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [portal]);

  useEffect(() => {
    if (portal === 'admin' && !matrixLoaded) {
      return;
    }
    refresh();
  }, [portal, matrixLoaded, refresh]);

  return {
    items,
    count: items.filter((item) => item.unread !== false).length,
    loading,
    viewAllHref: getNotificationsViewAllHref(portal, items),
    refresh,
  };
}
