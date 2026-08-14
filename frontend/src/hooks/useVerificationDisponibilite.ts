import { useState, useEffect, useCallback, useRef } from 'react';

interface Conflit {
  type: string;
  description: string;
  heureDebut: string;
  heureFin: string;
}

interface UseVerificationDisponibiliteReturn {
  estDisponible: boolean | null;
  conflit: Conflit | null;
  loading: boolean;
  verifier: () => Promise<void>;
}

export const useVerificationDisponibilite = (
  type: 'salle' | 'enseignant',
  id: number | undefined,
  date: string | undefined,
  heureDebut: string | undefined,
  heureFin: string | undefined
): UseVerificationDisponibiliteReturn => {
  const [estDisponible, setEstDisponible] = useState<boolean | null>(null);
  const [conflit, setConflit] = useState<Conflit | null>(null);
  const [loading, setLoading] = useState(false);
  
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const verifier = useCallback(async () => {
    if (!id || !date || !heureDebut || !heureFin) {
      setEstDisponible(null);
      setConflit(null);
      return;
    }

    setLoading(true);

    try {
      // Simulation d'appel API avec délai
      await new Promise(resolve => setTimeout(resolve, 300));

      // Simulation de résultat (à remplacer par un vrai appel API)
      // const response = await disponibiliteService.verifier({ type, id, date, heureDebut, heureFin });
      
      const disponible = Math.random() > 0.2;
      
      if (disponible) {
        setEstDisponible(true);
        setConflit(null);
      } else {
        setEstDisponible(false);
        setConflit({
          type: type === 'salle' ? 'Réservation' : 'Cours',
          description: type === 'salle' 
            ? 'Salle réservée pour un examen' 
            : 'Enseignant en cours',
          heureDebut: '10:00',
          heureFin: '12:00'
        });
      }
    } catch (error) {
      setEstDisponible(null);
      setConflit(null);
    } finally {
      setLoading(false);
    }
  }, [type, id, date, heureDebut, heureFin]);

  useEffect(() => {
    // Debounce pour éviter trop d'appels
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      verifier();
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [verifier]);

  return {
    estDisponible,
    conflit,
    loading,
    verifier
  };
};

export default useVerificationDisponibilite;
