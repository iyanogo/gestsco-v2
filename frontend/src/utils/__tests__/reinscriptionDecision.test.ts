import {
  getNextNiveauId,
  resolveReinscriptionDecision,
} from '../reinscriptionDecision';
import type { ResultatAnnuel } from '../../types/evaluation';

const niveaux = [
  { id: 1, code: 'L1', libelle: 'Licence 1' },
  { id: 2, code: 'L2', libelle: 'Licence 2' },
  { id: 3, code: 'L3', libelle: 'Licence 3' },
];

const lastInscription = {
  id: 10,
  etudiant_id: 1,
  filiere_id: 5,
  niveau_id: 1,
  annee_academique: '2024-2025',
  statut_inscription: 'en_cours',
} as const;

const baseResultat = (overrides: Partial<ResultatAnnuel>): ResultatAnnuel => ({
  id: 1,
  inscription_id: 10,
  etudiant_id: 1,
  niveau_id: 1,
  total_credits_inscrits: 60,
  total_credits_obtenus: 50,
  total_credits_capitalises: 50,
  statut: 'valide',
  decision: 'admis',
  passage_niveau_superieur: true,
  is_valide: true,
  moyenne_annuelle: 10,
  created_at: '',
  updated_at: '',
  ...overrides,
});

describe('reinscriptionDecision', () => {
  it('getNextNiveauId returns next level in sorted referential', () => {
    expect(getNextNiveauId(niveaux, 1)).toBe(2);
    expect(getNextNiveauId(niveaux, 3)).toBe(3);
  });

  it('admis validé avec passage → niveau supérieur', () => {
    const d = resolveReinscriptionDecision({
      etudiant: { id: 1, statut: 'actif' },
      lastPastInscription: lastInscription as any,
      resultatAnnuel: baseResultat({ decision: 'admis', passage_niveau_superieur: true }),
      niveaux,
    });
    expect(d.reinscriptionStatut).toBe('eligible');
    expect(d.niveauSuivantId).toBe(2);
    expect(d.source).toBe('deliberation');
    expect(d.isEstimation).toBe(false);
    expect(d.blockReinscription).toBe(false);
  });

  it('admis_avec_dette avec passage_niveau_superieur → niveau supérieur (LMD)', () => {
    const d = resolveReinscriptionDecision({
      etudiant: { id: 1, statut: 'actif' },
      lastPastInscription: lastInscription as any,
      resultatAnnuel: baseResultat({
        decision: 'admis_avec_dette',
        passage_niveau_superieur: true,
        moyenne_annuelle: 9.5,
      }),
      niveaux,
    });
    expect(d.niveauSuivantId).toBe(2);
    expect(d.decision).toBe('admis_avec_dette');
  });

  it('ajourne sans passage → redoublement même niveau', () => {
    const d = resolveReinscriptionDecision({
      etudiant: { id: 1, statut: 'actif' },
      lastPastInscription: lastInscription as any,
      resultatAnnuel: baseResultat({
        decision: 'ajourne',
        passage_niveau_superieur: false,
      }),
      niveaux,
    });
    expect(d.niveauSuivantId).toBe(1);
    expect(d.reinscriptionStatut).toBe('eligible');
  });

  it('exclus validé → bloqué', () => {
    const d = resolveReinscriptionDecision({
      etudiant: { id: 1, statut: 'actif' },
      lastPastInscription: lastInscription as any,
      resultatAnnuel: baseResultat({
        decision: 'exclus',
        passage_niveau_superieur: false,
        is_valide: true,
      }),
      niveaux,
    });
    expect(d.blockReinscription).toBe(true);
    expect(d.reinscriptionStatut).toBe('non_eligible');
  });

  it('résultat non validé (is_valide=false) → bloqué', () => {
    const d = resolveReinscriptionDecision({
      etudiant: { id: 1, statut: 'actif' },
      lastPastInscription: lastInscription as any,
      resultatAnnuel: baseResultat({ is_valide: false, statut: 'calcule' }),
      niveaux,
    });
    expect(d.blockReinscription).toBe(true);
    expect(d.blockReason).toMatch(/non validé/i);
  });

  it('sans ResultatAnnuel → heuristique estimation', () => {
    const d = resolveReinscriptionDecision({
      etudiant: { id: 1, statut: 'actif' },
      lastPastInscription: lastInscription as any,
      niveaux,
    });
    expect(d.source).toBe('heuristic');
    expect(d.isEstimation).toBe(true);
    expect(d.niveauSuivantId).toBe(2);
  });
});
