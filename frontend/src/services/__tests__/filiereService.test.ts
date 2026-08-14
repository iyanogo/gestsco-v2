import * as filiereService from '../filiereService';
import api from '../api';

jest.mock('../api');
const mockedApi = api as jest.Mocked<typeof api>;

const mockFilieres = [
  { id: 1, code: 'INFO', libelle: 'Informatique', description: 'Filière informatique' },
  { id: 2, code: 'GESTION', libelle: 'Gestion', description: 'Filière gestion' },
];

beforeEach(() => {
  jest.clearAllMocks();
});

describe('filiereService', () => {
  describe('getFilieres', () => {
    it('should fetch all filieres', async () => {
      mockedApi.get.mockResolvedValue({ data: mockFilieres });

      const filieres = await filiereService.getFilieres();
      
      expect(filieres).toHaveLength(2);
      expect(filieres[0]).toHaveProperty('code');
      expect(filieres[0]).toHaveProperty('libelle');
    });

    it('should handle server error', async () => {
      mockedApi.get.mockRejectedValue(new Error('Server error'));

      await expect(filiereService.getFilieres()).rejects.toThrow('Server error');
    });
  });

  describe('getFiliereById', () => {
    it('should fetch a single filiere by id', async () => {
      mockedApi.get.mockResolvedValue({ data: mockFilieres[0] });

      const filiere = await filiereService.getFiliereById(1);
      
      expect(filiere).toHaveProperty('id', 1);
      expect(filiere).toHaveProperty('code', 'INFO');
    });

    it('should throw error for non-existent filiere', async () => {
      mockedApi.get.mockRejectedValue(new Error('Not found'));

      await expect(filiereService.getFiliereById(999)).rejects.toThrow('Not found');
    });
  });

  describe('createFiliere', () => {
    it('should create a new filiere', async () => {
      const newFiliere = {
        code: 'TEST',
        nom: 'Test Filière',
        description: 'Description test',
      };
      mockedApi.post.mockResolvedValue({ data: { id: 3, ...newFiliere } });

      const result = await filiereService.createFiliere(newFiliere as any);
      
      expect(result).toHaveProperty('id', 3);
      expect(result.code).toBe('TEST');
    });

    it('should handle duplicate code error', async () => {
      mockedApi.post.mockRejectedValue(new Error('Code already exists'));

      await expect(filiereService.createFiliere({ code: 'INFO', nom: 'Test' } as any))
        .rejects.toThrow('Code already exists');
    });
  });

  describe('updateFiliere', () => {
    it('should update an existing filiere', async () => {
      const updates = { libelle: 'Updated Filière' };
      mockedApi.put.mockResolvedValue({ data: { ...mockFilieres[0], libelle: 'Updated Filière' } });
      
      const result = await filiereService.updateFiliere(1, updates);
      
      expect(result).toHaveProperty('id', 1);
      expect(result.libelle).toBe('Updated Filière');
    });
  });

  describe('deleteFiliere', () => {
    it('should delete a filiere', async () => {
      mockedApi.delete.mockResolvedValue({ data: { message: 'Deleted' } });

      await expect(filiereService.deleteFiliere(1)).resolves.not.toThrow();
    });

    it('should throw error when filiere has students', async () => {
      mockedApi.delete.mockRejectedValue(new Error('Cannot delete: has students'));

      await expect(filiereService.deleteFiliere(1)).rejects.toThrow('Cannot delete: has students');
    });
  });
});
