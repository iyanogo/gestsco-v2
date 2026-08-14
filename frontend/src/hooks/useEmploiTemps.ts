import { useState, useCallback } from 'react';
import {
  SeanceWithDetails,
  CreateSeance,
  UpdateSeance,
  CreateSeanceRecurrente,
  Conflits,
  JourSemaine,
} from '../types/emploiTemps';
import { seanceService } from '../services/seanceService';

interface UseEmploiTempsOptions {
  niveauId?: number;
  filiereId?: number;
  semestre?: number;
  anneeAcademiqueId?: number;
}

interface UseEmploiTempsReturn {
  seances: SeanceWithDetails[];
  loading: boolean;
  error: string | null;
  loadSeances: (dateDebut: string) => Promise<void>;
  createSeance: (data: CreateSeance) => Promise<SeanceWithDetails | null>;
  createSeanceRecurrente: (data: CreateSeanceRecurrente) => Promise<SeanceWithDetails[]>;
  updateSeance: (id: number, data: UpdateSeance) => Promise<SeanceWithDetails | null>;
  deleteSeance: (id: number) => Promise<boolean>;
  verifierDisponibilite: (
    date: string,
    creneauId: number,
    salleId?: number,
    enseignantId?: number
  ) => Promise<Conflits>;
  confirmerSeance: (id: number) => Promise<SeanceWithDetails | null>;
  annulerSeance: (id: number, motif: string) => Promise<SeanceWithDetails | null>;
  reporterSeance: (id: number, nouvelleDate: string, nouveauCreneauId: number) => Promise<SeanceWithDetails | null>;
  refresh: () => void;
}

export const useEmploiTemps = (options: UseEmploiTempsOptions = {}): UseEmploiTempsReturn => {
  const [seances, setSeances] = useState<SeanceWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDateDebut, setLastDateDebut] = useState<string>('');

  const { niveauId, filiereId } = options;

  const loadSeances = useCallback(async (dateDebut: string) => {
    if (!niveauId) {
      setSeances([]);
      return;
    }

    setLoading(true);
    setError(null);
    setLastDateDebut(dateDebut);

    try {
      const joursData = await seanceService.getSeancesSemaine(dateDebut, niveauId, filiereId);
      const allSeances = joursData.flatMap((jour: JourSemaine) => jour.seances);
      setSeances(allSeances);
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Erreur lors du chargement des séances';
      setError(message);
      console.error('Erreur loadSeances:', err);
    } finally {
      setLoading(false);
    }
  }, [niveauId, filiereId]);

  const createSeance = useCallback(async (data: CreateSeance): Promise<SeanceWithDetails | null> => {
    setLoading(true);
    setError(null);

    try {
      const seance = await seanceService.createSeance(data);
      // Recharger les séances
      if (lastDateDebut) {
        await loadSeances(lastDateDebut);
      }
      return seance as SeanceWithDetails;
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Erreur lors de la création de la séance';
      setError(message);
      console.error('Erreur createSeance:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [lastDateDebut, loadSeances]);

  const createSeanceRecurrente = useCallback(async (data: CreateSeanceRecurrente): Promise<SeanceWithDetails[]> => {
    setLoading(true);
    setError(null);

    try {
      const seances = await seanceService.createSeanceRecurrente(data);
      // Recharger les séances
      if (lastDateDebut) {
        await loadSeances(lastDateDebut);
      }
      return seances as SeanceWithDetails[];
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Erreur lors de la création des séances récurrentes';
      setError(message);
      console.error('Erreur createSeanceRecurrente:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [lastDateDebut, loadSeances]);

  const updateSeance = useCallback(async (id: number, data: UpdateSeance): Promise<SeanceWithDetails | null> => {
    setLoading(true);
    setError(null);

    try {
      const seance = await seanceService.updateSeance(id, data);
      // Recharger les séances
      if (lastDateDebut) {
        await loadSeances(lastDateDebut);
      }
      return seance as SeanceWithDetails;
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Erreur lors de la modification de la séance';
      setError(message);
      console.error('Erreur updateSeance:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [lastDateDebut, loadSeances]);

  const deleteSeance = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await seanceService.deleteSeance(id);
      // Recharger les séances
      if (lastDateDebut) {
        await loadSeances(lastDateDebut);
      }
      return true;
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Erreur lors de la suppression de la séance';
      setError(message);
      console.error('Erreur deleteSeance:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [lastDateDebut, loadSeances]);

  const verifierDisponibilite = useCallback(async (
    date: string,
    creneauId: number,
    salleId?: number,
    enseignantId?: number
  ): Promise<Conflits> => {
    try {
      return await seanceService.verifierConflits(date, creneauId, salleId, enseignantId);
    } catch (err: any) {
      console.error('Erreur verifierDisponibilite:', err);
      return { salle: null, enseignant: null };
    }
  }, []);

  const confirmerSeance = useCallback(async (id: number): Promise<SeanceWithDetails | null> => {
    setLoading(true);
    setError(null);

    try {
      const seance = await seanceService.confirmerSeance(id);
      // Recharger les séances
      if (lastDateDebut) {
        await loadSeances(lastDateDebut);
      }
      return seance as SeanceWithDetails;
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Erreur lors de la confirmation de la séance';
      setError(message);
      console.error('Erreur confirmerSeance:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [lastDateDebut, loadSeances]);

  const annulerSeance = useCallback(async (id: number, motif: string): Promise<SeanceWithDetails | null> => {
    setLoading(true);
    setError(null);

    try {
      const seance = await seanceService.annulerSeance(id, motif);
      // Recharger les séances
      if (lastDateDebut) {
        await loadSeances(lastDateDebut);
      }
      return seance as SeanceWithDetails;
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Erreur lors de l\'annulation de la séance';
      setError(message);
      console.error('Erreur annulerSeance:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [lastDateDebut, loadSeances]);

  const reporterSeance = useCallback(async (
    id: number,
    nouvelleDate: string,
    nouveauCreneauId: number
  ): Promise<SeanceWithDetails | null> => {
    setLoading(true);
    setError(null);

    try {
      const seance = await seanceService.reporterSeance(id, nouvelleDate, nouveauCreneauId);
      // Recharger les séances
      if (lastDateDebut) {
        await loadSeances(lastDateDebut);
      }
      return seance as SeanceWithDetails;
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Erreur lors du report de la séance';
      setError(message);
      console.error('Erreur reporterSeance:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [lastDateDebut, loadSeances]);

  const refresh = useCallback(() => {
    if (lastDateDebut) {
      loadSeances(lastDateDebut);
    }
  }, [lastDateDebut, loadSeances]);

  return {
    seances,
    loading,
    error,
    loadSeances,
    createSeance,
    createSeanceRecurrente,
    updateSeance,
    deleteSeance,
    verifierDisponibilite,
    confirmerSeance,
    annulerSeance,
    reporterSeance,
    refresh,
  };
};

export default useEmploiTemps;
