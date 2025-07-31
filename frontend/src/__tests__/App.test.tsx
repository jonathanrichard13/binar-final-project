import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

// Mock the child components
jest.mock('../components/Layout', () => {
  return function MockLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="layout">{children}</div>;
  };
});

jest.mock('../pages/Dashboard', () => {
  return function MockDashboard() {
    return <div data-testid="dashboard">Dashboard Content</div>;
  };
});

describe('App Component', () => {
  test('renders without crashing', () => {
    render(<App />);
    expect(screen.getByTestId('layout')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
  });

  test('renders dashboard within layout', () => {
    render(<App />);
    const layout = screen.getByTestId('layout');
    const dashboard = screen.getByTestId('dashboard');

    expect(layout).toContainElement(dashboard);
  });

  test('displays dashboard content', () => {
    render(<App />);
    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
  });
});
