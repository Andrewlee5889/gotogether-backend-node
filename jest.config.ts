import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  clearMocks: true,
};

export default config;
