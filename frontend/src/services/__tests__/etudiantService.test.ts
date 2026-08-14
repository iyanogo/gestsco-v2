import * as etudiantService from '../etudiantService';
import api from '../api';

jest.mock('../api');
const mockedApi = api as jest.Mocked<typeof api>;

const mockEtudiants = [
  { id: 1, matricule: '2024-0001', nom: 'Diallo', prenom: 'Amadou', email: 'amadou@email.com' },
  { id: 2, matricule: '2024-0002', nom: 'Sow', prenom: 'Fatou', email: 'fatou@email.com' },
];

beforeEach(() => {
  jest.clearAllMocks();
});

describe('etudiantService', () => {
  describe('getEtudiants', () => {
    it('should fetch all students', async () => {
      mockedApi.get.mockResolvedValue({ data: mockEtudiants });

      const etudiants = await etudiantService.getEtudiants();
      
      expect(etudiants).toHaveLength(2);
      expect(etudiants[0]).toHaveProperty('matricule');
      expect(etudiants[0]).toHaveProperty('nom');
      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/etudiants/', { params: undefined });
    });

    it('should handle server error', async () => {
      mockedApi.get.mockRejectedValue(new Error('Server error'));

      await expect(etudiantService.getEtudiants()).rejects.toThrow('Server error');
    });

    it('should pass search params', async () => {
      mockedApi.get.mockResolvedValue({ data: mockEtudiants });

      await etudiantService.getEtudiants({ search: 'Diallo', limit: 10 });
      
      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/etudiants/', { 
        params: { search: 'Diallo', limit: 10 } 
      });
    });
  });

  describe('getEtudiantById', () => {
    it('should fetch a single student by id', async () => {
      mockedApi.get.mockResolvedValue({ data: mockEtudiants[0] });

      const etudiant = await etudiantService.getEtudiantById(1);
      
      expect(etudiant).toHaveProperty('id', 1);
      expect(etudiant).toHaveProperty('matricule', '2024-0001');
      expect(etudiant).toHaveProperty('nom', 'Diallo');
    });

    it('should throw error for non-existent student', async () => {
      mockedApi.get.mockRejectedValue(new Error('Not found'));

      await expect(etudiantService.getEtudiantById(999)).rejects.toThrow('Not found');
    });
  });

  describe('createEtudiant', () => {
    it('should create a new student', async () => {
      const newEtudiant = {
        matricule: '2024-0004',
        nom: 'Test',
        prenom: 'User',
        email: 'test@email.com',
        filiere_id: 1,
        niveau_id: 1,
      };
      mockedApi.post.mockResolvedValue({ data: { id: 4, ...newEtudiant } });

      const result = await etudiantService.createEtudiant(newEtudiant as any);
      
      expect(result).toHaveProperty('id', 4);
      expect(result.matricule).toBe('2024-0004');
    });

    it('should handle validation error', async () => {
      mockedApi.post.mockRejectedValue(new Error('Validation error'));

      await expect(etudiantService.createEtudiant({} as any)).rejects.toThrow('Validation error');
    });
  });

  describe('updateEtudiant', () => {
    it('should update an existing student', async () => {
      const updates = { nom: 'Updated Name' };
      mockedApi.put.mockResolvedValue({ data: { ...mockEtudiants[0], nom: 'Updated Name' } });
      
      const result = await etudiantService.updateEtudiant(1, updates);
      
      expect(result).toHaveProperty('id', 1);
      expect(result.nom).toBe('Updated Name');
    });
  });

  describe('deleteEtudiant', () => {
    it('should delete a student', async () => {
      mockedApi.delete.mockResolvedValue({ data: { message: 'Deleted' } });

      await expect(etudiantService.deleteEtudiant(1)).resolves.not.toThrow();
    });

    it('should throw error for non-existent student', async () => {
      mockedApi.delete.mockRejectedValue(new Error('Not found'));

      await expect(etudiantService.deleteEtudiant(999)).rejects.toThrow('Not found');
    });
  });
});
