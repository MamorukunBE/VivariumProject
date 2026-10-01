/** @file The steps of a tick that are run lot by lot, and what each one does for a lot. */
import { Accessor } from '../accessor/accessor';
import { Channel } from '../channels/channel';
import { TICK_SECONDS } from '../constants';
import { moveProcessor } from '../processors/move.processor';
import { lotRange } from './lots';

/** Step that moves the entities. */
export const STEP_MOVE = 0;
/** Step that computes the channel cell of each entity. */
export const STEP_ASSIGN_CELLS = 1;
/** Step in which the entities decide, reading only. No rule yet. */
export const STEP_DECIDE = 2;
/** Step in which the decisions are applied, under locks. No rule yet. */
export const STEP_ACT = 3;

/**
 * Runs one step of the tick for one lot.
 *
 * @param step - One of the `STEP_*` constants.
 * @param lot - Index of the lot to run the step for.
 */
export type StepRunner = (step: number, lot: number) => void;

/**
 * Builds the function that runs a step for a lot, by calling the matching Processor on the
 * entities of that lot.
 *
 * The same function is used by the lot workers and by the single-thread mode. The decision
 * and action steps are dispatched like the others, but they have no Processor yet: they do
 * nothing until their first rules are written.
 *
 * @param accessor - Shared memory the Processors work on.
 * @param channel - Proximity channel over the same memory.
 * @returns The step runner.
 */
export function createStepRunner(accessor: Accessor, channel: Channel): StepRunner {
   const noRuleYet = (): void => undefined;

   // One function per step, indexed by the STEP_* constants.
   const steps: ((start: number, end: number) => void)[] = [
      (start, end) => moveProcessor(accessor, start, end, TICK_SECONDS),
      (start, end) => channel.assignCells(start, end),
      noRuleYet,
      noRuleYet,
   ];
   //-----
   return (step, lot) => {
      const { start, end } = lotRange(lot, accessor.spec);
      steps[step](start, end);
   };
}
