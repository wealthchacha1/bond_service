const fastify = require('fastify')();
const fdRoutes = require('../routes/fdRoutes');
const { connectRedis } = require('../redis/redisClient');
const mongoose = require('mongoose');

beforeAll(async () => {
  await fastify.register(fdRoutes);
  await connectRedis(fastify);
  await fastify.ready();
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
});
afterAll(async () => {
  await mongoose.disconnect();
  await fastify.close();
});

describe('FD Service APIs', () => {
  it('should require auth token', async () => {
    const res = await fastify.inject({ method: 'GET', url: '/fd/popular' });
    expect(res.statusCode).toBe(401);
  });

  // Add more tests for each endpoint as needed
  // Example:
  // it('should return popular FDs', async () => {
  //   const res = await fastify.inject({
  //     method: 'GET',
  //     url: '/fd/popular',
  //     headers: { authorization: 'Bearer <valid-token>' },
  //   });
  //   expect(res.statusCode).toBe(200);
  //   expect(res.json().status).toBe('success');
  // });
});
