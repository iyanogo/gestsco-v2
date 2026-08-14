import { http, HttpResponse } from 'msw';

const API_URL = '/api/v1';

// Mock data
export const mockEtudiants = [
  { id: 1, matricule: '2024-0001', nom: 'Diallo', prenom: 'Amadou', email: 'amadou.diallo@email.com', filiere_id: 1, niveau_id: 1 },
  { id: 2, matricule: '2024-0002', nom: 'Sow', prenom: 'Fatou', email: 'fatou.sow@email.com', filiere_id: 1, niveau_id: 1 },
  { id: 3, matricule: '2024-0003', nom: 'Ndiaye', prenom: 'Moussa', email: 'moussa.ndiaye@email.com', filiere_id: 2, niveau_id: 2 },
];

export const mockEnseignants = [
  { id: 1, matricule: 'ENS-001', nom: 'Fall', prenom: 'Ibrahima', email: 'ibrahima.fall@gestsco.com', specialite: 'Informatique' },
  { id: 2, matricule: 'ENS-002', nom: 'Ba', prenom: 'Aissatou', email: 'aissatou.ba@gestsco.com', specialite: 'Mathématiques' },
];

export const mockFilieres = [
  { id: 1, code: 'INFO', nom: 'Informatique', departement_id: 1 },
  { id: 2, code: 'GEST', nom: 'Gestion', departement_id: 2 },
  { id: 3, code: 'ECO', nom: 'Économie', departement_id: 2 },
];

export const mockNiveaux = [
  { id: 1, code: 'L1', nom: 'Licence 1', cycle_id: 1 },
  { id: 2, code: 'L2', nom: 'Licence 2', cycle_id: 1 },
  { id: 3, code: 'L3', nom: 'Licence 3', cycle_id: 1 },
  { id: 4, code: 'M1', nom: 'Master 1', cycle_id: 2 },
  { id: 5, code: 'M2', nom: 'Master 2', cycle_id: 2 },
];

export const mockUser = {
  id: 1,
  email: 'admin@gestsco.com',
  nom: 'Administrateur',
  role: 'admin',
  permissions: ['all'],
};

export const mockFactures = [
  { id: 1, numero: 'FAC-2025-001', etudiant_id: 1, montant_total: 300000, montant_paye: 150000, statut: 'partiel' },
  { id: 2, numero: 'FAC-2025-002', etudiant_id: 2, montant_total: 300000, montant_paye: 300000, statut: 'paye' },
];

export const mockPaiements = [
  { id: 1, facture_id: 1, montant: 150000, date_paiement: '2025-01-05', mode_paiement: 'especes' },
  { id: 2, facture_id: 2, montant: 300000, date_paiement: '2025-01-03', mode_paiement: 'virement' },
];

export const handlers = [
  // Auth handlers
  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const body = await request.formData();
    const email = body.get('username');
    
    if (email === 'admin@gestsco.com') {
      return HttpResponse.json({
        access_token: 'mock-token-admin',
        token_type: 'bearer',
        user: mockUser,
      });
    }
    
    return HttpResponse.json({ detail: 'Invalid credentials' }, { status: 401 });
  }),

  http.get(`${API_URL}/auth/me`, () => {
    return HttpResponse.json(mockUser);
  }),

  // Etudiants handlers
  http.get(`${API_URL}/etudiants`, () => {
    return HttpResponse.json(mockEtudiants);
  }),

  http.get(`${API_URL}/etudiants/:id`, ({ params }) => {
    const etudiant = mockEtudiants.find(e => e.id === Number(params.id));
    if (etudiant) {
      return HttpResponse.json(etudiant);
    }
    return HttpResponse.json({ detail: 'Not found' }, { status: 404 });
  }),

  http.post(`${API_URL}/etudiants`, async ({ request }) => {
    const body = await request.json();
    const newEtudiant = { id: mockEtudiants.length + 1, ...(body as object) };
    return HttpResponse.json(newEtudiant, { status: 201 });
  }),

  http.put(`${API_URL}/etudiants/:id`, async ({ params, request }) => {
    const body = await request.json();
    const etudiant = mockEtudiants.find(e => e.id === Number(params.id));
    if (etudiant) {
      return HttpResponse.json({ ...etudiant, ...(body as object) });
    }
    return HttpResponse.json({ detail: 'Not found' }, { status: 404 });
  }),

  http.delete(`${API_URL}/etudiants/:id`, ({ params }) => {
    const index = mockEtudiants.findIndex(e => e.id === Number(params.id));
    if (index !== -1) {
      return HttpResponse.json({ message: 'Deleted' });
    }
    return HttpResponse.json({ detail: 'Not found' }, { status: 404 });
  }),

  // Enseignants handlers
  http.get(`${API_URL}/enseignants`, () => {
    return HttpResponse.json(mockEnseignants);
  }),

  http.get(`${API_URL}/enseignants/:id`, ({ params }) => {
    const enseignant = mockEnseignants.find(e => e.id === Number(params.id));
    if (enseignant) {
      return HttpResponse.json(enseignant);
    }
    return HttpResponse.json({ detail: 'Not found' }, { status: 404 });
  }),

  // Filieres handlers
  http.get(`${API_URL}/filieres`, () => {
    return HttpResponse.json(mockFilieres);
  }),

  http.get(`${API_URL}/filieres/:id`, ({ params }) => {
    const filiere = mockFilieres.find(f => f.id === Number(params.id));
    if (filiere) {
      return HttpResponse.json(filiere);
    }
    return HttpResponse.json({ detail: 'Not found' }, { status: 404 });
  }),

  // Niveaux handlers
  http.get(`${API_URL}/niveaux`, () => {
    return HttpResponse.json(mockNiveaux);
  }),

  // Factures handlers
  http.get(`${API_URL}/factures`, () => {
    return HttpResponse.json(mockFactures);
  }),

  http.get(`${API_URL}/factures/:id`, ({ params }) => {
    const facture = mockFactures.find(f => f.id === Number(params.id));
    if (facture) {
      return HttpResponse.json(facture);
    }
    return HttpResponse.json({ detail: 'Not found' }, { status: 404 });
  }),

  // Paiements handlers
  http.get(`${API_URL}/paiements`, () => {
    return HttpResponse.json(mockPaiements);
  }),

  http.post(`${API_URL}/paiements`, async ({ request }) => {
    const body = await request.json();
    const newPaiement = { id: mockPaiements.length + 1, ...(body as object) };
    return HttpResponse.json(newPaiement, { status: 201 });
  }),
];
