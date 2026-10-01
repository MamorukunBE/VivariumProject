# VivariumProject

A simulation of civilisations, built on a generic simulation engine and displayed with three.js inside an Angular application. `VivariumProject` is a working name.

The repository currently holds the generic engine only: entities that move in a straight line, simulated in worker threads over a shared memory. There is no game rule yet. The engine was ported from a separate proof of concept, [Entities_POC](https://github.com/MamorukunBE/Entities_POC).

## Commands

- `npm install`: installs the dependencies.
- `npm start`: dev server on http://localhost:4200.
- `npx ng build`: production build.
- `npm test -- --no-watch`: unit tests with the coverage report. The run fails below 100% coverage.
- `npx prettier --write "src/**/*.{ts,css,html}"`: formatting.

The conventions and the architecture are described in [CLAUDE.md](CLAUDE.md).
