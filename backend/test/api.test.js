const request = require('supertest');
const { parseLimit, parsePage, MAX_LIST_LIMIT } = require('../src/utils/pagination');
const { seedTestUsers } = require('./helpers/seedTestDb');

describe('pagination helpers', () => {
  test('parseLimit clamps above MAX_LIST_LIMIT', () => {
    expect(parseLimit('99999', 20)).toBe(MAX_LIST_LIMIT);
    expect(parseLimit(500, 20)).toBe(MAX_LIST_LIMIT);
  });

  test('parseLimit invalid falls back to default', () => {
    expect(parseLimit('0', 20)).toBe(20);
    expect(parseLimit('abc', 15)).toBe(15);
  });

  test('parsePage invalid becomes 1', () => {
    expect(parsePage('-1')).toBe(1);
    expect(parsePage('')).toBe(1);
  });
});

describe('HTTP API', () => {
  let app;

  beforeAll(() => {
    seedTestUsers();
    app = require('../src/app');
  });

  test('GET /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('POST /api/auth/login rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.local', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  test('POST /api/auth/login returns token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.local', password: 'Admin123!' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.role).toBe('admin');
  });

  test('GET /api/tickets clamps limit to MAX_LIST_LIMIT', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.local', password: 'Admin123!' });
    const token = login.body.token;

    const res = await request(app)
      .get('/api/tickets')
      .query({ limit: 99999, page: 1 })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.limit).toBe(MAX_LIST_LIMIT);
  });

  test('GET /api/users clamps limit', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'staff@test.local', password: 'Staff123!' });
    const token = login.body.token;

    const res = await request(app)
      .get('/api/users')
      .query({ limit: 99999 })
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.limit).toBe(MAX_LIST_LIMIT);
  });

  test('user sees only own tickets', async () => {
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.local', password: 'Admin123!' });
    expect(adminLogin.status).toBe(200);

    const createAdminTicket = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${adminLogin.body.token}`)
      .send({
        title: 'Admin ticket',
        description: 'd',
        category: 'Diğer',
        priority: 'Orta',
      });
    expect(createAdminTicket.status).toBe(201);

    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.local', password: 'User123!' });
    expect(userLogin.status).toBe(200);

    const list = await request(app)
      .get('/api/tickets')
      .set('Authorization', `Bearer ${userLogin.body.token}`);
    expect(list.status).toBe(200);
    expect(list.body.total).toBe(0);
    expect(list.body.tickets).toHaveLength(0);
  });

  test('user can create ticket', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.local', password: 'User123!' });
    const token = login.body.token;

    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Yazıcı çalışmıyor',
        description: 'Detaylı açıklama',
        category: 'Yazıcı',
        priority: 'Orta',
      });

    expect(res.status).toBe(201);
    expect(res.body.ticket.ticket_no).toMatch(/^HD-/);
  });
});
