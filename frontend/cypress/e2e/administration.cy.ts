/**
 * E2E Administration - données API réelles (superadmin).
 *
 * Compte : admin@gestsco.com / Admin@123
 */

const ADMIN_EMAIL = 'admin@gestsco.com';
const ADMIN_PASSWORD = 'Admin@123';

describe('Administration E2E', () => {
  beforeEach(() => {
    cy.session('admin-administration', () => {
      cy.visit('/login');
      cy.get('input[type="email"]').clear().type(ADMIN_EMAIL);
      cy.get('input[type="password"]').clear().type(ADMIN_PASSWORD);
      cy.get('button[type="submit"]').click();
      cy.url({ timeout: 20000 }).should('include', '/admin/dashboard');
    });
  });

  const pages = [
    { path: '/admin/administration/logs', title: 'Logs système', tableText: 'Historique' },
    { path: '/admin/administration/backup', title: 'Sauvegardes', tableText: 'Historique des sauvegardes' },
    { path: '/admin/administration/permissions', title: 'Permissions', tableText: 'Matrice RBAC active' },
    { path: '/admin/administration/audit', title: 'Audit', tableText: "Événements d'audit" },
  ];

  pages.forEach(({ path, title, tableText }) => {
    it(`${title} - page chargée avec données API`, () => {
      cy.visit(path);
      cy.get('h1.page-title', { timeout: 15000 }).should('contain', title);
      cy.contains(tableText).should('be.visible');
      cy.get('.alert-danger').should('not.exist');
    });
  });

  it('navigation Administration - 4 onglets visibles', () => {
    cy.visit('/admin/administration/logs');
    cy.contains('.nav-link', 'Logs').should('be.visible');
    cy.contains('.nav-link', 'Sauvegardes').should('be.visible');
    cy.contains('.nav-link', 'Permissions').should('be.visible');
    cy.contains('.nav-link', 'Audit').should('be.visible');
  });

  it('Permissions - matrice RBAC visible', () => {
    cy.visit('/admin/administration/permissions');
    cy.contains(/Matrice RBAC active/i).should('be.visible');
    cy.get('table').should('contain', 'Finances');
  });

  it('scolarité - routes Administration bloquées', () => {
    cy.session('scolarite-admin-block', () => {
      cy.visit('/login');
      cy.get('input[type="email"]').clear().type('scolarite@gestsco.com');
      cy.get('input[type="password"]').clear().type('Scolarite@123');
      cy.get('button[type="submit"]').click();
      cy.url({ timeout: 20000 }).should('include', '/admin/');
    });
    cy.visit('/admin/administration/permissions');
    cy.url({ timeout: 10000 }).should('not.include', '/admin/administration/permissions');
  });
});
