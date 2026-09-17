const request = require('supertest');
const app     = require('../app');
const prisma  = require('../lib/prisma');

let ownerToken;
let customerToken;
let createdCabId;

// Setup — create owner and customer before tests run
beforeAll(async () => {
  // Create owner
  const ownerRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test Owner', email: `owner_${Date.now()}@test.com`,
      password: 'password123', role: 'owner'
    });
  ownerToken = ownerRes.body.data.token;

  // Create customer
  const customerRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test Customer', email: `customer_${Date.now()}@test.com`,
      password: 'password123', role: 'customer'
    });
  customerToken = customerRes.body.data.token;
});

// Cleanup after all tests
afterAll(async () => {
  // Delete cabs first — then users (foreign key order matters)
  await prisma.cab.deleteMany({ where: { owner: { email: { contains: '@test.com' } } } });
  await prisma.user.deleteMany({ where: { email: { contains: '@test.com' } } });
  await prisma.$disconnect();
});

describe('Cabs — Public routes', () => {

  it('GET /api/cabs returns array', async () => {
    const res = await request(app).get('/api/cabs');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/cabs filters by location', async () => {
    const res = await request(app).get('/api/cabs?location=Pune');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/cabs/:id returns 404 for non-existent cab', async () => {
    const res = await request(app).get('/api/cabs/999999');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

});

describe('Cabs — Protected routes', () => {

  it('POST /api/cabs creates a cab when owner is logged in', async () => {
    const res = await request(app)
      .post('/api/cabs')
      .set('Authorization', `Bearer ${ownerToken}`) // attach token
      .send({
        name: 'Test Swift', type: 'Sedan',
        capacity: 4, pricePerKm: 12, location: 'Nashik'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Test Swift');

    createdCabId = res.body.data.id; // save for cleanup
  });

  it('POST /api/cabs rejects customer creating a cab', async () => {
    const res = await request(app)
      .post('/api/cabs')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        name: 'Test Cab', type: 'Sedan',
        capacity: 4, pricePerKm: 12, location: 'Nashik'
      });

    expect(res.status).toBe(403); // forbidden
  });

  it('POST /api/cabs rejects unauthenticated request', async () => {
    const res = await request(app)
      .post('/api/cabs')
      .send({
        name: 'Test Cab', type: 'Sedan',
        capacity: 4, pricePerKm: 12, location: 'Nashik'
      });

    expect(res.status).toBe(401); // unauthorized
  });

});