/**
 * E2E portail étudiant - parcours réel navigateur.
 *
 * Prérequis (backend/) :
 *   python scripts/e2e_portail_etudiant_verify.py setup
 *
 * Compte : e2e-manual@example.com / E2E-Portail-2026!
 * Étudiant : E2E-MANUAL-001 (id 2 en base dev standard)
 */

const E2E_EMAIL = 'e2e-manual@example.com';
const E2E_PASSWORD = 'E2E-Portail-2026!';

describe('Portail étudiant E2E', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[type="email"]').clear().type(E2E_EMAIL);
    cy.get('input[type="password"]').clear().type(E2E_PASSWORD);
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 15000 }).should('include', '/etudiant/dashboard');
  });

  it('dashboard affiche le profil et les stats E2E-MANUAL-001', () => {
    cy.contains('E2E-MANUAL-001').should('be.visible');
    cy.contains('TestE2E').should('be.visible');
    cy.contains('2025-2026').should('be.visible');
  });

  it('mes résultats correspondent aux données E2E Évaluations', () => {
    cy.visit('/etudiant/notes');
    cy.get('h1', { timeout: 10000 }).should('contain', 'Mes résultats');
    // Données connues du script e2e_manual_test_resultats.py pour E2E-MANUAL-001
    cy.contains('9.46').should('be.visible');
    cy.contains('11.00').should('be.visible');
    cy.contains('admis_avec_dette').should('be.visible');
    cy.contains('ajourne').should('be.visible');
    cy.contains('10.23').should('be.visible');
  });

  it('mon emploi du temps se charge sans erreur', () => {
    cy.visit('/etudiant/emploi-temps');
    cy.contains(/emploi du temps|Mon EDT/i, { timeout: 10000 }).should('be.visible');
    cy.get('.alert-danger').should('not.exist');
  });

  it('ma présence affiche le taux (0 séance en base E2E)', () => {
    cy.visit('/etudiant/presences');
    cy.contains('Mes présences', { timeout: 10000 }).should('be.visible');
    cy.contains('Taux de présence').should('be.visible');
    cy.contains('0.0 %').should('be.visible');
  });

  it('mon stage - page charge via API mes-stages', () => {
    cy.visit('/etudiant/stages');
    cy.contains('h1', /Mon stage/i, { timeout: 10000 }).should('be.visible');
    cy.get('.alert-danger').should('not.exist');
  });

  it('mes finances - factures listées', () => {
    cy.visit('/etudiant/finances/factures');
    cy.get('h1', { timeout: 10000 }).should('contain', 'Mes factures');
    cy.get('table tbody tr').should('have.length.at.least', 1);
    cy.contains('PDF_PREVIEW_FAC-2026-00001').should('be.visible');
  });

  it('mon compte financier se charge (après seed E2E)', () => {
    cy.visit('/etudiant/finances/compte');
    cy.get('h1', { timeout: 10000 }).should('contain', 'Mon compte');
    cy.contains('135', { timeout: 10000 }).should('be.visible');
    cy.get('.alert-danger').should('not.exist');
  });

  it('refuse l accès aux données d un autre étudiant (403)', () => {
    cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      expect(token).to.be.a('string');
      cy.request({
        method: 'GET',
        url: '/api/v1/resultats/semestres/etudiant/3',
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      }).then((resp) => {
        expect(resp.status).to.eq(403);
      });
    });
  });

  it('mon profil affiche le matricule E2E', () => {
    cy.visit('/etudiant/profil');
    cy.get('h1', { timeout: 10000 }).should('contain', 'Mon profil');
    cy.contains('E2E-MANUAL-001').should('be.visible');
    cy.contains('TestE2E').should('be.visible');
    cy.get('.alert-danger').should('not.exist');
  });

  it('mes bulletins - page se charge', () => {
    cy.visit('/etudiant/bulletins');
    cy.get('h1', { timeout: 10000 }).should('contain', 'Mes bulletins');
    cy.contains('Bulletin semestriel').should('be.visible');
    cy.get('.alert-danger').should('not.exist');
  });

  it('mes bulletins - API génère un bulletin semestriel', () => {
    cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      cy.request({ method: 'GET', url: '/api/v1/inscriptions/mes-profil', headers }).then((profilResp) => {
        const etudiantId = profilResp.body.etudiant.id;

        cy.request({ method: 'GET', url: '/api/v1/sessions-examen/', headers }).then((sessResp) => {
          const session = (sessResp.body as Array<{ id: number; semestre: number }>)[0];
          expect(session).to.exist;

          cy.request({
            method: 'GET',
            url: `/api/v1/bulletins/etudiant/${etudiantId}/semestre`,
            headers,
            qs: { session_id: session.id, semestre: session.semestre },
          }).then((bulletinResp) => {
            expect(bulletinResp.status).to.eq(200);
            expect(bulletinResp.body).to.have.property('matieres');
            expect(bulletinResp.body.matieres).to.be.an('array');
          });
        });
      });
    });
  });

  it('relevés de notes - page se charge', () => {
    cy.visit('/etudiant/releves');
    cy.get('h1', { timeout: 10000 }).should('contain', 'Relevés de notes');
    cy.get('.alert-danger').should('not.exist');
  });

  it('relevés de notes - API retourne le parcours', () => {
    cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      cy.request({ method: 'GET', url: '/api/v1/inscriptions/mes-profil', headers }).then((profilResp) => {
        const etudiantId = profilResp.body.etudiant.id;

        cy.request({
          method: 'GET',
          url: `/api/v1/bulletins/etudiant/${etudiantId}/releve-notes`,
          headers,
        }).then((resp) => {
          expect(resp.status).to.eq(200);
          expect(resp.body).to.have.property('parcours');
          expect(resp.body.parcours).to.be.an('array');
        });
      });
    });
  });

  it('mes documents - page se charge', () => {
    cy.visit('/etudiant/documents');
    cy.get('h1', { timeout: 10000 }).should('contain', 'Mes documents');
    cy.contains('.card-title', 'Mon dossier administratif').should('be.visible');
    cy.contains('.card-title', 'Mes bulletins').should('be.visible');
  });

  it('mon dossier administratif - page se charge via API', () => {
    cy.visit('/etudiant/documents/dossier');
    cy.get('h1', { timeout: 10000 }).should('contain', 'Mon dossier administratif');
    cy.get('.alert-danger').should('not.exist');
  });
});
