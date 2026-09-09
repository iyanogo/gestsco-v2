import api from './api';

const BASE_URL = '/api/v1/administration';

export interface SystemLog {
  id: number;
  level: string;
  source: string;
  action?: string | null;
  message: string;
  user_id?: number | null;
  user_email?: string | null;
  ip_address?: string | null;
  method?: string | null;
  path?: string | null;
  status_code?: number | null;
  created_at: string;
}

export interface SystemLogSummary {
  total: number;
  info: number;
  warning: number;
  error: number;
  success: number;
}

export interface AuditEvent {
  id: number;
  action: string;
  entity_type: string;
  entity_id: string;
  user_id?: number | null;
  user_email?: string | null;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  ip_address?: string | null;
  details?: string | null;
  created_at: string;
}

export interface BackupRun {
  id: number;
  filename: string;
  file_size_bytes?: number | null;
  backup_type: string;
  status: string;
  triggered_by_id?: number | null;
  started_at: string;
  finished_at?: string | null;
  error_message?: string | null;
  created_at: string;
}

export interface RbacMatrixRow {
  module: string;
  module_label: string;
  action: string;
  action_label: string;
  roles: string[];
}

export interface PermissionsSummary {
  total_users: number;
  active_count: number;
  inactive_count: number;
  superuser_count: number;
  by_role: Record<string, number>;
}

export interface PurgeResult {
  deleted_count: number;
  older_than_days: number;
  message: string;
}

export interface LogFilters {
  level?: string;
  source?: string;
  user_email?: string;
  search?: string;
  skip?: number;
  limit?: number;
}

export interface AuditFilters {
  action?: string;
  entity_type?: string;
  user_email?: string;
  search?: string;
  skip?: number;
  limit?: number;
}

export const getLogsSummary = async (): Promise<SystemLogSummary> => {
  const response = await api.get<SystemLogSummary>(`${BASE_URL}/logs/summary`);
  return response.data;
};

export const getLogs = async (filters: LogFilters = {}): Promise<SystemLog[]> => {
  const response = await api.get<SystemLog[]>(`${BASE_URL}/logs`, { params: filters });
  return response.data;
};

export const getAuditEvents = async (filters: AuditFilters = {}): Promise<AuditEvent[]> => {
  const response = await api.get<AuditEvent[]>(`${BASE_URL}/audit`, { params: filters });
  return response.data;
};

export const getBackups = async (skip = 0, limit = 50): Promise<BackupRun[]> => {
  const response = await api.get<BackupRun[]>(`${BASE_URL}/backups`, { params: { skip, limit } });
  return response.data;
};

export const createBackup = async (): Promise<BackupRun> => {
  const response = await api.post<BackupRun>(`${BASE_URL}/backups`);
  return response.data;
};

export const downloadBackup = async (backupId: number): Promise<void> => {
  const response = await api.get(`${BASE_URL}/backups/${backupId}/download`, {
    responseType: 'blob',
  });
  const disposition = response.headers['content-disposition'] as string | undefined;
  const match = disposition?.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] ?? `backup_${backupId}.sql`;
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const getPermissionsMatrix = async (): Promise<RbacMatrixRow[]> => {
  const response = await api.get<RbacMatrixRow[]>(`${BASE_URL}/permissions/matrix`);
  return response.data;
};

export const updatePermissionsMatrix = async (
  rows: Array<{ module: string; action: string; roles: string[] }>,
): Promise<RbacMatrixRow[]> => {
  const response = await api.put<RbacMatrixRow[]>(`${BASE_URL}/permissions/matrix`, { rows });
  return response.data;
};

export const getPermissionsSummary = async (): Promise<PermissionsSummary> => {
  const response = await api.get<PermissionsSummary>(`${BASE_URL}/permissions/summary`);
  return response.data;
};

export const restoreBackup = async (
  backupId: number,
  confirmPhrase: string,
): Promise<BackupRun> => {
  const response = await api.post<BackupRun>(`${BASE_URL}/backups/${backupId}/restore`, {
    confirm_phrase: confirmPhrase,
  });
  return response.data;
};

export const purgeLogs = async (
  olderThanDays: number,
  confirmPhrase: string,
): Promise<PurgeResult> => {
  const response = await api.post<PurgeResult>(`${BASE_URL}/logs/purge`, {
    older_than_days: olderThanDays,
    confirm_phrase: confirmPhrase,
  });
  return response.data;
};

export const purgeAudit = async (
  olderThanDays: number,
  confirmPhrase: string,
): Promise<PurgeResult> => {
  const response = await api.post<PurgeResult>(`${BASE_URL}/audit/purge`, {
    older_than_days: olderThanDays,
    confirm_phrase: confirmPhrase,
  });
  return response.data;
};

const administrationService = {
  getLogsSummary,
  getLogs,
  getAuditEvents,
  getBackups,
  createBackup,
  downloadBackup,
  restoreBackup,
  purgeLogs,
  purgeAudit,
  getPermissionsMatrix,
  updatePermissionsMatrix,
  getPermissionsSummary,
};

export default administrationService;
