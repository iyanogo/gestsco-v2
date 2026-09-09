/**
 * E2E module Utilisateurs - super-admin uniquement.
 *
 * Compte : admin@gestsco.com / Admin@123
 */

const ADMIN_EMAIL = 'admin@gestsco.com';
const ADMIN_PASSWORD = 'Admin@123';
const SCOLARITE_EMAIL = 'scolarite@gestsco.com';
const SCOLARITE_PASSWORD = 'Scolarite@123';

describe('Module Utilisateurs E2E', () => {
  beforeEach(() => {
    cy.session('admin-utilisateurs', () => {
      cy.visit('/login');
      cy.get('input[type="email"]').clear().type(ADMIN_EMAIL);
      cy.get('input[type="password"]').clear().type(ADMIN_PASSWORD);
      cy.get('button[type="submit"]').click();
      cy.url({ timeout: 20000 }).should('include', '/admin/dashboard');
    });
  });

  it('page se charge - liste depuis API', () => {
    cy.visit('/admin/utilisateurs');
    cy.get('h1.page-title', { timeout: 15000 }).should('contain', 'Utilisateurs');
    cy.contains(/Nouvel utilisateur/i).should('be.visible');
    cy.get('.alert-danger').should('not.exist');
  });

  it('API - GET /users (superuser)', () => {
    cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      cy.request({
        method: 'GET',
        url: '/api/v1/users/',
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000,
      }).then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body).to.be.an('array');
      });
    });
  });

  it('scolarité - route bloquée + API 403', () => {
    cy.session('scolarite-utilisateurs', () => {
      cy.visit('/login');
      cy.get('input[type="email"]').clear().type(SCOLARITE_EMAIL);
      cy.get('input[type="password"]').clear().type(SCOLARITE_PASSWORD);
      cy.get('button[type="submit"]').click();
      cy.url({ timeout: 20000 }).should('include', '/admin/');
    });

    cy.visit('/admin/utilisateurs');
    cy.url({ timeout: 10000 }).should('not.include', '/admin/utilisateurs');

    cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      cy.request({
        method: 'GET',
        url: '/api/v1/users/',
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
        timeout: 30000,
      }).then((resp) => {
        expect(resp.status).to.eq(403);
      });
      cy.request({
        method: 'GET',
        url: '/api/v1/users/select',
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000,
      }).then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body).to.be.an('array');
      });
    });
  });
});
