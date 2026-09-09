/**
 * E2E module Emploi du temps - admin (planning, référentiel, réservations, présences).
 *
 * Compte : admin@gestsco.com / Admin@123
 */

const ADMIN_EMAIL = 'admin@gestsco.com';
const ADMIN_PASSWORD = 'Admin@123';

describe('Module Emploi du temps E2E', () => {
  beforeEach(() => {
    cy.session('admin-edt', () => {
      cy.visit('/login');
      cy.get('input[type="email"]').clear().type(ADMIN_EMAIL);
      cy.get('input[type="password"]').clear().type(ADMIN_PASSWORD);
      cy.get('button[type="submit"]').click();
      cy.url({ timeout: 20000 }).should('include', '/admin/dashboard');
    });
  });

  it('planning - page se charge depuis API', () => {
    cy.visit('/admin/emploi-temps/planning');
    cy.get('h1.page-title', { timeout: 15000 }).should('contain', 'Emploi du temps');
    cy.get('.alert-danger').should('not.exist');
  });

  it('bâtiments - page se charge depuis API', () => {
    cy.visit('/admin/emploi-temps/batiments');
    cy.get('h1.page-title', { timeout: 15000 }).should('contain', 'Bâtiments');
    cy.get('.alert-danger').should('not.exist');
  });

  it('salles - page se charge depuis API', () => {
    cy.visit('/admin/emploi-temps/salles');
    cy.get('h1.page-title', { timeout: 15000 }).should('contain', 'Salles');
    cy.get('.alert-danger').should('not.exist');
  });

  it('créneaux - page se charge depuis API', () => {
    cy.visit('/admin/emploi-temps/creneaux');
    cy.get('h1.page-title', { timeout: 15000 }).should('contain', 'Créneaux horaires');
    cy.get('.alert-danger').should('not.exist');
  });

  it('réservations - page se charge depuis API', () => {
    cy.visit('/admin/emploi-temps/reservations');
    cy.get('h1.page-title', { timeout: 15000 }).should('contain', 'Réservations de salles');
    cy.get('.alert-danger').should('not.exist');
  });

  it('présences appel - page se charge depuis API', () => {
    cy.visit('/admin/presences/appel');
    cy.get('h1.page-title', { timeout: 15000 }).should('contain', 'Appel / Présences');
    cy.get('.alert-danger').should('not.exist');
  });

  it('présences statistiques - page se charge depuis API', () => {
    cy.visit('/admin/presences/statistiques');
    cy.get('h1.page-title', { timeout: 15000 }).should('contain', 'Statistiques de présence');
    cy.get('.alert-danger').should('not.exist');
  });

  it('API - liste bâtiments et salles', () => {
    cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      cy.request({
        method: 'GET',
        url: '/api/v1/batiments/',
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000,
      }).then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body).to.be.an('array');
      });
      cy.request({
        method: 'GET',
        url: '/api/v1/salles/',
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000,
      }).then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body).to.be.an('array');
      });
    });
  });
});
