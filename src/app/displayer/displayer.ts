/** @file Bridge between the simulation and the display: turns the shared memory into a ViewModel. */
import { Accessor, CONTROL_TICK, STAT_TICK_MS } from '../accessor/accessor';
import { DISPLAY_READ_ATTEMPTS } from '../constants';

/** What the Renderer receives: plain positions, with no knowledge of entities. */
export interface ViewModel {
   /** Number of entities described by {@link positions}. */
   readonly count: number;
   /** Positions in world units, as `x, y` pairs: entity `n` is at indices `2n` and `2n + 1`. */
   readonly positions: Float32Array;
   /** Duration of the last simulation tick, in milliseconds. */
   tickMs: number;
}

/**
 * Reads the shared memory and produces the ViewModel.
 *
 * It runs on the display thread, at the display's own pace, while the simulation threads
 * keep writing. It never takes a lock: it relies on the tick counter, which is odd while a
 * tick is running, to know whether what it copied is a complete state.
 */
export class Displayer {
   private readonly viewModel: ViewModel;

   /**
    * Prepares a ViewModel sized for the entities of the memory.
    *
    * @param accessor - Shared memory of the simulation.
    */
   constructor(private readonly accessor: Accessor) {
      this.viewModel = {
         count: accessor.spec.entityCount,
         positions: new Float32Array(accessor.spec.entityCount * 2),
         tickMs: 0,
      };
   }

   /**
    * Copies the current state of the simulation into the ViewModel.
    *
    * The copy is retried, up to `DISPLAY_READ_ATTEMPTS` times, until it falls entirely
    * between two ticks. If every attempt overlaps a tick, the last copy is kept as it is:
    * some entities may then be one tick ahead of the others for that frame.
    *
    * @returns The ViewModel. The same object is reused and overwritten on every call, so it
    * must be consumed before the next one.
    */
   read(): ViewModel {
      const { control, positions, stats } = this.accessor;
      for (let attempt = 0; attempt < DISPLAY_READ_ATTEMPTS; attempt++) {
         const tick = Atomics.load(control, CONTROL_TICK);
         this.viewModel.positions.set(positions);
         if (tick % 2 === 0 && Atomics.load(control, CONTROL_TICK) === tick) break;
      }
      //-----
      this.viewModel.tickMs = stats[STAT_TICK_MS];
      return this.viewModel;
   }
}
