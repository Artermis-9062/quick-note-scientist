# Math-command learning stage

This branch is an intentionally red, test-first learning checkpoint based on
`origin/mvp-feat`. Start with [the lesson](learning/math/README.md), then fill
the gaps in [the exercises](learning/math/exercises.js). The production math
fix will follow your exercise attempt.

- `npm test`: production math regression tests (expected failures before the fix).
- `npm run test:coverage`: regression tests plus HTML/LCOV coverage.
- `npm run test:learning`: your separate practice exercises.
- `npm run test:e2e`: repeatable Playwright Chromium browser tests.
- `npm run lint` and `npm run build`: source checks and production build.

Coverage appears in `coverage/index.html`; browser results appear in
`playwright-report/index.html`. Generated reports are ignored in Git.

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.
You can also try [the experimental native React Compiler support in plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md#rust-react-compiler) by using `compiler: true` in the plugin options instead of using the Babel plugin.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
