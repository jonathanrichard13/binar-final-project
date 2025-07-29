import request from 'supertest';
import { app } from '../../src/server';

// Mock database initialization
jest.mock('../../src/database/init', () => ({
  initializeDatabase: jest.fn().mockResolvedValue(undefined),
  pool: {
    query: jest.fn(),
  },
}));

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Server Health Check', () => {
  it('should return health status', async () => {
    const response = await request(app).get('/health').expect(200);

    expect(response.body).toHaveProperty('status', 'OK');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
  });

  it('should handle 404 for unknown routes', async () => {
    const response = await request(app).get('/unknown-route').expect(404);

    expect(response.body).toHaveProperty('error', 'Route not found');
  });
});
