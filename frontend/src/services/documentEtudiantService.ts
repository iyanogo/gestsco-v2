/**
 * Service pour la gestion des documents des étudiants
 */

import api from './api';
import type {
  DocumentEtudiant,
  CreateDocumentEtudiant,
  UpdateDocumentEtudiant,
} from '../types/etudiant';
import type { MessageResponse } from '../types/reference';

interface GetDocumentsParams {
  skip?: number;
  limit?: number;
  etudiant_id?: number;
  type_document?: string;
  statut?: string;
}

/**
 * Récupère la liste des documents.
 */
export async function getDocuments(params?: GetDocumentsParams): Promise<DocumentEtudiant[]> {
  const response = await api.get<DocumentEtudiant[]>('/api/v1/documents-etudiant/', { params });
  return response.data;
}

/**
 * Récupère un document par son ID.
 */
export async function getDocumentById(id: number): Promise<DocumentEtudiant> {
  const response = await api.get<DocumentEtudiant>(`/api/v1/documents-etudiant/${id}`);
  return response.data;
}

/**
 * Récupère les documents d'un étudiant.
 */
export async function getDocumentsByEtudiant(etudiant_id: number): Promise<DocumentEtudiant[]> {
  const response = await api.get<DocumentEtudiant[]>(`/api/v1/documents-etudiant/etudiant/${etudiant_id}`);
  return response.data;
}

/**
 * Crée un nouveau document.
 */
export async function createDocument(data: CreateDocumentEtudiant): Promise<DocumentEtudiant> {
  const response = await api.post<DocumentEtudiant>('/api/v1/documents-etudiant/', data);
  return response.data;
}

/**
 * Met à jour un document.
 */
export async function updateDocument(id: number, data: UpdateDocumentEtudiant): Promise<DocumentEtudiant> {
  const response = await api.put<DocumentEtudiant>(`/api/v1/documents-etudiant/${id}`, data);
  return response.data;
}

/**
 * Valide un document.
 */
export async function validerDocument(id: number, commentaire?: string): Promise<DocumentEtudiant> {
  const response = await api.patch<DocumentEtudiant>(
    `/api/v1/documents-etudiant/${id}/valider`,
    commentaire ? { commentaire } : {}
  );
  return response.data;
}

/**
 * Refuse un document.
 */
export async function refuserDocument(id: number, commentaire: string): Promise<DocumentEtudiant> {
  const response = await api.patch<DocumentEtudiant>(
    `/api/v1/documents-etudiant/${id}/refuser`,
    { commentaire }
  );
  return response.data;
}

/**
 * Supprime un document.
 */
export async function deleteDocument(id: number): Promise<MessageResponse> {
  const response = await api.delete<MessageResponse>(`/api/v1/documents-etudiant/${id}`);
  return response.data;
}
