const request = require('supertest');
const app     = require('../app');
const prisma  = require('../lib/prisma');

// Test user details — used across multiple tests
const testUser = {
  name:     'Test User',
  email:    `test_${Date.now()}@example.com`, // unique email each run
  password: 'password123',
  role:     'customer',
};

let authToken; // store token between tests

// Clean up test user after all tests finish
afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: testUser.email } });
  await prisma.$disconnect();
});

describe('Auth — Register', () => {

  it('registers a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.token).toBeDefined(); // token exists
    expect(res.body.data.user.password).toBeUndefined(); // password NOT in response
  });

  it('rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser); // same email as above

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Email already registered');
  });

  it('rejects missing required fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'incomplete@test.com' }); // missing name, password, role

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects invalid role', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...testUser, email: 'other@test.com', role: 'admin' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('role must be customer or owner');
  });

});

describe('Auth — Login', () => {

  it('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();

    authToken = res.body.data.token; // save for use in other tests
  });

  it('rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('rejects non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

});