/**
 * Gestionnaire d'erreurs API
 */

import { AxiosError } from 'axios';

interface ApiErrorResponse {
  detail?: string;
  message?: string;
}

/**
 * Gère les erreurs API et retourne un message utilisateur approprié.
 * @param error - L'erreur à traiter
 * @returns Message d'erreur formaté
 */
export function handleApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    const response = error.response;
    
    if (response) {
      const data = response.data as ApiErrorResponse;
      
      // Message d'erreur de l'API
      if (data?.detail) {
        return data.detail;
      }
      
      if (data?.message) {
        return data.message;
      }
      
      // Codes d'erreur HTTP standards
      switch (response.status) {
        case 400:
          return 'Requête invalide. Veuillez vérifier les données saisies.';
        case 401:
          return 'Session expirée, veuillez vous reconnecter.';
        case 403:
          return "Vous n'avez pas les permissions nécessaires.";
        case 404:
          return 'Ressource non trouvée.';
        case 409:
          return 'Conflit : cette ressource existe déjà.';
        case 422:
          return 'Données invalides. Veuillez vérifier les champs.';
        case 500:
          return 'Erreur serveur. Veuillez réessayer plus tard.';
        default:
          return `Erreur ${response.status}: ${response.statusText}`;
      }
    }
    
    // Erreur réseau
    if (error.code === 'ERR_NETWORK') {
      return 'Erreur de connexion. Vérifiez votre connexion internet.';
    }
    
    if (error.code === 'ECONNABORTED') {
      return 'La requête a expiré. Veuillez réessayer.';
    }
  }
  
  // Erreur générique avec message
  if (error instanceof Error && error.message) {
    return error.message;
  }
  
  return "Une erreur inattendue s'est produite.";
}

/**
 * Vérifie si l'erreur est une erreur d'authentification.
 * @param error - L'erreur à vérifier
 * @returns true si c'est une erreur 401
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.response?.status === 401;
  }
  return false;
}

/**
 * Vérifie si l'erreur est une erreur de permission.
 * @param error - L'erreur à vérifier
 * @returns true si c'est une erreur 403
 */
export function isPermissionError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.response?.status === 403;
  }
  return false;
}
