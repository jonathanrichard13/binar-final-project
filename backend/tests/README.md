# Backend Testing Guide

This document describes the testing setup and CI/CD pipeline for the FAQ Analytics Backend.

## Testing Setup

### Test Framework
- **Jest**: Main testing framework with TypeScript support
- **Supertest**: HTTP assertion library for API testing
- **Coverage**: LCOV reports for SonarCloud integration

### Test Structure
```
tests/
├── setup.ts              # Global test configuration
├── services/
│   └── analyticsService.test.ts
├── routes/
│   └── analytics.test.ts
└── server.test.ts         # Health check tests
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

## CI/CD Pipeline

The GitHub Actions workflow includes:

### 1. **Linting** 🔍
- ESLint for code quality
- Prettier for code formatting
- TypeScript compilation checks

### 2. **Testing** 🧪
- Unit tests with Jest
- Code coverage reporting
- PostgreSQL service for database testing
- Coverage upload to Codecov

### 3. **SonarCloud Scan** 📊
- Code quality analysis
- Security vulnerability detection
- Technical debt tracking
- Coverage integration

### 4. **Build** 🏗️
- TypeScript compilation
- Artifact generation
- Build verification

### 5. **Security** 🔒
- npm audit for dependencies
- Snyk vulnerability scanning

## Environment Setup

### Required Secrets

Add these secrets to your GitHub repository:

```
SONAR_TOKEN=your_sonarcloud_token
SNYK_TOKEN=your_snyk_token (optional)
```

### SonarCloud Configuration

1. Create a SonarCloud account and organization
2. Update `sonar-project.properties` with your details:
   ```properties
   sonar.projectKey=your-project-key
   sonar.organization=your-org-name
   ```
3. Add `SONAR_TOKEN` to GitHub secrets

## Test Coverage

Current coverage thresholds:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## Writing Tests

### Service Tests
```typescript
describe('AnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log query successfully', async () => {
    // Mock database
    (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });
    
    // Test logic
    await AnalyticsService.logQuery(queryData);
    
    // Assertions
    expect(mockPool.query).toHaveBeenCalledWith(/* ... */);
  });
});
```

### Route Tests
```typescript
describe('Analytics Routes', () => {
  it('should return analytics overview', async () => {
    // Mock database responses
    (mockPool.query as jest.Mock).mockResolvedValue({ rows: mockData });
    
    // Test API endpoint
    const response = await request(app)
      .get('/api/analytics/overview')
      .expect(200);
    
    // Verify response
    expect(response.body).toHaveProperty('totalQueries');
  });
});
```

## Mocking Strategy

### Database Mocking
```typescript
jest.mock('../../src/database/init', () => ({
  pool: {
    query: jest.fn(),
  },
}));
```

### Logger Mocking
```typescript
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));
```

## Best Practices

1. **Isolation**: Each test should run independently
2. **Mocking**: Mock external dependencies (database, APIs)
3. **Coverage**: Aim for high coverage but focus on meaningful tests
4. **Naming**: Use descriptive test names
5. **Setup/Teardown**: Clean up mocks between tests

## Troubleshooting

### Common Issues
1. **Import Errors**: Check file paths and TypeScript configuration
2. **Mock Issues**: Ensure mocks are properly configured in setup files
3. **Coverage Gaps**: Review uncovered code and add relevant tests
4. **CI Failures**: Check logs for specific error messages

### Debug Commands
```bash
# Verbose test output
npm test -- --verbose

# Run specific test file
npm test -- analyticsService.test.ts

# Debug mode
npm test -- --detectOpenHandles --forceExit
```
