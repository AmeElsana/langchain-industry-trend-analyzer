describe('Trend Analysis Page', () => {
  beforeEach(() => {
    cy.visit('/trends');
  });

  it('should display the trend analysis page', () => {
    cy.contains('Industry Trend Analysis').should('be.visible');
  });

  it('should show analysis results after selecting sector', () => {
    cy.intercept('POST', '**/analyze', {
      statusCode: 200,
      body: {
        summary: 'Test summary',
        sentiment: 'positive',
        insights: ['Insight 1', 'Insight 2'],
        trending_topics: ['Topic 1', 'Topic 2'],
        sentiment_data: [
          { name: 'Positive', value: 60 },
          { name: 'Neutral', value: 30 },
          { name: 'Negative', value: 10 },
        ],
        volume_data: [
          { source: 'Reddit', posts: 45 },
          { source: 'HackerNews', posts: 30 },
        ],
      },
    }).as('analyzeRequest');

    cy.get('select').select('Corporate Travel & Expense');
    cy.contains('Analyze Trends').click();

    cy.wait('@analyzeRequest');
    cy.contains('Test summary').should('be.visible');
  });

  it('should display sentiment chart', () => {
    cy.intercept('POST', '**/analyze', {
      statusCode: 200,
      body: {
        summary: 'Test summary',
        sentiment: 'positive',
        insights: ['Insight 1'],
        trending_topics: ['Topic 1'],
        sentiment_data: [
          { name: 'Positive', value: 60 },
          { name: 'Neutral', value: 30 },
          { name: 'Negative', value: 10 },
        ],
        volume_data: [{ source: 'Reddit', posts: 45 }],
      },
    }).as('analyzeRequest');

    cy.get('select').select('Healthcare & Wellness');
    cy.contains('Analyze Trends').click();

    cy.wait('@analyzeRequest');
    cy.contains('Sentiment Distribution').should('be.visible');
  });

  it('should handle API errors gracefully', () => {
    cy.intercept('POST', '**/analyze', {
      statusCode: 500,
      body: { detail: 'Internal server error' },
    }).as('analyzeError');

    cy.get('select').select('Enterprise SaaS & Technology');
    cy.contains('Analyze Trends').click();

    cy.wait('@analyzeError');
    cy.contains(/error|failed/i).should('be.visible');
  });
});
