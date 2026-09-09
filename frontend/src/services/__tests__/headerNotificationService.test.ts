import {
  fetchHeaderNotifications,
  getNotificationsViewAllHref,
} from '../headerNotificationService';

jest.mock('../documentEtudiantService', () => ({
  getDocuments: jest.fn(),
}));

jest.mock('../factureService', () => ({
  factureService: {
    getFacturesImpayees: jest.fn(),
  },
}));

jest.mock('../portalService', () => ({
  __esModule: true,
  default: {
    getMesDocuments: jest.fn(),
    getMesFactures: jest.fn(),
    getMesSeances: jest.fn(),
    getMesStagesEncadres: jest.fn(),
  },
}));

const { getDocuments } = jest.requireMock('../documentEtudiantService');
const { factureService } = jest.requireMock('../factureService');
const portalService = jest.requireMock('../portalService').default;

describe('headerNotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should build admin notifications from pending documents and unpaid invoices', async () => {
    getDocuments.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    factureService.getFacturesImpayees.mockResolvedValue([{ id: 10 }]);

    const canPerform = jest.fn((module: string, action: string) => {
      return module === 'etudiants' && action === 'read'
        ? true
        : module === 'finances' && action === 'read';
    });

    const items = await fetchHeaderNotifications('admin', canPerform);

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      href: '/admin/documents/liste',
      title: 'Documents à valider',
    });
    expect(items[1]).toMatchObject({
      href: '/admin/finances/factures',
      title: 'Factures impayées',
    });
  });

  it('should return empty admin notifications when permissions are denied', async () => {
    const items = await fetchHeaderNotifications('admin', () => false);
    expect(items).toEqual([]);
    expect(getDocuments).not.toHaveBeenCalled();
  });

  it('should build student notifications for refused documents and unpaid invoices', async () => {
    portalService.getMesDocuments.mockResolvedValue([
      { id: 1, statut: 'refuse', libelle: 'Carte identité', type_document: 'CI' },
      { id: 2, statut: 'en_attente', libelle: 'Photo', type_document: 'Photo' },
    ]);
    portalService.getMesFactures.mockResolvedValue([
      { id: 5, montant_restant: 1000, statut: 'en_attente' },
    ]);
    portalService.getMesSeances.mockResolvedValue([]);

    const items = await fetchHeaderNotifications('student');

    expect(items.some((item) => item.title === 'Document refusé')).toBe(true);
    expect(items.some((item) => item.title === 'Documents en cours')).toBe(true);
    expect(items.some((item) => item.title === 'Paiements en attente')).toBe(true);
  });

  it('should resolve view all href from first notification', () => {
    expect(
      getNotificationsViewAllHref('admin', [
        { id: '1', title: 'Test', message: 'Msg', href: '/admin/documents/liste' },
      ])
    ).toBe('/admin/documents/liste');
    expect(getNotificationsViewAllHref('admin', [])).toBeNull();
  });
});
