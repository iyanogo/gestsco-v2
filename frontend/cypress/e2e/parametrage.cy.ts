/**
 * E2E module Paramétrage - admin (paramètres, barèmes, templates…).
 *
 * Compte : admin@gestsco.com / Admin@123
 */

const ADMIN_EMAIL = 'admin@gestsco.com';
const ADMIN_PASSWORD = 'Admin@123';

describe('Module Paramétrage E2E', () => {
  beforeEach(() => {
    cy.session('admin-parametrage', () => {
      cy.visit('/login');
      cy.get('input[type="email"]').clear().type(ADMIN_EMAIL);
      cy.get('input[type="password"]').clear().type(ADMIN_PASSWORD);
      cy.get('button[type="submit"]').click();
      cy.url({ timeout: 20000 }).should('include', '/admin/dashboard');
    });
  });

  const pages = [
    { path: '/admin/parametrage/parametres', title: 'Paramètres généraux' },
    { path: '/admin/parametrage/annees-scolaires', title: 'Années scolaires' },
    { path: '/admin/parametrage/baremes', title: 'Barèmes de notation' },
    { path: '/admin/parametrage/pays', title: 'Configurations pays' },
    { path: '/admin/parametrage/regles-calcul', title: 'Règles de calcul' },
    { path: '/admin/parametrage/modeles-communication', title: 'Modèles email & SMS' },
    { path: '/admin/documents/templates', title: 'Templates de documents' },
    { path: '/admin/gestion-modules', title: 'Gestion des Modules' },
  ];

  pages.forEach(({ path, title }) => {
    it(`${title} - page se charge`, () => {
      cy.visit(path);
      cy.get('h1.page-title', { timeout: 15000 }).should('contain', title);
      cy.get('.alert-danger').should('not.exist');
    });
  });

  it('API - paramètres et barèmes (staff)', () => {
    cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      cy.request({
        method: 'GET',
        url: '/api/v1/parametres/',
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000,
      }).then((resp) => {
        expect(resp.status).to.eq(200);
      });
      cy.request({
        method: 'GET',
        url: '/api/v1/baremes/',
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000,
      }).then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body).to.be.an('array');
      });
    });
  });
});
