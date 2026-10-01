/** @file Creation of the worker threads. Kept apart: it is the only code that needs real Workers. */
import { WorkerFactory } from './simulation-starter';

/** Creates the real worker threads of the simulation. */
export const workerFactory: WorkerFactory = {
   orchestrator: () =>
      new Worker(new URL('./orchestrator.worker', import.meta.url), { type: 'module' }),
   lot: () => new Worker(new URL('../dispatcher/lot.worker', import.meta.url), { type: 'module' }),
};
