import { defineConfig } from 'vitest/config';

// Separate projects keep intentionally unfinished exercises out of required CI tests.
export default defineConfig({
  test: {
    projects: [
      { test: { name: 'app', environment: 'jsdom', include: ['tests/**/*.{test,spec}.{js,jsx}'], setupFiles: ['tests/setup.js'] } },
      { test: { name: 'learning', environment: 'node', include: ['learning/**/exercises.test.js'] } },
      { test: { name: 'solutions', environment: 'node', include: ['learning/**/*.solutions.test.js'] } },
    ],
  },
});
