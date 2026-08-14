describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  describe('Login Page', () => {
    it('should display login form', () => {
      cy.get('input[type="email"]').should('be.visible');
      cy.get('input[type="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });

    it('should display quick access buttons', () => {
      cy.contains('SuperAdmin').should('be.visible');
      cy.contains('Admin').should('be.visible');
    });

    it('should fill credentials on quick access button click', () => {
      cy.contains('SuperAdmin').click();
      cy.get('input[type="email"]').should('have.value', 'superadmin@gestsco.com');
    });
  });

  describe('Login Flow', () => {
    it('should login successfully with valid credentials', () => {
      cy.get('input[type="email"]').type('admin@gestsco.com');
      cy.get('input[type="password"]').type('admin123');
      cy.get('button[type="submit"]').click();
      
      cy.url().should('include', '/dashboard');
    });

    it('should show error with invalid credentials', () => {
      cy.get('input[type="email"]').type('invalid@email.com');
      cy.get('input[type="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();
      
      cy.contains(/erreur|error|invalid/i).should('be.visible');
    });

    it('should redirect to dashboard after login', () => {
      cy.login();
      cy.url().should('include', '/admin/dashboard');
    });
  });

  describe('Logout Flow', () => {
    it('should logout successfully', () => {
      cy.login();
      cy.logout();
      cy.url().should('include', '/login');
    });

    it('should clear session on logout', () => {
      cy.login();
      cy.logout();
      cy.visit('/admin/dashboard');
      cy.url().should('include', '/login');
    });
  });

  describe('Protected Routes', () => {
    it('should redirect to login when accessing protected route without auth', () => {
      cy.visit('/admin/dashboard');
      cy.url().should('include', '/login');
    });

    it('should allow access to protected routes when authenticated', () => {
      cy.login();
      cy.visit('/admin/etudiants');
      cy.url().should('include', '/admin/etudiants');
    });
  });
});
