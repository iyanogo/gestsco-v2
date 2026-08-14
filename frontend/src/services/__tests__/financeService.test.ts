import { factureService } from '../factureService';
import { paiementFactureService } from '../paiementFactureService';
import api from '../api';

jest.mock('../api');
const mockedApi = api as jest.Mocked<typeof api>;

const mockFactures = [
  { id: 1, numero: 'FAC-2025-001', etudiant_id: 1, montant_total: 300000, montant_paye: 150000 },
  { id: 2, numero: 'FAC-2025-002', etudiant_id: 2, montant_total: 300000, montant_paye: 300000 },
];

const mockPaiements = [
  { id: 1, facture_id: 1, montant: 150000, date_paiement: '2025-01-05', mode_paiement: 'especes' },
  { id: 2, facture_id: 2, montant: 300000, date_paiement: '2025-01-03', mode_paiement: 'virement' },
];

beforeEach(() => {
  jest.clearAllMocks();
});

describe('factureService', () => {
  describe('getFactures', () => {
    it('should fetch all factures', async () => {
      mockedApi.get.mockResolvedValue({ data: mockFactures });

      const factures = await factureService.getFactures();
      
      expect(factures).toHaveLength(2);
      expect(factures[0]).toHaveProperty('numero');
      expect(factures[0]).toHaveProperty('montant_total');
    });

    it('should handle server error', async () => {
      mockedApi.get.mockRejectedValue(new Error('Server error'));

      await expect(factureService.getFactures()).rejects.toThrow('Server error');
    });
  });

  describe('getFacturesImpayees', () => {
    it('should fetch unpaid factures', async () => {
      mockedApi.get.mockResolvedValue({ data: [mockFactures[0]] });

      const factures = await factureService.getFacturesImpayees();
      
      expect(factures).toHaveLength(1);
      expect(factures[0]).toHaveProperty('id', 1);
    });
  });
});

describe('paiementFactureService', () => {
  describe('getPaiements', () => {
    it('should fetch all paiements', async () => {
      mockedApi.get.mockResolvedValue({ data: mockPaiements });

      const paiements = await paiementFactureService.getPaiements();
      
      expect(paiements).toHaveLength(2);
      expect(paiements[0]).toHaveProperty('montant');
      expect(paiements[0]).toHaveProperty('date_paiement');
    });
  });

  describe('getPaiementsEnAttente', () => {
    it('should fetch pending payments', async () => {
      mockedApi.get.mockResolvedValue({ data: [mockPaiements[0]] });

      const paiements = await paiementFactureService.getPaiementsEnAttente();
      expect(paiements).toHaveLength(1);
    });
  });
});
