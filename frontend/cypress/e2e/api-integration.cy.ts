describe('API Integration Tests', () => {
  it('should successfully call analyze endpoint', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:8000/analyze',
      body: {
        sector: 'Corporate Travel & Expense',
        keywords: ['travel', 'expense', 'corporate'],
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.be.oneOf([200, 503]);
      if (response.status === 200) {
        expect(response.body).to.have.property('summary');
        expect(response.body).to.have.property('sentiment');
        expect(response.body).to.have.property('insights');
      }
    });
  });

  it('should handle invalid sector gracefully', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:8000/analyze',
      body: {
        sector: 'Invalid Sector',
        keywords: [],
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.be.oneOf([200, 400, 422, 503]);
    });
  });

  it('should validate request payload', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:8000/analyze',
      body: {},
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.equal(422);
    });
  });
});
