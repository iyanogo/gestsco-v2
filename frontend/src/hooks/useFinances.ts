import { useState, useCallback } from 'react';
import {
  Facture,
  Paiement,
  CompteEtudiantWithDetails,
  CreateFacture,
  CreatePaiement,
  StatistiquesFinances,
} from '../types/finance';
import factureService from '../services/factureService';
import paiementFactureService from '../services/paiementFactureService';
import compteEtudiantService from '../services/compteEtudiantService';
import { downloadBlob } from '../utils/formatters';

interface UseFinancesReturn {
  factures: Facture[];
  paiements: Paiement[];
  compte: CompteEtudiantWithDetails | null;
  statistiques: StatistiquesFinances | null;
  loading: boolean;
  error: string | null;
  loadFactures: (filters?: {
    etudiant_id?: number;
    annee_id?: number;
    statut?: string;
  }) => Promise<void>;
  loadFacturesImpayees: () => Promise<void>;
  loadPaiements: (filters?: {
    facture_id?: number;
    etudiant_id?: number;
    statut?: string;
  }) => Promise<void>;
  loadPaiementsEnAttente: () => Promise<void>;
  loadCompte: (etudiantId: number, anneeId: number) => Promise<void>;
  loadStatistiques: (anneeId?: number) => Promise<void>;
  createFacture: (data: CreateFacture) => Promise<Facture | null>;
  genererFactureAuto: (
    etudiantId: number,
    anneeId: number,
    typeFacture: string
  ) => Promise<Facture | null>;
  enregistrerPaiement: (data: CreatePaiement) => Promise<Paiement | null>;
  validerPaiement: (id: number) => Promise<Paiement | null>;
  rejeterPaiement: (id: number, motif: string) => Promise<Paiement | null>;
  validerFacture: (id: number) => Promise<Facture | null>;
  annulerFacture: (id: number, motif: string) => Promise<Facture | null>;
  downloadFacturePDF: (id: number, numero: string) => Promise<void>;
  downloadRecuPDF: (id: number, numero: string) => Promise<void>;
}

export const useFinances = (): UseFinancesReturn => {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [compte, setCompte] = useState<CompteEtudiantWithDetails | null>(null);
  const [statistiques, setStatistiques] = useState<StatistiquesFinances | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFactures = useCallback(
    async (filters?: { etudiant_id?: number; annee_id?: number; statut?: string }) => {
      setLoading(true);
      setError(null);
      try {
        const data = await factureService.getFactures(filters);
        setFactures(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erreur lors du chargement des factures';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const loadFacturesImpayees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await factureService.getFacturesImpayees();
      setFactures(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPaiements = useCallback(
    async (filters?: { facture_id?: number; etudiant_id?: number; statut?: string }) => {
      setLoading(true);
      setError(null);
      try {
        const data = await paiementFactureService.getPaiements(filters);
        setPaiements(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erreur lors du chargement des paiements';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const loadPaiementsEnAttente = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await paiementFactureService.getPaiementsEnAttente();
      setPaiements(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCompte = useCallback(async (etudiantId: number, anneeId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await compteEtudiantService.getCompteEtudiant(etudiantId, anneeId);
      setCompte(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement du compte';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStatistiques = useCallback(async (anneeId?: number) => {
    setLoading(true);
    try {
      const data = await factureService.getStatistiquesFactures(anneeId);
      setStatistiques(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement des statistiques';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createFacture = useCallback(async (data: CreateFacture): Promise<Facture | null> => {
    setLoading(true);
    try {
      const facture = await factureService.createFacture(data);
      return facture;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const genererFactureAuto = useCallback(
    async (etudiantId: number, anneeId: number, typeFacture: string): Promise<Facture | null> => {
      setLoading(true);
      try {
        const facture = await factureService.genererFactureAutomatique(etudiantId, anneeId, typeFacture);
        return facture;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erreur lors de la génération';
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const enregistrerPaiement = useCallback(async (data: CreatePaiement): Promise<Paiement | null> => {
    setLoading(true);
    try {
      const paiement = await paiementFactureService.enregistrerPaiement(data);
      return paiement;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const validerPaiement = useCallback(async (id: number): Promise<Paiement | null> => {
    setLoading(true);
    try {
      const paiement = await paiementFactureService.validerPaiement(id);
      return paiement;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la validation';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const rejeterPaiement = useCallback(async (id: number, motif: string): Promise<Paiement | null> => {
    setLoading(true);
    try {
      const paiement = await paiementFactureService.rejeterPaiement(id, motif);
      return paiement;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors du rejet';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const validerFacture = useCallback(async (id: number): Promise<Facture | null> => {
    setLoading(true);
    try {
      const facture = await factureService.validerFacture(id);
      return facture;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la validation';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const annulerFacture = useCallback(async (id: number, motif: string): Promise<Facture | null> => {
    setLoading(true);
    try {
      const facture = await factureService.annulerFacture(id, motif);
      return facture;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'annulation';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadFacturePDF = useCallback(async (id: number, numero: string) => {
    try {
      const blob = await factureService.downloadFacturePDF(id);
      downloadBlob(blob, `facture_${numero}.pdf`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors du téléchargement';
      setError(message);
    }
  }, []);

  const downloadRecuPDF = useCallback(async (id: number, numero: string) => {
    try {
      const blob = await paiementFactureService.downloadRecuPDF(id);
      downloadBlob(blob, `recu_${numero}.pdf`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors du téléchargement';
      setError(message);
    }
  }, []);

  return {
    factures,
    paiements,
    compte,
    statistiques,
    loading,
    error,
    loadFactures,
    loadFacturesImpayees,
    loadPaiements,
    loadPaiementsEnAttente,
    loadCompte,
    loadStatistiques,
    createFacture,
    genererFactureAuto,
    enregistrerPaiement,
    validerPaiement,
    rejeterPaiement,
    validerFacture,
    annulerFacture,
    downloadFacturePDF,
    downloadRecuPDF,
  };
};

export default useFinances;
