# Backend Unit Tests

This directory contains comprehensive unit tests for the FAQ Analytics Backend using Jest.

## Test Structure

### Test Files

- `analyticsService.test.ts` - Tests for the AnalyticsService class
- `socketManager.test.ts` - Tests for WebSocket management
- `database.test.ts` - Tests for database initialization and configuration
- `logger.test.ts` - Tests for Winston logger configuration
- `analytics.routes.test.ts` - Tests for analytics API endpoints
- `system.routes.test.ts` - Tests for system health and metrics endpoints
- `export.routes.test.ts` - Tests for data export functionality
- `integration.test.ts` - Integration tests for the complete application

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode (for development)
npm run test:watch

# Run tests for CI (without watch)
npm run test:ci
```

## Coverage Goals

The tests are designed to achieve **80% code coverage** across:

- **Statements**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%

## Test Categories

### Unit Tests

- **Services**: Testing business logic in isolation
- **Routes**: Testing API endpoint behavior with mocked dependencies
- **Utilities**: Testing helper functions and configurations

### Integration Tests

- **API Integration**: Testing complete request/response cycles
- **Error Handling**: Testing error scenarios and proper error responses
- **Authentication**: Testing security middleware
- **Data Validation**: Testing input validation and sanitization

## Mocking Strategy

### Database Mocking

- PostgreSQL pool connections are mocked
- Query results are controlled through Jest mocks
- Database errors are simulated for error handling tests

### External Dependencies

- Winston logger is mocked to prevent actual file writes during tests
- Socket.io server is mocked for WebSocket testing
- Express middleware is tested with supertest

## Key Test Features

### Analytics Service Tests

- Query logging with various data combinations
- Real-time metrics calculation
- Anomaly detection algorithms
- Error handling for database failures

### API Route Tests

- Request validation
- Response formatting
- Error status codes
- Authentication and authorization
- Rate limiting behavior

### Database Tests

- Connection handling
- Table creation scripts
- Migration testing
- Connection pool management

### Socket Manager Tests

- Client connection handling
- Room management
- Real-time data broadcasting
- Client disconnection cleanup

## Test Configuration

### Jest Configuration (`jest.config.js`)

- TypeScript support with ts-jest
- Coverage thresholds set to 80%
- Setup files for test environment
- Mock configurations for external dependencies

### Test Environment

- Node.js test environment
- Mocked PostgreSQL database
- Isolated test runs with cleanup
- Environment variables for testing

## Best Practices

1. **Arrange-Act-Assert Pattern**: Tests follow clear structure
2. **Isolated Tests**: Each test is independent and can run alone
3. **Descriptive Names**: Test names clearly describe what is being tested
4. **Mock Cleanup**: All mocks are cleared between tests
5. **Error Scenarios**: Both success and failure cases are tested
6. **Edge Cases**: Boundary conditions and edge cases are covered

## Continuous Integration

Tests are configured to run in CI environments with:

- Coverage reporting
- Test result artifacts
- Failure notifications
- Performance monitoring

## Adding New Tests

When adding new tests:

1. Follow the existing naming convention
2. Add appropriate mocks for external dependencies
3. Include both positive and negative test cases
4. Ensure tests are deterministic and not dependent on external state
5. Update coverage thresholds if necessary

## Debugging Tests

To debug failing tests:

1. Run individual test files: `npm test -- filename.test.ts`
2. Use `--verbose` flag for detailed output
3. Check mock call counts and arguments
4. Verify test environment setup in `setup.ts`
