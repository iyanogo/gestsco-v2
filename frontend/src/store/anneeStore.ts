/**
 * Store Zustand pour la gestion de l'année scolaire
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Annee } from '../types/reference';

interface AnneeState {
  selectedAnnee: string;
  selectedAnneeId: number | null;
  availableAnnees: Annee[];
  isLoading: boolean;
  setSelectedAnnee: (annee: string, id?: number | null) => void;
  setAvailableAnnees: (annees: Annee[]) => void;
  setLoading: (loading: boolean) => void;
  initFromActiveAnnee: (annee: Annee) => void;
}

// Détermine l'année scolaire courante (fallback)
const getCurrentAnnee = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  if (month >= 8) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

export const useAnneeStore = create<AnneeState>()(
  persist(
    (set) => ({
      selectedAnnee: getCurrentAnnee(),
      selectedAnneeId: null,
      availableAnnees: [],
      isLoading: false,
      setSelectedAnnee: (annee: string, id?: number | null) => set({ 
        selectedAnnee: annee,
        selectedAnneeId: id ?? null 
      }),
      setAvailableAnnees: (annees: Annee[]) => set({ availableAnnees: annees }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      initFromActiveAnnee: (annee: Annee) => set({
        selectedAnnee: annee.code || getCurrentAnnee(),
        selectedAnneeId: annee.id,
      }),
    }),
    {
      name: 'annee-storage',
    }
  )
);

export default useAnneeStore;
