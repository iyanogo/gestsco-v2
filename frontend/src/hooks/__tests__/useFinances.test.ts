import { renderHook } from '@testing-library/react';
import { useFinances } from '../useFinances';

jest.mock('../../services/api');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useFinances', () => {
  describe('initial state', () => {
    it('should have initial state', () => {
      const { result } = renderHook(() => useFinances());
      
      expect(result.current.factures).toEqual([]);
      expect(result.current.paiements).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should have loadFactures function', () => {
      const { result } = renderHook(() => useFinances());
      
      expect(typeof result.current.loadFactures).toBe('function');
    });

    it('should have loadPaiements function', () => {
      const { result } = renderHook(() => useFinances());
      
      expect(typeof result.current.loadPaiements).toBe('function');
    });

    it('should have loadPaiementsEnAttente function', () => {
      const { result } = renderHook(() => useFinances());
      
      expect(typeof result.current.loadPaiementsEnAttente).toBe('function');
    });
  });
});
