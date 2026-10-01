/** @file Assembly of the simulation components inside a worker thread. */
import { Accessor, MemorySpec } from '../accessor/accessor';
import { Channel } from '../channels/channel';
import { CHANNEL_CELL_SIZE, WORLD_HALF_SIZE } from '../constants';
import { CalculusDispatcher, serveLot } from '../dispatcher/calculus-dispatcher';
import { createStepRunner, StepRunner } from '../dispatcher/step-runner';
import { Orchestrator } from './orchestrator';

/** What the main thread sends to a worker to start it. */
export interface SimulationStart {
   /** Shared memory of the simulation. */
   readonly buffer: SharedArrayBuffer;
   /** Sizes the memory was allocated with. */
   readonly spec: MemorySpec;
   /** Index of the lot the worker is in charge of. Only set for lot workers. */
   readonly lot?: number;
}

// Builds, for the calling thread, the views and the step runner over the shared memory.
function assemble(start: SimulationStart): {
   accessor: Accessor;
   channel: Channel;
   runStep: StepRunner;
} {
   const accessor = new Accessor(start.buffer, start.spec);
   const channel = new Channel(accessor, WORLD_HALF_SIZE, CHANNEL_CELL_SIZE);
   return { accessor, channel, runStep: createStepRunner(accessor, channel) };
}

/**
 * Builds the Orchestrator of a simulation, for the thread that runs the ticks.
 *
 * @param start - Shared memory and its spec.
 * @returns The Orchestrator. Calling `orchestrate` on it runs one tick.
 */
export function buildOrchestrator(start: SimulationStart): Orchestrator {
   const { accessor, channel, runStep } = assemble(start);
   return new Orchestrator(accessor, channel, new CalculusDispatcher(accessor, runStep));
}

/**
 * Builds the serving function of a lot worker.
 *
 * @param start - Shared memory, its spec, and the lot of the worker.
 * @param lot - Index of the lot the worker is in charge of.
 * @returns A function that waits for the next step, runs it for the lot and returns the
 * generation it served, to be passed to the next call. Start with `0`.
 */
export function buildLotServer(start: SimulationStart, lot: number): (seen: number) => number {
   const { accessor, runStep } = assemble(start);
   return (seen) => serveLot(accessor, lot, runStep, seen);
}
