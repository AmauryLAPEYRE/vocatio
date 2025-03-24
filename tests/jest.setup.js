// tests/jest.setup.js
require('@testing-library/jest-dom');

// Mock de Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    pathname: '/',
    query: {}
  }))
}));

// Mock de zustand persist
jest.mock('zustand/middleware', () => ({
  persist: jest.fn().mockImplementation((config) => (set, get, api) => config(set, get, api))
}));