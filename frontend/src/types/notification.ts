export type HeaderNotificationVariant = 'info' | 'success' | 'warning' | 'danger';

export interface HeaderNotification {
  id: string;
  title: string;
  message: string;
  href: string;
  variant?: HeaderNotificationVariant;
  unread?: boolean;
}
