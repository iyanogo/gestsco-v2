import {
  STATUTS_FACTURE,
  STATUTS_PAIEMENT,
  STATUTS_ECHEANCE,
  STATUTS_COMPTE,
  MODES_PAIEMENT,
  CATEGORIES_FRAIS,
  TYPES_FACTURE,
} from '../types/finance';

export const formatMontant = (montant: number, devise: string = 'XOF'): string => {
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montant);
  return `${formatted} ${devise}`;
};

export const formatStatutFacture = (
  statut: string
): { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' } => {
  const found = STATUTS_FACTURE.find((s) => s.value === statut);
  return {
    label: found?.label || statut,
    color: (found?.color as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning') || 'default',
  };
};

export const formatStatutPaiement = (
  statut: string
): { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' } => {
  const found = STATUTS_PAIEMENT.find((s) => s.value === statut);
  return {
    label: found?.label || statut,
    color: (found?.color as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning') || 'default',
  };
};

export const formatStatutEcheance = (
  statut: string
): { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' } => {
  const found = STATUTS_ECHEANCE.find((s) => s.value === statut);
  return {
    label: found?.label || statut,
    color: (found?.color as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning') || 'default',
  };
};

export const formatStatutCompte = (
  statut: string
): { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' } => {
  const found = STATUTS_COMPTE.find((s) => s.value === statut);
  return {
    label: found?.label || statut,
    color: (found?.color as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning') || 'default',
  };
};

export const formatModePaiement = (mode: string): string => {
  const found = MODES_PAIEMENT.find((m) => m.value === mode);
  return found?.label || mode;
};

export const formatCategorieFrais = (categorie: string): string => {
  const found = CATEGORIES_FRAIS.find((c) => c.value === categorie);
  return found?.label || categorie;
};

export const formatTypeFacture = (type: string): string => {
  const found = TYPES_FACTURE.find((t) => t.value === type);
  return found?.label || type;
};

export const calculerTauxRecouvrement = (
  montant_total: number,
  montant_paye: number
): number => {
  if (montant_total <= 0) return 0;
  return Math.round((montant_paye / montant_total) * 100 * 100) / 100;
};

export const formatDate = (dateString: string | null): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatDateTime = (dateString: string | null): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getCouleurSolde = (solde: number): string => {
  if (solde > 0) return 'success.main';
  if (solde < 0) return 'error.main';
  return 'text.primary';
};

export const isFactureExpiree = (facture: { date_echeance: string; statut: string }): boolean => {
  if (facture.statut === 'payee' || facture.statut === 'annulee') return false;
  const today = new Date();
  const echeance = new Date(facture.date_echeance);
  return echeance < today;
};

export const isEcheanceProche = (date_echeance: string, jours: number = 7): boolean => {
  const today = new Date();
  const echeance = new Date(date_echeance);
  const diffTime = echeance.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= jours;
};

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
