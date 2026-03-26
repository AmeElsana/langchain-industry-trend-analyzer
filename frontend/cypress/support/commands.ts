Cypress.Commands.add('getBySel', (selector: string, ...args) => {
  return cy.get(`[data-cy=${selector}]`, ...args);
});

declare global {
  namespace Cypress {
    interface Chainable {
      getBySel(dataTestAttribute: string, args?: any): Chainable<JQuery<HTMLElement>>;
    }
  }
}

export {};
