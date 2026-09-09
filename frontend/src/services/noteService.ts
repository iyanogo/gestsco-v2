/**
 * Service pour la gestion des notes
 */

import api from './api';
import {
  Note,
  NoteWithEtudiant,
  CreateNote,
  UpdateNote,
  NoteBulkCreate,
} from '../types/evaluation';

const BASE_URL = '/api/v1/notes';

export interface NoteParams {
  skip?: number;
  limit?: number;
  examen_id?: number;
  etudiant_id?: number;
  session_id?: number;
}

export const noteService = {
  /**
   * Récupère la liste des notes
   */
  async getNotes(params?: NoteParams): Promise<Note[]> {
    const response = await api.get<Note[]>(BASE_URL, { params });
    return response.data;
  },

  /**
   * Récupère les notes d'un examen avec les infos étudiants
   */
  async getNotesByExamen(examen_id: number): Promise<NoteWithEtudiant[]> {
    const response = await api.get<NoteWithEtudiant[]>(`${BASE_URL}/examen/${examen_id}`);
    return response.data;
  },

  /**
   * Récupère les notes d'un étudiant
   */
  async getNotesByEtudiant(etudiant_id: number, session_id?: number): Promise<Note[]> {
    const params = session_id ? { session_id } : {};
    const response = await api.get<Note[]>(`${BASE_URL}/etudiant/${etudiant_id}`, { params });
    return response.data;
  },

  /**
   * Récupère les notes non validées
   */
  async getNotesNonValidees(examen_id?: number): Promise<Note[]> {
    const params = examen_id ? { examen_id } : {};
    const response = await api.get<Note[]>(`${BASE_URL}/non-validees`, { params });
    return response.data;
  },

  /**
   * Récupère une note par son ID
   */
  async getNoteById(id: number): Promise<Note> {
    const response = await api.get<Note>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Crée une nouvelle note
   */
  async createNote(data: CreateNote): Promise<Note> {
    const response = await api.post<Note>(BASE_URL, data);
    return response.data;
  },

  /**
   * Crée plusieurs notes en une fois
   */
  async createNotesBulk(data: NoteBulkCreate): Promise<{ message: string; count: number; notes: Note[] }> {
    const response = await api.post<{ message: string; count: number; notes: Note[] }>(`${BASE_URL}/bulk`, data);
    return response.data;
  },

  /**
   * Met à jour une note
   */
  async updateNote(id: number, data: UpdateNote): Promise<Note> {
    const response = await api.put<Note>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Valide toutes les notes d'un examen
   */
  async validerNotesExamen(examen_id: number): Promise<{ message: string; count: number }> {
    const response = await api.patch<{ message: string; count: number }>(`${BASE_URL}/examen/${examen_id}/valider`);
    return response.data;
  },

  /**
   * Supprime une note
   */
  async deleteNote(id: number): Promise<void> {
    await api.delete(`${BASE_URL}/${id}`);
  },
};

export default noteService;
