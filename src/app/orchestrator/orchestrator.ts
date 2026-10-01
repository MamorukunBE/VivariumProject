/** @file The tick: the ordered steps that advance the simulation. */
import { Accessor, CONTROL_TICK, STAT_TICK_MS } from '../accessor/accessor';
import { Channel } from '../channels/channel';
import { CalculusDispatcher } from '../dispatcher/calculus-dispatcher';
import { STEP_ACT, STEP_ASSIGN_CELLS, STEP_DECIDE, STEP_MOVE } from '../dispatcher/step-runner';

/**
 * Runs the steps of a tick, always in the same order: movement, channels, decision, action.
 *
 * It holds no rule of its own. Each step is handed to the dispatcher, which has it run for
 * every lot and returns when all are done: the steps never overlap. The decision and action
 * steps are dispatched like the others, although they have no rule yet.
 */
export class Orchestrator {
   /**
    * @param accessor - Shared memory of the simulation.
    * @param channel - Proximity channel, rebuilt on every tick.
    * @param dispatcher - Runs a step for every lot.
    */
   constructor(
      private readonly accessor: Accessor,
      private readonly channel: Channel,
      private readonly dispatcher: CalculusDispatcher,
   ) {}

   /**
    * Advances the simulation by one tick, that is by `TICK_SECONDS` of simulated time.
    *
    * Meant to be called at a fixed real-time interval. A call that comes late is not
    * compensated: the simulation simply runs slower. The tick counter is odd for the whole
    * duration of the call, which tells the display not to trust what it reads meanwhile.
    */
   orchestrate(): void {
      const { control, stats } = this.accessor;
      const startedAt = performance.now();
      Atomics.add(control, CONTROL_TICK, 1);

      // 1. Movement
      this.dispatcher.dispatch(STEP_MOVE);

      // 2. Channels
      this.dispatcher.dispatch(STEP_ASSIGN_CELLS);
      this.channel.build();

      // 3. Decision (read-only)
      this.dispatcher.dispatch(STEP_DECIDE);

      // 4. Action
      this.dispatcher.dispatch(STEP_ACT);

      // The tick is complete: the display can read again.
      Atomics.add(control, CONTROL_TICK, 1);
      stats[STAT_TICK_MS] = performance.now() - startedAt;
   }
}
