describe('TrendLens Dashboard', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should load the application', () => {
    cy.contains('TrendLens').should('be.visible');
  });

  it('should display sector selector', () => {
    cy.get('select').should('exist');
    cy.get('select option').should('have.length.greaterThan', 0);
  });

  it('should allow sector selection', () => {
    cy.get('select').select('Corporate Travel & Expense');
    cy.get('select').should('have.value', 'Corporate Travel & Expense');
  });

  it('should navigate to trend analysis page', () => {
    cy.contains('Trend Analysis').click();
    cy.url().should('include', '/trends');
  });

  it('should navigate back to dashboard', () => {
    cy.contains('Trend Analysis').click();
    cy.contains('Dashboard').click();
    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });

  it('should display loading state when analyzing', () => {
    cy.intercept('POST', '**/analyze').as('analyzeRequest');
    cy.get('select').select('Corporate Travel & Expense');
    cy.contains('Analyze Trends').click();
    cy.contains('Analyzing').should('be.visible');
  });
});
