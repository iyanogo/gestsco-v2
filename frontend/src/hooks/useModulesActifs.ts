import { useState, useEffect, useCallback } from 'react';
import moduleSystemeService from '../services/moduleSystemeService';
import type { ModuleActif, ModuleSysteme } from '../types/anneeAcademique';

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
  anneeId?: number,
): UseModulesActifsReturn => {
  const [modulesActifs, setModulesActifs] = useState<ModuleActif[]>([]);
  const [modulesSysteme, setModulesSysteme] = useState<ModuleSysteme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const chargerModules = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [allModules, actifs] = await Promise.all([
        moduleSystemeService.getModulesSysteme(),
        moduleSystemeService.getModulesActifs(universiteId, anneeId),
      ]);

      setModulesSysteme(allModules);

      const actifCodes = new Set(actifs.map((m) => m.code));
      const actifsMapped: ModuleActif[] = allModules
        .filter((m) => actifCodes.has(m.code))
        .map((m) => ({
          id: m.id,
          module_id: m.id,
          universite_id: universiteId,
          annee_academique_id: anneeId,
          est_actif: true,
        }));

      setModulesActifs(actifsMapped);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement des modules';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [universiteId, anneeId]);

  const activerModule = useCallback(
    async (moduleId: number, config?: Record<string, unknown>) => {
      const module = modulesSysteme.find((m) => m.id === moduleId);
      if (!module) {
        throw new Error('Module introuvable');
      }

      await moduleSystemeService.activerModule(module.code, {
        universite_id: universiteId,
        annee_id: anneeId,
        configuration: config,
      });

      await chargerModules();
    },
    [modulesSysteme, universiteId, anneeId, chargerModules],
  );

  const desactiverModule = useCallback(
    async (moduleId: number) => {
      const module = modulesSysteme.find((m) => m.id === moduleId);
      if (!module) {
        throw new Error('Module introuvable');
      }

      await moduleSystemeService.desactiverModule(module.code, {
        universite_id: universiteId,
        annee_id: anneeId,
      });

      await chargerModules();
    },
    [modulesSysteme, universiteId, anneeId, chargerModules],
  );

  const isModuleActif = useCallback(
    (moduleCode: string): boolean => {
      const module = modulesSysteme.find((m) => m.code === moduleCode);
      if (!module) return false;
      return modulesActifs.some((m) => m.module_id === module.id && m.est_actif);
    },
    [modulesActifs, modulesSysteme],
  );

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
    isModuleActif,
  };
};

export default useModulesActifs;
