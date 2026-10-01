/** @file Starting and stopping the worker threads of the simulation, from the main thread. */
import { InjectionToken } from '@angular/core';
import { MemorySpec } from '../accessor/accessor';
import { SimulationStart } from './simulation';
import { workerFactory } from './worker-factory';

/** Creates the worker threads. Tests provide fakes, as real Workers need a browser. */
export interface WorkerFactory {
   /**
    * Creates the worker that runs the ticks.
    *
    * @returns The worker, not started yet.
    */
   orchestrator(): Worker;
   /**
    * Creates a worker in charge of one lot.
    *
    * @returns The worker, not started yet.
    */
   lot(): Worker;
}

/**
 * Starts a simulation.
 *
 * @param buffer - Shared memory of the simulation, already initialised.
 * @param spec - Sizes the memory was allocated with.
 * @returns A function that stops the simulation.
 */
export type SimulationStarter = (buffer: SharedArrayBuffer, spec: MemorySpec) => () => void;

/**
 * Starts the worker threads of a simulation: one for the Orchestrator, plus one per lot
 * unless the simulation runs on a single thread.
 *
 * @param buffer - Shared memory of the simulation, already initialised.
 * @param spec - Sizes the memory was allocated with.
 * @param workers - Creates the worker threads.
 * @returns A function that terminates all the workers.
 */
export function startSimulation(
   buffer: SharedArrayBuffer,
   spec: MemorySpec,
   workers: WorkerFactory,
): () => void {
   const started: Worker[] = [];
   const start = (worker: Worker, message: SimulationStart) => {
      worker.postMessage(message);
      started.push(worker);
   };

   // Lot workers first, so that they are waiting when the first step is dispatched.
   const lots = spec.lotCount > 1 ? spec.lotCount : 0;
   for (let lot = 0; lot < lots; lot++) start(workers.lot(), { buffer, spec, lot });
   start(workers.orchestrator(), { buffer, spec });
   //-----
   return () => started.forEach((worker) => worker.terminate());
}

/** Starter used by the application. Defaults to real worker threads; tests provide a fake. */
export const SIMULATION_STARTER = new InjectionToken<SimulationStarter>('SIMULATION_STARTER', {
   factory: () => (buffer, spec) => startSimulation(buffer, spec, workerFactory),
});
