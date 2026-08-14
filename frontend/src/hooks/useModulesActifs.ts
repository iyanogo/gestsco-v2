import { useState, useEffect, useCallback } from 'react';
import { ModuleActif, ModuleSysteme } from '../types/anneeAcademique';

interface UseModulesActifsReturn {
  modulesActifs: ModuleActif[];
  modulesSysteme: ModuleSysteme[];
  loading: boolean;
  error: string | null;
  recharger: () => Promise<void>;
  activerModule: (moduleId: number, config?: Record<string, unknown>) => Promise<void>;
  desactiverModule: (moduleId: number) => Promise<void>;
  isModuleActif: (moduleCode: string) => boolean;
}

export const useModulesActifs = (
  universiteId?: number,
  anneeId?: number
): UseModulesActifsReturn => {
  const [modulesActifs, setModulesActifs] = useState<ModuleActif[]>([]);
  const [modulesSysteme, setModulesSysteme] = useState<ModuleSysteme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const chargerModules = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulation d'appel API
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockModulesSysteme: ModuleSysteme[] = [
        { id: 1, code: 'REFERENTIEL', libelle: 'Référentiel', ordre: 1, est_obligatoire: true, is_active: true },
        { id: 2, code: 'ETUDIANTS', libelle: 'Étudiants', ordre: 2, est_obligatoire: true, is_active: true },
        { id: 3, code: 'INSCRIPTIONS', libelle: 'Inscriptions', ordre: 3, est_obligatoire: true, is_active: true },
        { id: 4, code: 'EVALUATIONS', libelle: 'Évaluations', ordre: 4, est_obligatoire: true, is_active: true },
        { id: 5, code: 'EMPLOI_TEMPS', libelle: 'Emploi du temps', ordre: 5, est_obligatoire: false, is_active: true },
        { id: 6, code: 'FINANCES', libelle: 'Finances', ordre: 6, est_obligatoire: false, is_active: true },
        { id: 7, code: 'STAGES', libelle: 'Stages et Soutenances', ordre: 7, est_obligatoire: false, is_active: true },
        { id: 8, code: 'BIBLIOTHEQUE', libelle: 'Bibliothèque', ordre: 8, est_obligatoire: false, is_active: true },
        { id: 9, code: 'COMMUNICATION', libelle: 'Communication', ordre: 9, est_obligatoire: false, is_active: true }
      ];

      const mockModulesActifs: ModuleActif[] = [
        { id: 1, module_id: 1, est_actif: true, date_activation: '2025-09-01' },
        { id: 2, module_id: 2, est_actif: true, date_activation: '2025-09-01' },
        { id: 3, module_id: 3, est_actif: true, date_activation: '2025-09-01' },
        { id: 4, module_id: 4, est_actif: true, date_activation: '2025-09-01' },
        { id: 5, module_id: 6, est_actif: true, date_activation: '2025-09-01' },
        { id: 6, module_id: 7, est_actif: true, date_activation: '2025-09-01' }
      ];

      setModulesSysteme(mockModulesSysteme);
      setModulesActifs(mockModulesActifs);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [universiteId, anneeId]);

  const activerModule = useCallback(async (moduleId: number, config?: Record<string, unknown>) => {
    try {
      // Appel API
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const newModuleActif: ModuleActif = {
        id: Date.now(),
        module_id: moduleId,
        universite_id: universiteId,
        annee_academique_id: anneeId,
        est_actif: true,
        date_activation: new Date().toISOString(),
        configuration: config
      };

      setModulesActifs(prev => [...prev, newModuleActif]);
    } catch (err) {
      throw err;
    }
  }, [universiteId, anneeId]);

  const desactiverModule = useCallback(async (moduleId: number) => {
    try {
      // Appel API
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setModulesActifs(prev => prev.filter(m => m.module_id !== moduleId));
    } catch (err) {
      throw err;
    }
  }, []);

  const isModuleActif = useCallback((moduleCode: string): boolean => {
    const moduleSysteme = modulesSysteme.find(m => m.code === moduleCode);
    if (!moduleSysteme) return false;
    return modulesActifs.some(m => m.module_id === moduleSysteme.id && m.est_actif);
  }, [modulesActifs, modulesSysteme]);

  useEffect(() => {
    chargerModules();
  }, [chargerModules]);

  return {
    modulesActifs,
    modulesSysteme,
    loading,
    error,
    recharger: chargerModules,
    activerModule,
    desactiverModule,
    isModuleActif
  };
};

export default useModulesActifs;
