/** @file Unit tests of the dispatcher and of the lot worker side. */
import { memoryWith } from '../../accessor/_tests/memory.fake';
import {
   Accessor,
   CONTROL_GENERATION,
   CONTROL_PENDING,
   CONTROL_STEP,
} from '../../accessor/accessor';
import { CalculusDispatcher, serveLot } from '../calculus-dispatcher';
import { STEP_ASSIGN_CELLS, STEP_MOVE } from '../step-runner';
//-----
describe('CalculusDispatcher', () => {
   afterEach(() => vi.restoreAllMocks());
   //-----
   it('runs the step on the calling thread when there is a single lot', () => {
      const accessor = memory(1);
      const runStep = vi.fn();
      //-----
      new CalculusDispatcher(accessor, runStep).dispatch(STEP_ASSIGN_CELLS);

      // Nothing is published: there are no lot workers to wake up.
      expect(runStep).toHaveBeenCalledExactlyOnceWith(STEP_ASSIGN_CELLS, 0);
      expect(accessor.control[CONTROL_GENERATION]).toBe(0);
   });
   //-----
   it('publishes the step to the lot workers and waits for all of them', () => {
      const accessor = memory(3);
      const runStep = vi.fn();
      const notify = vi.spyOn(Atomics, 'notify');
      const pendingSeen: number[] = [];

      // Each time the dispatcher sleeps, one more lot worker reports.
      vi.spyOn(Atomics, 'wait').mockImplementation((values, index) => {
         pendingSeen.push(Number(values[index]));
         Atomics.sub(accessor.control, CONTROL_PENDING, 1);
         return 'ok';
      });
      //-----
      new CalculusDispatcher(accessor, runStep).dispatch(STEP_ASSIGN_CELLS);

      // The step went out once, and the dispatcher only returned when no lot was pending.
      expect(accessor.control[CONTROL_STEP]).toBe(STEP_ASSIGN_CELLS);
      expect(accessor.control[CONTROL_GENERATION]).toBe(1);
      expect(notify).toHaveBeenCalledExactlyOnceWith(accessor.control, CONTROL_GENERATION);
      expect(pendingSeen).toEqual([3, 2, 1]);
      expect(runStep).not.toHaveBeenCalled();
   });
});
//-----
describe('serveLot', () => {
   afterEach(() => vi.restoreAllMocks());
   //-----
   it('runs the dispatched step for its lot and reports', () => {
      const accessor = dispatched(STEP_MOVE, 2);
      const runStep = vi.fn();
      const notify = vi.spyOn(Atomics, 'notify');
      //-----
      const generation = serveLot(accessor, 1, runStep, 0);

      // One lot is still pending, so the dispatcher is not woken up yet.
      expect(runStep).toHaveBeenCalledExactlyOnceWith(STEP_MOVE, 1);
      expect(generation).toBe(1);
      expect(accessor.control[CONTROL_PENDING]).toBe(1);
      expect(notify).not.toHaveBeenCalled();
   });
   //-----
   it('wakes the dispatcher up when it is the last lot to report', () => {
      const accessor = dispatched(STEP_MOVE, 1);
      const notify = vi.spyOn(Atomics, 'notify');
      //-----
      serveLot(accessor, 0, vi.fn(), 0);

      // No lot is pending anymore.
      expect(accessor.control[CONTROL_PENDING]).toBe(0);
      expect(notify).toHaveBeenCalledExactlyOnceWith(accessor.control, CONTROL_PENDING);
   });
   //-----
   it('sleeps until a new step is dispatched', () => {
      const accessor = dispatched(STEP_MOVE, 1);
      const runStep = vi.fn();

      // The next step is dispatched while the lot worker sleeps.
      const wait = vi.spyOn(Atomics, 'wait').mockImplementation(() => {
         accessor.control[CONTROL_STEP] = STEP_ASSIGN_CELLS;
         accessor.control[CONTROL_GENERATION] = 2;
         return 'ok';
      });
      //-----
      const generation = serveLot(accessor, 0, runStep, 1);

      // It did not serve the step it had already seen.
      expect(wait).toHaveBeenCalledOnce();
      expect(runStep).toHaveBeenCalledExactlyOnceWith(STEP_ASSIGN_CELLS, 0);
      expect(generation).toBe(2);
   });
});

// Builds a memory of six entities split into the given number of lots.
const memory = (lotCount: number): Accessor =>
   memoryWith(
      Array.from({ length: 6 }, () => [0, 0]),
      lotCount,
   );

// Builds a memory in which a step has just been dispatched and some lots have yet to report.
function dispatched(step: number, pending: number): Accessor {
   const accessor = memory(2);
   accessor.control[CONTROL_STEP] = step;
   accessor.control[CONTROL_GENERATION] = 1;
   accessor.control[CONTROL_PENDING] = pending;
   return accessor;
}
