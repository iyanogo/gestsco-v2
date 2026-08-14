import { useState, useEffect, useCallback } from 'react';
import { AnneeAcademique } from '../types/anneeAcademique';

const STORAGE_KEY = 'annee_academique_courante';

interface UseAnneeAcademiqueReturn {
  anneeActuelle: AnneeAcademique | null;
  loading: boolean;
  error: string | null;
  chargerAnneeCourante: () => Promise<void>;
  changerAnnee: (anneeId: number) => Promise<void>;
  setAnneeActuelle: (annee: AnneeAcademique | null) => void;
}

export const useAnneeAcademique = (): UseAnneeAcademiqueReturn => {
  const [anneeActuelle, setAnneeActuelle] = useState<AnneeAcademique | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const chargerAnneeCourante = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Vérifier le localStorage
      const storedAnneeId = localStorage.getItem(STORAGE_KEY);
      
      // Appel API pour récupérer l'année courante ou celle stockée
      // const response = await anneeAcademiqueService.getAnneeCourante();
      // setAnneeActuelle(response);
      
      // Simulation
      const mockAnnee: AnneeAcademique = {
        id: storedAnneeId ? parseInt(storedAnneeId) : 1,
        code: '2025-2026',
        libelle: 'Année académique 2025-2026',
        date_debut: '2025-10-01',
        date_fin: '2026-07-31',
        date_debut_inscriptions: '2025-09-01',
        date_fin_inscriptions: '2025-11-30',
        is_active: true,
        is_current: true,
        semestre_actif: 1,
        date_debut_semestre1: '2025-10-01',
        date_fin_semestre1: '2026-02-28',
        date_debut_semestre2: '2026-03-01',
        date_fin_semestre2: '2026-07-31',
        statut: 'en_cours',
        est_reconduite: false
      };
      
      setAnneeActuelle(mockAnnee);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const changerAnnee = useCallback(async (anneeId: number) => {
    setLoading(true);
    setError(null);

    try {
      // Appel API pour récupérer l'année sélectionnée
      // const response = await anneeAcademiqueService.getById(anneeId);
      // setAnneeActuelle(response);
      
      // Sauvegarder dans localStorage
      localStorage.setItem(STORAGE_KEY, anneeId.toString());
      
      // Recharger l'année
      await chargerAnneeCourante();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du changement';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [chargerAnneeCourante]);

  useEffect(() => {
    chargerAnneeCourante();
  }, [chargerAnneeCourante]);

  return {
    anneeActuelle,
    loading,
    error,
    chargerAnneeCourante,
    changerAnnee,
    setAnneeActuelle
  };
};

export default useAnneeAcademique;
