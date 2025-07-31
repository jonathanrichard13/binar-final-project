# GitHub Actions Workflow

This repository includes a GitHub Actions workflow for automated testing and linting of the backend code.

## Backend CI Workflow

**File**: `.github/workflows/backend-ci.yml`

### Triggers
- **Push**: When code is pushed to `main`, `develop`, or `add-test` branches
- **Pull Request**: When PRs are opened against `main` or `develop` branches
- **Path filtering**: Only runs when backend code or the workflow file itself changes

### What it does
1. **Environment Setup**
   - Runs on Ubuntu Latest
   - Tests against Node.js 18.x and 20.x
   - Sets up PostgreSQL 15 service for database testing
   - Installs dependencies with npm ci

2. **Code Quality Checks**
   - **Linting**: ESLint with TypeScript support
   - **Formatting**: Prettier code formatting validation
   - **Testing**: Jest unit tests with coverage reporting

3. **Artifacts & Reports**
   - Uploads test coverage to Codecov (Node.js 20.x only)
   - Archives test results and coverage reports
   - Continues on coverage errors (doesn't fail the build)

### Status Badge

The backend README includes a status badge showing the current state of the CI pipeline:

[![Backend CI](https://github.com/jonathanrichard13/binar-final-project/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/jonathanrichard13/binar-final-project/actions/workflows/backend-ci.yml)

### Local Testing

Before pushing code, you can run the same checks locally:

```bash
cd backend

# Install dependencies
npm install

# Run linting
npm run lint:check

# Check formatting
npm run format:check

# Run tests
npm run test:ci:basic

# Generate coverage (optional)
npm run test:coverage
```

### Configuration Files

- **ESLint**: `.eslintrc.js` - Linting rules and TypeScript configuration
- **Prettier**: `.prettierrc.json` - Code formatting rules  
- **Jest**: `jest.config.js` - Test configuration and coverage settings
- **Environment**: `.env.example` - Template for environment variables

### Coverage Settings

The Jest configuration excludes certain files from coverage:
- Server entry point (`server.ts`)
- Test files and directories
- Configuration files (`swagger.ts`)
- Database initialization (`database/init.ts`)
- External integrations (`mcpIntegration.ts`)
- Logger utilities
- Backup/original files (`*.original.ts`, `*.simplified.ts`)

This ensures coverage metrics focus on core business logic rather than boilerplate or configuration code.
