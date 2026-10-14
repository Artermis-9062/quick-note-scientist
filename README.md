# Quick Note Scientist

A React note editor with Markdown/math preview, local note storage, and recoverable trash.

## Run and verify

- `npm ci` installs dependencies.
- `npm run dev` starts the app.
- `npm test` runs required storage/UI regression tests.
- `npm run lint` checks JavaScript and JSX.
- `npm run build` creates the production bundle.

## Learn by coding

Start with the [storage learning guide](learning/storage/README.md), then fill the
TODO gaps in [the exercises](learning/storage/exercises.js). Run
`npm run test:learning` to check your work. These intentionally incomplete exercises
are separate from the working app and CI. Worked examples are in a separate file;
`npm run test:learning:solutions` verifies them.

## Storage reliability

Notes, trash, and settings are saved together under the versioned `scientist-state`
localStorage key. Valid old keys are read until the first successful write migrates
them; old keys remain unchanged as recovery copies. Invalid or inaccessible saved
data blocks writes and auto-purge instead of overwriting it. Retry loading only reads.

Failed writes retain the previous snapshot and editor text. Editor drafts still need
an explicit save, and simultaneous editing in multiple tabs is not synchronized.

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
