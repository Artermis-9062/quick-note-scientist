import { defineConfig } from 'vitest/config';

// Required regression tests and unfinished learning exercises are separate projects.
export default defineConfig({
  test: {
    projects: [
      { test: { name: 'math', environment: 'node', include: ['tests/**/*.test.js'] } },
      { test: { name: 'learning', environment: 'node', include: ['learning/math/**/*.test.js'] } },
    ],
    // Only the production translator is measured; exercises cannot inflate coverage.
    coverage: {
      provider: 'v8',
      include: ['src/utils/mathTranslator.js'],
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: 'coverage',
      // Red tests still produce a useful baseline report during the learning stage.
      reportOnFailure: true,
      // These are final acceptance targets; failing them now is an honest red baseline.
      thresholds: { lines: 90, statements: 90, functions: 90, branches: 80 },
    },
  },
});
