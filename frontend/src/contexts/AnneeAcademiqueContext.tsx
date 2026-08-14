import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AnneeAcademique } from '../types/anneeAcademique';

interface AnneeAcademiqueContextType {
  anneeActuelle: AnneeAcademique | null;
  annees: AnneeAcademique[];
  loading: boolean;
  error: string | null;
  chargerAnneeCourante: () => Promise<void>;
  chargerAnnees: () => Promise<void>;
  changerAnnee: (anneeId: number) => void;
  setAnneeActuelle: (annee: AnneeAcademique | null) => void;
}

const AnneeAcademiqueContext = createContext<AnneeAcademiqueContextType | undefined>(undefined);

const STORAGE_KEY = 'annee_academique_id';

interface AnneeAcademiqueProviderProps {
  children: ReactNode;
}

export const AnneeAcademiqueProvider: React.FC<AnneeAcademiqueProviderProps> = ({ children }) => {
  const [anneeActuelle, setAnneeActuelle] = useState<AnneeAcademique | null>(null);
  const [annees, setAnnees] = useState<AnneeAcademique[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const chargerAnnees = useCallback(async () => {
    try {
      // Appel API pour récupérer toutes les années
      // const response = await anneeAcademiqueService.getAnnees();
      // setAnnees(response);
      
      // Simulation
      const mockAnnees: AnneeAcademique[] = [
        {
          id: 1,
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
        },
        {
          id: 2,
          code: '2024-2025',
          libelle: 'Année académique 2024-2025',
          date_debut: '2024-10-01',
          date_fin: '2025-07-31',
          date_debut_inscriptions: '2024-09-01',
          date_fin_inscriptions: '2024-11-30',
          is_active: false,
          is_current: false,
          statut: 'cloturee',
          est_reconduite: true
        }
      ];
      
      setAnnees(mockAnnees);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement';
      setError(message);
    }
  }, []);

  const chargerAnneeCourante = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await chargerAnnees();
      
      // Vérifier le localStorage
      const storedAnneeId = localStorage.getItem(STORAGE_KEY);
      
      if (storedAnneeId) {
        const annee = annees.find(a => a.id === parseInt(storedAnneeId));
        if (annee) {
          setAnneeActuelle(annee);
          return;
        }
      }
      
      // Sinon, prendre l'année courante
      const anneeCourante = annees.find(a => a.is_current);
      if (anneeCourante) {
        setAnneeActuelle(anneeCourante);
        localStorage.setItem(STORAGE_KEY, anneeCourante.id.toString());
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [chargerAnnees, annees]);

  const changerAnnee = useCallback((anneeId: number) => {
    const annee = annees.find(a => a.id === anneeId);
    if (annee) {
      setAnneeActuelle(annee);
      localStorage.setItem(STORAGE_KEY, anneeId.toString());
    }
  }, [annees]);

  useEffect(() => {
    chargerAnneeCourante();
  }, []);

  useEffect(() => {
    if (annees.length > 0 && !anneeActuelle) {
      const storedAnneeId = localStorage.getItem(STORAGE_KEY);
      if (storedAnneeId) {
        const annee = annees.find(a => a.id === parseInt(storedAnneeId));
        if (annee) {
          setAnneeActuelle(annee);
          return;
        }
      }
      const anneeCourante = annees.find(a => a.is_current);
      if (anneeCourante) {
        setAnneeActuelle(anneeCourante);
      }
    }
  }, [annees, anneeActuelle]);

  const value: AnneeAcademiqueContextType = {
    anneeActuelle,
    annees,
    loading,
    error,
    chargerAnneeCourante,
    chargerAnnees,
    changerAnnee,
    setAnneeActuelle
  };

  return (
    <AnneeAcademiqueContext.Provider value={value}>
      {children}
    </AnneeAcademiqueContext.Provider>
  );
};

export const useAnneeAcademiqueContext = (): AnneeAcademiqueContextType => {
  const context = useContext(AnneeAcademiqueContext);
  if (context === undefined) {
    throw new Error('useAnneeAcademiqueContext must be used within an AnneeAcademiqueProvider');
  }
  return context;
};

export default AnneeAcademiqueContext;
