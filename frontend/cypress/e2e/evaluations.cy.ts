/**

 * E2E module Évaluations - sessions et examens (admin).

 *

 * Compte : admin@gestsco.com / Admin@123

 */



const ADMIN_EMAIL = 'admin@gestsco.com';

const ADMIN_PASSWORD = 'Admin@123';



describe('Module Évaluations E2E', () => {

  beforeEach(() => {

    cy.session('admin-evaluations', () => {

      cy.visit('/login');

      cy.get('input[type="email"]').clear().type(ADMIN_EMAIL);

      cy.get('input[type="password"]').clear().type(ADMIN_PASSWORD);

      cy.get('button[type="submit"]').click();

      cy.url({ timeout: 20000 }).should('include', '/admin/dashboard');

    });

  });



  it('sessions - page se charge depuis API', () => {

    cy.visit('/admin/evaluations/sessions');

    cy.get('h1', { timeout: 15000 }).should('contain', "Sessions d'évaluation");

    cy.get('.alert-danger').should('not.exist');

  });



  it('sessions - API liste les sessions', () => {

    cy.window().then((win) => {

      const token = win.localStorage.getItem('token');

      cy.request({

        method: 'GET',

        url: '/api/v1/sessions-examen/?limit=20',

        headers: { Authorization: `Bearer ${token}` },

        timeout: 30000,

      }).then((resp) => {

        expect(resp.status).to.eq(200);

        expect(resp.body).to.be.an('array');

      });

    });

  });



  it('examens - page se charge depuis API', () => {

    cy.visit('/admin/evaluations/examens');

    cy.get('h1', { timeout: 15000 }).should('contain', 'Examens');

    cy.get('.alert-danger').should('not.exist');

  });



  it('examens - API liste les examens', () => {

    cy.window().then((win) => {

      const token = win.localStorage.getItem('token');

      cy.request({

        method: 'GET',

        url: '/api/v1/examens/?limit=20',

        headers: { Authorization: `Bearer ${token}` },

        timeout: 30000,

      }).then((resp) => {

        expect(resp.status).to.eq(200);

        expect(resp.body).to.be.an('array');

      });

    });

  });



  it('saisie notes - page se charge', () => {

    cy.visit('/admin/evaluations/notes');

    cy.get('h1.page-title', { timeout: 20000 }).should('contain', 'Saisie des notes');

    cy.get('.alert-danger').should('not.exist');

  });



  it('résultats - page se charge', () => {

    cy.visit('/admin/evaluations/resultats');

    cy.get('h1', { timeout: 15000 }).should('contain', 'Résultats');

    cy.get('.alert-danger').should('not.exist');

  });



  it('délibérations - page se charge', () => {

    cy.visit('/admin/evaluations/deliberations');

    cy.get('h1', { timeout: 15000 }).should('contain', 'Délibérations');

    cy.get('.alert-danger').should('not.exist');

  });

});


