const request = require('supertest');

const DailyLog = require('../models/DailyLog');
const Product = require('../models/Product');
const {
  app,
  createUser,
  signToken,
  authHeader,
} = require('./helpers');

async function seedProduct(overrides = {}) {
  return Product.create({
    name: 'Test Apple',
    caloriesPer100g: 100,
    servingSizes: [
      { unit: 'cup', weightInGrams: 125 },
      { unit: 'grams', weightInGrams: 100 },
    ],
    createdBy: null,
    ...overrides,
  });
}

describe('Logs API', () => {
  describe('GET /api/logs/today', () => {
    it('returns 401 without token', async () => {
      const response = await request(app).get('/api/logs/today');

      expect(response.status).toBe(401);
    });

    it('creates today log with user calorie goal as target', async () => {
      const user = await createUser({ email: 'today-new@example.com', calorieGoal: 1800 });
      const token = signToken(user);

      const response = await request(app)
        .get('/api/logs/today')
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body.userId).toBe(user._id.toString());
      expect(response.body.date).toBe(new Date().toISOString().slice(0, 10));
      expect(response.body.targetCalories).toBe(1800);
      expect(response.body.totalCaloriesConsumed).toBe(0);
      expect(response.body.items).toEqual([]);
      expect(response.body.goalMet).toBe(true);
    });

    it('returns existing today log without creating duplicate', async () => {
      const user = await createUser({ email: 'today-existing@example.com' });
      const token = signToken(user);
      const today = new Date().toISOString().slice(0, 10);

      await DailyLog.create({
        userId: user._id,
        date: today,
        targetCalories: 2000,
        totalCaloriesConsumed: 500,
        items: [],
      });

      const response = await request(app)
        .get('/api/logs/today')
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body.totalCaloriesConsumed).toBe(500);

      const count = await DailyLog.countDocuments({ userId: user._id, date: today });
      expect(count).toBe(1);
    });
  });

  describe('GET /api/logs/history', () => {
    it('returns only the caller logs sorted by date descending', async () => {
      const user = await createUser({ email: 'history-user@example.com' });
      const other = await createUser({ email: 'history-other@example.com' });
      const token = signToken(user);

      await DailyLog.create({
        userId: user._id,
        date: '2026-06-01',
        targetCalories: 2000,
        totalCaloriesConsumed: 100,
        items: [],
      });
      await DailyLog.create({
        userId: user._id,
        date: '2026-06-10',
        targetCalories: 2000,
        totalCaloriesConsumed: 200,
        items: [],
      });
      await DailyLog.create({
        userId: other._id,
        date: '2026-06-10',
        targetCalories: 2000,
        totalCaloriesConsumed: 999,
        items: [],
      });

      const response = await request(app)
        .get('/api/logs/history')
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].date).toBe('2026-06-10');
      expect(response.body[1].date).toBe('2026-06-01');
      expect(response.body.every((log) => log.userId === user._id.toString())).toBe(true);
    });
  });

  describe('GET /api/logs/:date', () => {
    it('returns log for a specific date', async () => {
      const user = await createUser({ email: 'by-date@example.com' });
      const token = signToken(user);

      await DailyLog.create({
        userId: user._id,
        date: '2026-05-15',
        targetCalories: 2000,
        totalCaloriesConsumed: 350,
        items: [],
      });

      const response = await request(app)
        .get('/api/logs/2026-05-15')
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body.date).toBe('2026-05-15');
      expect(response.body.totalCaloriesConsumed).toBe(350);
    });

    it('returns 404 when log does not exist for date', async () => {
      const user = await createUser({ email: 'by-date-missing@example.com' });
      const token = signToken(user);

      const response = await request(app)
        .get('/api/logs/2026-01-01')
        .set(authHeader(token));

      expect(response.status).toBe(404);
      expect(response.body.message).toMatch(/log not found/i);
    });

    it('returns 400 for invalid date format', async () => {
      const user = await createUser({ email: 'by-date-invalid@example.com' });
      const token = signToken(user);

      const response = await request(app)
        .get('/api/logs/not-a-date')
        .set(authHeader(token));

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('POST /api/logs/add', () => {
    it('adds item to basket with correct calorie calculation', async () => {
      const user = await createUser({ email: 'add-basket@example.com' });
      const token = signToken(user);
      const product = await seedProduct();

      const response = await request(app)
        .post('/api/logs/add')
        .set(authHeader(token))
        .send({
          productId: product._id.toString(),
          unit: 'cup',
          quantity: 2,
        });

      expect(response.status).toBe(201);
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].productName).toBe('Test Apple');
      expect(response.body.items[0].unit).toBe('cup');
      expect(response.body.items[0].quantity).toBe(2);
      expect(response.body.items[0].calories).toBe(250);
      expect(response.body.totalCaloriesConsumed).toBe(250);
      expect(response.body.goalMet).toBe(true);
    });

    it('matches unit case-insensitively', async () => {
      const user = await createUser({ email: 'add-case@example.com' });
      const token = signToken(user);
      const product = await seedProduct();

      const response = await request(app)
        .post('/api/logs/add')
        .set(authHeader(token))
        .send({
          productId: product._id.toString(),
          unit: ' CUP ',
          quantity: 1,
        });

      expect(response.status).toBe(201);
      expect(response.body.items[0].unit).toBe('cup');
    });

    it('returns 404 when product does not exist', async () => {
      const user = await createUser({ email: 'add-no-product@example.com' });
      const token = signToken(user);
      const missingId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .post('/api/logs/add')
        .set(authHeader(token))
        .send({
          productId: missingId,
          unit: 'cup',
          quantity: 1,
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toMatch(/product not found/i);
    });

    it('returns 400 for invalid unit', async () => {
      const user = await createUser({ email: 'add-bad-unit@example.com' });
      const token = signToken(user);
      const product = await seedProduct();

      const response = await request(app)
        .post('/api/logs/add')
        .set(authHeader(token))
        .send({
          productId: product._id.toString(),
          unit: 'bucket',
          quantity: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/invalid unit/i);
    });

    it('returns 400 for invalid payload', async () => {
      const user = await createUser({ email: 'add-invalid@example.com' });
      const token = signToken(user);

      const response = await request(app)
        .post('/api/logs/add')
        .set(authHeader(token))
        .send({});

      expect(response.status).toBe(400);
    });

    it('adds manual calories without a product', async () => {
      const user = await createUser({ email: 'add-manual@example.com' });
      const token = signToken(user);

      const response = await request(app)
        .post('/api/logs/add')
        .set(authHeader(token))
        .send({
          calories: 60,
          name: 'אגוזי פקאן',
        });

      expect(response.status).toBe(201);
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].productName).toBe('אגוזי פקאן');
      expect(response.body.items[0].calories).toBe(60);
      expect(response.body.totalCaloriesConsumed).toBe(60);
    });

    it('returns 400 for malformed product payload', async () => {
      const user = await createUser({ email: 'add-malformed@example.com' });
      const token = signToken(user);

      const response = await request(app)
        .post('/api/logs/add')
        .set(authHeader(token))
        .send({
          productId: 'not-an-id',
          unit: '',
          quantity: 0,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('DELETE /api/logs/item/:itemId', () => {
    it('removes item from today basket and updates total calories', async () => {
      const user = await createUser({ email: 'remove-item@example.com' });
      const token = signToken(user);
      const product = await seedProduct();
      const today = new Date().toISOString().slice(0, 10);

      const log = await DailyLog.create({
        userId: user._id,
        date: today,
        targetCalories: 2000,
        totalCaloriesConsumed: 250,
        items: [
          {
            productId: product._id,
            productName: product.name,
            unit: 'cup',
            quantity: 2,
            calories: 250,
          },
        ],
      });

      const itemId = log.items[0]._id.toString();

      const response = await request(app)
        .delete(`/api/logs/item/${itemId}`)
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(0);
      expect(response.body.totalCaloriesConsumed).toBe(0);
    });

    it('returns 404 when today log does not exist', async () => {
      const user = await createUser({ email: 'remove-no-log@example.com' });
      const token = signToken(user);
      const itemId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .delete(`/api/logs/item/${itemId}`)
        .set(authHeader(token));

      expect(response.status).toBe(404);
      expect(response.body.message).toMatch(/today's log not found/i);
    });

    it('returns 404 when item is not in basket', async () => {
      const user = await createUser({ email: 'remove-no-item@example.com' });
      const token = signToken(user);
      const today = new Date().toISOString().slice(0, 10);
      const missingItemId = '507f1f77bcf86cd799439011';

      await DailyLog.create({
        userId: user._id,
        date: today,
        targetCalories: 2000,
        totalCaloriesConsumed: 0,
        items: [],
      });

      const response = await request(app)
        .delete(`/api/logs/item/${missingItemId}`)
        .set(authHeader(token));

      expect(response.status).toBe(404);
      expect(response.body.message).toMatch(/item not found/i);
    });
  });
});
