/**
 * Résolution du passage de niveau pour les réinscriptions.
 * Source prioritaire : ResultatAnnuel validé (délibération).
 * Repli : heuristique référentiel (estimation explicite).
 */

import type { Etudiant, Inscription } from '../types/etudiant';
import type { Niveau } from '../types/reference';
import type { DecisionResultat, ResultatAnnuel } from '../types/evaluation';

export type ReinscriptionStatut = 'eligible' | 'reinscrit' | 'non_eligible';
export type DecisionSource = 'deliberation' | 'heuristic' | 'none';

export interface ReinscriptionDecisionInput {
  etudiant: Pick<Etudiant, 'id' | 'statut'>;
  activeInscription?: Inscription;
  lastPastInscription?: Inscription;
  resultatAnnuel?: ResultatAnnuel | null;
  niveaux: Niveau[];
}

export interface ReinscriptionDecision {
  reinscriptionStatut: ReinscriptionStatut;
  /** Décision affichée (API ou dérivée) */
  decision: DecisionResultat | 'exclu' | '-';
  niveauActuelId?: number;
  niveauSuivantId?: number;
  moyenne: number | null;
  source: DecisionSource;
  /** Réinscription bloquée (exclus, délibération non validée) */
  blockReinscription: boolean;
  blockReason?: string;
  /** Repli heuristique - à confirmer par l'utilisateur */
  isEstimation: boolean;
  lastInscriptionId?: number;
  filiereId?: number;
}

export const sortNiveaux = (niveaux: Niveau[]): Niveau[] =>
  [...niveaux].sort((a, b) => (a.code || a.libelle || '').localeCompare(b.code || b.libelle || ''));

export const getNextNiveauId = (niveaux: Niveau[], currentId?: number): number | undefined => {
  if (!currentId) return undefined;
  const sorted = sortNiveaux(niveaux);
  const idx = sorted.findIndex((n) => n.id === currentId);
  if (idx >= 0 && idx < sorted.length - 1) return sorted[idx + 1].id;
  return currentId;
};

const appliesPassage = (resultat: ResultatAnnuel): boolean => {
  if (resultat.passage_niveau_superieur) return true;
  return resultat.decision === 'admis' || resultat.decision === 'admis_avec_dette';
};

/**
 * admis_avec_dette : passage autorisé si passage_niveau_superieur=true
 * (aligné deliberation_rules.py + SYSTEME_LMD.md « Admis conditionnel : Passage avec dettes »).
 */
export function resolveReinscriptionDecision(input: ReinscriptionDecisionInput): ReinscriptionDecision {
  const {
    etudiant,
    activeInscription,
    lastPastInscription,
    resultatAnnuel,
    niveaux,
  } = input;

  const base = {
    moyenne: null as number | null,
    source: 'none' as DecisionSource,
    blockReinscription: false,
    isEstimation: false,
  };

  if (etudiant.statut === 'exclu') {
    return {
      ...base,
      reinscriptionStatut: 'non_eligible',
      decision: 'exclu',
      blockReinscription: true,
      blockReason: 'Étudiant exclu - réinscription impossible.',
    };
  }

  if (activeInscription) {
    return {
      ...base,
      reinscriptionStatut: 'reinscrit',
      decision: '-',
      niveauActuelId: activeInscription.niveau_id,
      niveauSuivantId: activeInscription.niveau_id,
      filiereId: activeInscription.filiere_id,
      lastInscriptionId: activeInscription.id,
    };
  }

  if (!lastPastInscription || etudiant.statut === 'suspendu') {
    return {
      ...base,
      reinscriptionStatut: 'non_eligible',
      decision: '-',
    };
  }

  const niveauActuelId = lastPastInscription.niveau_id;
  const filiereId = lastPastInscription.filiere_id;
  const lastInscriptionId = lastPastInscription.id;

  if (resultatAnnuel) {
    const moyenne = resultatAnnuel.moyenne_annuelle ?? null;

    if (!resultatAnnuel.is_valide) {
      return {
        ...base,
        reinscriptionStatut: 'non_eligible',
        decision: resultatAnnuel.decision,
        niveauActuelId,
        niveauSuivantId: niveauActuelId,
        moyenne,
        source: 'deliberation',
        blockReinscription: true,
        blockReason:
          'Résultat annuel non validé par le jury - réinscription impossible tant que la délibération n\'est pas officialisée.',
        filiereId,
        lastInscriptionId,
      };
    }

    if (resultatAnnuel.decision === 'exclus') {
      return {
        ...base,
        reinscriptionStatut: 'non_eligible',
        decision: 'exclus',
        niveauActuelId,
        niveauSuivantId: niveauActuelId,
        moyenne,
        source: 'deliberation',
        blockReinscription: true,
        blockReason: 'Décision de délibération : exclus - réinscription impossible.',
        filiereId,
        lastInscriptionId,
      };
    }

    const passage = appliesPassage(resultatAnnuel);
    const niveauSuivantId = passage
      ? getNextNiveauId(niveaux, niveauActuelId)
      : niveauActuelId;

    return {
      reinscriptionStatut: 'eligible',
      decision: resultatAnnuel.decision,
      niveauActuelId,
      niveauSuivantId,
      moyenne,
      source: 'deliberation',
      blockReinscription: false,
      isEstimation: false,
      filiereId,
      lastInscriptionId,
    };
  }

  // Repli heuristique - aucun ResultatAnnuel pour l'inscription précédente
  const niveauSuivantId = getNextNiveauId(niveaux, niveauActuelId);
  const heuristicPassage = niveauSuivantId !== niveauActuelId;

  return {
    reinscriptionStatut: 'eligible',
    decision: heuristicPassage ? 'admis' : 'ajourne',
    niveauActuelId,
    niveauSuivantId,
    moyenne: null,
    source: 'heuristic',
    blockReinscription: false,
    isEstimation: true,
    filiereId,
    lastInscriptionId,
  };
}
