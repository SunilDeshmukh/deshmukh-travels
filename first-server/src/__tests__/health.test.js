// health.test.js — simplest possible test to verify setup works
const request = require('supertest');
const app = require('../app');

// Groups related tests together — shows as a section in output
describe('Health Check', () => {

    // One specific test case — plain English description of what it checks
    it('GET /api/health returns 200 and status ok', async () => {
        // Supertest makes a real GET request to your Express app
        const res = await request(app).get('/api/health');

        // Jest checks — did we get status 200? If not → test fails
        expect(res.status).toBe(200);
        // Jest checks — does the body have status: 'ok'? If not → test fails
        expect(res.body.status).toBe('ok');
        expect(res.body.message).toBe('API is running');
    });

});