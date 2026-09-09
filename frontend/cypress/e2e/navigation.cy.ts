describe('Navigation', () => {
  beforeEach(() => {
    cy.login();
  });

  describe('Sidebar Navigation', () => {
    it('should navigate to dashboard', () => {
      cy.get('.sidebar').contains('Dashboard').click();
      cy.url().should('include', '/dashboard');
    });

    it('should navigate to students list', () => {
      cy.get('.sidebar').contains('Étudiants').click();
      cy.url().should('include', '/etudiants');
    });

    it('should expand referentiel submenu', () => {
      cy.get('.sidebar').contains('Référentiel').click();
      cy.get('.sidebar').contains('Filières').should('be.visible');
      cy.get('.sidebar').contains('Niveaux').should('be.visible');
    });

    it('should navigate to filieres page', () => {
      cy.get('.sidebar').contains('Référentiel').click();
      cy.get('.sidebar').contains('Filières').click();
      cy.url().should('include', '/referentiel/filieres');
    });

    it('should navigate to finances pages', () => {
      cy.get('.sidebar').contains('Finances').click();
      cy.get('.sidebar').contains('Factures').click();
      cy.url().should('include', '/finances/factures');
    });
  });

  describe('Header Navigation', () => {
    it('should open user dropdown', () => {
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="user-dropdown"]').should('be.visible');
    });

    it('should navigate to profile', () => {
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="user-dropdown"]').contains('Mon profil').click();
      cy.url().should('match', /\/(admin|enseignant|etudiant)\/profil/);
    });

    it('should navigate to settings when available', () => {
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="user-dropdown"]').then(($menu) => {
        if ($menu.text().includes('Paramètres')) {
          cy.wrap($menu).contains('Paramètres').click();
          cy.url().should('include', '/parametrage');
        }
      });
    });
  });

  describe('Breadcrumbs', () => {
    it('should display breadcrumbs on nested pages', () => {
      cy.visit('/admin/referentiel/filieres');
      cy.get('.breadcrumb').should('be.visible');
      cy.get('.breadcrumb').should('contain', 'Référentiel');
    });

    it('should navigate via breadcrumb links', () => {
      cy.visit('/admin/referentiel/filieres');
      cy.get('.breadcrumb a').first().click();
      cy.url().should('include', '/dashboard');
    });
  });

  describe('Quick Actions', () => {
    it('should have quick action buttons on dashboard', () => {
      cy.visit('/admin/dashboard');
      cy.contains('Nouvel étudiant').should('be.visible');
    });

    it('should navigate via quick action', () => {
      cy.visit('/admin/dashboard');
      cy.contains('Nouvel étudiant').click();
      cy.url().should('include', '/etudiants/nouveau');
    });
  });

  describe('Mobile Navigation', () => {
    beforeEach(() => {
      cy.viewport('iphone-x');
    });

    it('should show hamburger menu on mobile', () => {
      cy.get('[data-testid="menu-toggle"]').should('be.visible');
    });

    it('should toggle sidebar on mobile', () => {
      cy.get('[data-testid="menu-toggle"]').click();
      cy.get('.sidebar').should('be.visible');
    });

    it('should close sidebar after navigation on mobile', () => {
      cy.get('[data-testid="menu-toggle"]').click();
      cy.get('.sidebar').contains('Dashboard').click();
      cy.get('.sidebar').should('not.be.visible');
    });
  });

  describe('404 Page', () => {
    it('should display 404 for unknown routes', () => {
      cy.visit('/admin/unknown-page', { failOnStatusCode: false });
      cy.contains(/page non trouvée|not found|404/i).should('be.visible');
    });

    it('should have link back to dashboard', () => {
      cy.visit('/admin/unknown-page', { failOnStatusCode: false });
      cy.contains(/retour|back|dashboard/i).click();
      cy.url().should('include', '/dashboard');
    });
  });
});
