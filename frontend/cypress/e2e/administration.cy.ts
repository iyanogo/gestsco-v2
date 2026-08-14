describe('Administration', () => {
  beforeEach(() => {
    // Login as superadmin for admin pages
    cy.visit('/login');
    cy.contains('SuperAdmin').click();
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });

  describe('Logs', () => {
    beforeEach(() => {
      cy.visit('/admin/administration/logs');
    });

    it('should display logs page', () => {
      cy.contains(/logs système|system logs/i).should('be.visible');
    });

    it('should display logs table', () => {
      cy.get('table').should('be.visible');
      cy.get('tbody tr').should('have.length.greaterThan', 0);
    });

    it('should filter logs by type', () => {
      cy.get('select').first().select('error');
      cy.get('tbody tr').each(($row) => {
        cy.wrap($row).should('contain', 'Erreur');
      });
    });

    it('should search logs', () => {
      cy.get('input[placeholder*="echercher"]').type('Connexion');
      cy.get('tbody tr').should('contain', 'Connexion');
    });

    it('should filter logs by date', () => {
      cy.get('input[type="date"]').type('2025-01-08');
      cy.get('tbody tr').should('have.length.greaterThan', 0);
    });

    it('should export logs', () => {
      cy.contains(/exporter|export/i).click();
      // Verify download started or modal appeared
    });
  });

  describe('Sauvegardes', () => {
    beforeEach(() => {
      cy.visit('/admin/administration/backup');
    });

    it('should display backup page', () => {
      cy.contains(/sauvegardes|backups/i).should('be.visible');
    });

    it('should display backup history', () => {
      cy.get('table').should('be.visible');
    });

    it('should trigger new backup', () => {
      cy.contains(/nouvelle sauvegarde|new backup/i).click();
      cy.get('.progress-bar').should('be.visible');
    });

    it('should display backup configuration', () => {
      cy.contains(/configuration/i).should('be.visible');
      cy.get('input[type="checkbox"]').should('exist');
    });

    it('should download backup', () => {
      cy.get('tbody tr').first().find('button').first().click();
      // Verify download action
    });
  });

  describe('Permissions', () => {
    beforeEach(() => {
      cy.visit('/admin/administration/permissions');
    });

    it('should display permissions page', () => {
      cy.contains(/permissions/i).should('be.visible');
    });

    it('should display roles list', () => {
      cy.get('table').should('be.visible');
      cy.contains('Super Administrateur').should('be.visible');
      cy.contains('Administrateur').should('be.visible');
    });

    it('should create new role', () => {
      cy.contains(/nouveau rôle|new role/i).click();
      cy.get('.modal').should('be.visible');
      
      cy.get('input[name="nom"]').type('Test Role');
      cy.get('input[name="code"]').type('test_role');
      cy.get('textarea[name="description"]').type('Role de test');
      
      // Select some permissions
      cy.get('input[type="checkbox"]').first().check();
      
      cy.get('button[type="submit"]').click();
      cy.contains(/succès|success/i).should('be.visible');
    });

    it('should edit role permissions', () => {
      cy.get('tbody tr').eq(1).find('button').contains(/modifier|edit/i).click();
      cy.get('.modal').should('be.visible');
      
      // Toggle a permission
      cy.get('.modal input[type="checkbox"]').first().click();
      cy.get('.modal button[type="submit"]').click();
      
      cy.contains(/modifié|updated/i).should('be.visible');
    });

    it('should not allow deleting superadmin role', () => {
      cy.get('tbody tr').first().find('button').contains(/supprimer|delete/i).should('be.disabled');
    });
  });

  describe('Audit', () => {
    beforeEach(() => {
      cy.visit('/admin/administration/audit');
    });

    it('should display audit page', () => {
      cy.contains(/audit/i).should('be.visible');
    });

    it('should display audit entries', () => {
      cy.get('table').should('be.visible');
      cy.get('tbody tr').should('have.length.greaterThan', 0);
    });

    it('should filter by action type', () => {
      cy.get('select').contains(/action/i).parent().select('Modification');
      cy.get('tbody tr').each(($row) => {
        cy.wrap($row).should('contain', 'Modification');
      });
    });

    it('should filter by entity', () => {
      cy.get('select').contains(/entité/i).parent().select('Étudiant');
      cy.get('tbody tr').should('contain', 'Étudiant');
    });

    it('should view audit details', () => {
      cy.get('tbody tr').first().find('button').click();
      cy.get('.modal').should('be.visible');
      cy.contains(/ancienne valeur|old value/i).should('be.visible');
      cy.contains(/nouvelle valeur|new value/i).should('be.visible');
    });

    it('should export audit log', () => {
      cy.contains(/exporter|export/i).click();
      // Verify export action
    });
  });

  describe('Access Control', () => {
    it('should restrict admin pages for non-superadmin users', () => {
      // Logout and login as regular admin
      cy.visit('/login');
      cy.get('input[type="email"]').type('admin@gestsco.com');
      cy.get('input[type="password"]').type('admin123');
      cy.get('button[type="submit"]').click();
      
      // Try to access admin pages
      cy.visit('/admin/administration/permissions');
      cy.contains(/accès refusé|access denied|non autorisé/i).should('be.visible');
    });
  });
});
