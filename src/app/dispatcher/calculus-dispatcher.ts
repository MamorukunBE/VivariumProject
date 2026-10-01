/** @file Dispatching of a step to the lot workers, and the lot worker side of it. */
import { Accessor, CONTROL_GENERATION, CONTROL_PENDING, CONTROL_STEP } from '../accessor/accessor';
import { waitWhileEqual } from './atomic-wait';
import { StepRunner } from './step-runner';

/**
 * Has a step of the tick run for every lot, and returns once all of them are done.
 *
 * With several lots, the step is published in the shared memory, the lot workers are woken
 * up, and the calling thread waits for all of them: this wait is the barrier between two
 * steps. With a single lot there are no lot workers, and the step runs on the calling thread.
 *
 * Not to be used on the main thread, as it blocks while waiting.
 */
export class CalculusDispatcher {
   /**
    * @param accessor - Shared memory used to talk to the lot workers.
    * @param runStep - Runs a step for a lot. Only used in single-thread mode.
    */
   constructor(
      private readonly accessor: Accessor,
      private readonly runStep: StepRunner,
   ) {}

   /**
    * Runs a step for every lot and waits until it is complete.
    *
    * @param step - One of the `STEP_*` constants.
    */
   dispatch(step: number): void {
      const { control, spec } = this.accessor;
      if (spec.lotCount === 1) return this.runStep(step, 0);

      // Publish the step and wake the lot workers up.
      Atomics.store(control, CONTROL_STEP, step);
      Atomics.store(control, CONTROL_PENDING, spec.lotCount);
      Atomics.add(control, CONTROL_GENERATION, 1);
      Atomics.notify(control, CONTROL_GENERATION);

      // Barrier: wait until every lot has reported.
      for (;;) {
         const pending = Atomics.load(control, CONTROL_PENDING);
         if (pending === 0) return;
         waitWhileEqual(control, CONTROL_PENDING, pending);
      }
   }
}

/**
 * Lot worker side: waits for the next dispatched step, runs it for a lot, and reports.
 *
 * A lot worker calls it in an endless loop, feeding each result into the next call.
 *
 * @param accessor - Shared memory used to talk to the dispatcher.
 * @param lot - Index of the lot this worker is in charge of.
 * @param runStep - Runs a step for a lot.
 * @param seenGeneration - Value returned by the previous call, or `0` for the first one.
 * @returns The generation that was served, to pass to the next call.
 */
export function serveLot(
   accessor: Accessor,
   lot: number,
   runStep: StepRunner,
   seenGeneration: number,
): number {
   const { control } = accessor;
   waitWhileEqual(control, CONTROL_GENERATION, seenGeneration);
   const generation = Atomics.load(control, CONTROL_GENERATION);
   runStep(Atomics.load(control, CONTROL_STEP), lot);

   // Report, and wake the dispatcher up when this lot is the last one.
   if (Atomics.sub(control, CONTROL_PENDING, 1) === 1) Atomics.notify(control, CONTROL_PENDING);
   return generation;
}
