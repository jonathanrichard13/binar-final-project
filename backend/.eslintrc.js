module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
    es2022: true,
  },
  ignorePatterns: ['.eslintrc.js', 'dist/', 'coverage/', 'node_modules/', 'tests/', '**/*.test.ts', '**/*.spec.ts'],
  rules: {
    'no-console': 'warn',
    'prefer-const': ['error', { destructuring: 'any', ignoreReadBeforeAssign: false }],
    'no-var': 'error',
    'no-unused-vars': 'off', // Turn off base rule
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  },
};
