import api from './api';
import { 
  ReservationSalle, 
  CreateReservationSalle, 
  UpdateReservationSalle 
} from '../types/emploiTemps';

const BASE_URL = '/api/v1/reservations-salles';

export interface GetReservationsParams {
  skip?: number;
  limit?: number;
  salle_id?: number;
  date?: string;
  statut?: string;
  demandeur_id?: number;
}

export const reservationSalleService = {
  getReservations: async (params?: GetReservationsParams): Promise<ReservationSalle[]> => {
    const response = await api.get<ReservationSalle[]>(BASE_URL, { params });
    return response.data;
  },

  getMesReservations: async (statut?: string): Promise<ReservationSalle[]> => {
    const response = await api.get<ReservationSalle[]>(`${BASE_URL}/mes-reservations`, {
      params: statut ? { statut } : undefined,
    });
    return response.data;
  },

  getReservationsEnAttente: async (): Promise<ReservationSalle[]> => {
    const response = await api.get<ReservationSalle[]>(`${BASE_URL}/en-attente`);
    return response.data;
  },

  getReservationById: async (id: number): Promise<ReservationSalle> => {
    const response = await api.get<ReservationSalle>(`${BASE_URL}/${id}`);
    return response.data;
  },

  createReservation: async (data: CreateReservationSalle): Promise<ReservationSalle> => {
    const response = await api.post<ReservationSalle>(BASE_URL, data);
    return response.data;
  },

  updateReservation: async (id: number, data: UpdateReservationSalle): Promise<ReservationSalle> => {
    const response = await api.put<ReservationSalle>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  approuverReservation: async (id: number): Promise<ReservationSalle> => {
    const response = await api.patch<ReservationSalle>(`${BASE_URL}/${id}/approuver`);
    return response.data;
  },

  refuserReservation: async (id: number, motif_refus: string): Promise<ReservationSalle> => {
    const response = await api.patch<ReservationSalle>(`${BASE_URL}/${id}/refuser`, {
      motif_refus,
    });
    return response.data;
  },

  annulerReservation: async (id: number): Promise<ReservationSalle> => {
    const response = await api.patch<ReservationSalle>(`${BASE_URL}/${id}/annuler`);
    return response.data;
  },

  deleteReservation: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },
};

export default reservationSalleService;
