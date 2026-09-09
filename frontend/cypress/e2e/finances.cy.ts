/**
 * E2E module Finances - admin (factures, paiements, types de frais).
 *
 * Compte : admin@gestsco.com / Admin@123
 */

const ADMIN_EMAIL = 'admin@gestsco.com';
const ADMIN_PASSWORD = 'Admin@123';

describe('Module Finances E2E', () => {
  beforeEach(() => {
    cy.session('admin-finances', () => {
      cy.visit('/login');
      cy.get('input[type="email"]').clear().type(ADMIN_EMAIL);
      cy.get('input[type="password"]').clear().type(ADMIN_PASSWORD);
      cy.get('button[type="submit"]').click();
      cy.url({ timeout: 20000 }).should('include', '/admin/dashboard');
    });
  });

  it('factures - page se charge depuis API', () => {
    cy.visit('/admin/finances/factures');
    cy.get('h1.page-title', { timeout: 15000 }).should('contain', 'Factures');
    cy.get('.alert-danger').should('not.exist');
  });

  it('paiements - page se charge depuis API', () => {
    cy.visit('/admin/finances/paiements');
    cy.get('h1.page-title', { timeout: 15000 }).should('contain', 'Paiements');
    cy.get('.alert-danger').should('not.exist');
  });

  it('types de frais - page se charge depuis API', () => {
    cy.visit('/admin/finances/types-frais');
    cy.get('h1.page-title', { timeout: 15000 }).should('contain', 'Types de frais');
    cy.get('.alert-danger').should('not.exist');
  });

  it('remises - page se charge depuis API', () => {
    cy.visit('/admin/finances/remises');
    cy.get('h1.page-title', { timeout: 15000 }).should('contain', 'Remises');
    cy.get('.alert-danger').should('not.exist');
  });

  it('échéanciers - page se charge depuis API', () => {
    cy.visit('/admin/finances/echeanciers');
    cy.get('h1.page-title', { timeout: 15000 }).should('contain', 'Échéanciers');
    cy.get('.alert-danger').should('not.exist');
  });

  it('API - liste factures (staff)', () => {
    cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      cy.request({
        method: 'GET',
        url: '/api/v1/factures/',
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000,
      }).then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body).to.be.an('array');
      });
    });
  });

  it('API - statistiques factures (scolarité/comptable)', () => {
    cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      cy.request({
        method: 'GET',
        url: '/api/v1/factures/statistiques',
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000,
      }).then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body).to.have.property('montant_total');
      });
    });
  });
});
