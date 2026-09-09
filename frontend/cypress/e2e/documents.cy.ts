/**
 * E2E module Documents - admin (dossiers, templates) + API.
 *
 * Compte : admin@gestsco.com / Admin@123
 */

const ADMIN_EMAIL = 'admin@gestsco.com';
const ADMIN_PASSWORD = 'Admin@123';

describe('Module Documents E2E', () => {
  beforeEach(() => {
    cy.session('admin-documents', () => {
      cy.visit('/login');
      cy.get('input[type="email"]').clear().type(ADMIN_EMAIL);
      cy.get('input[type="password"]').clear().type(ADMIN_PASSWORD);
      cy.get('button[type="submit"]').click();
      cy.url({ timeout: 20000 }).should('include', '/admin/dashboard');
    });
  });

  it('dossiers administratifs - page se charge depuis API', () => {
    cy.visit('/admin/documents/liste');
    cy.get('h1.page-title', { timeout: 15000 }).should('contain', 'Documents administratifs');
    cy.get('.alert-danger').should('not.exist');
  });

  it('templates - page se charge depuis API', () => {
    cy.visit('/admin/documents/templates');
    cy.get('h1.page-title', { timeout: 15000 }).should('contain', 'Templates de documents');
    cy.get('.alert-danger').should('not.exist');
  });

  it('API - liste documents et templates (staff)', () => {
    cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      cy.request({
        method: 'GET',
        url: '/api/v1/documents-etudiant/',
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000,
      }).then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body).to.be.an('array');
      });
      cy.request({
        method: 'GET',
        url: '/api/v1/templates/',
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000,
      }).then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body).to.be.an('array');
      });
    });
  });
});
