/** @file Unit tests of the Displayer. */
import { memoryWith } from '../../accessor/_tests/memory.fake';
import { CONTROL_TICK, STAT_TICK_MS } from '../../accessor/accessor';
import { DISPLAY_READ_ATTEMPTS } from '../../constants';
import { Displayer } from '../displayer';
//-----
describe('Displayer', () => {
   afterEach(() => vi.restoreAllMocks());
   //-----
   it('copies the positions of the entities as x, y pairs', () => {
      const accessor = memoryWith([
         [1, 2],
         [-3, 4],
      ]);
      //-----
      const viewModel = new Displayer(accessor).read();

      // One pair per entity, in id order.
      expect(viewModel.count).toBe(2);
      expect(Array.from(viewModel.positions)).toEqual([1, 2, -3, 4]);
   });
   //-----
   it('produces an empty ViewModel for a simulation without any entity', () => {
      const viewModel = new Displayer(memoryWith([])).read();
      //-----
      expect(viewModel.count).toBe(0);
      expect(viewModel.positions).toHaveLength(0);
   });
   //-----
   it('reflects the memory as it is at the time of the read', () => {
      const accessor = memoryWith([[0, 0]]);
      const displayer = new Displayer(accessor);
      const first = displayer.read();
      //-----
      accessor.positions.set([9, 9]);
      accessor.stats[STAT_TICK_MS] = 1.5;

      // The same ViewModel object is reused and overwritten.
      expect(displayer.read()).toBe(first);
      expect(Array.from(first.positions)).toEqual([9, 9]);
      expect(first.tickMs).toBe(1.5);
   });
   //-----
   it('copies again when a tick started during the copy', () => {
      const accessor = memoryWith([[0, 0]]);
      const load = vi
         .spyOn(Atomics, 'load')
         .mockReturnValueOnce(0 as never)
         .mockReturnValueOnce(2 as never);
      //-----
      new Displayer(accessor).read();

      // First attempt: the counter changed. Second attempt: it did not.
      expect(load).toHaveBeenCalledTimes(4);
   });
   //-----
   it('gives up for the frame when every attempt overlaps a tick', () => {
      const accessor = memoryWith([[7, 8]]);
      accessor.control[CONTROL_TICK] = 1;
      const load = vi.spyOn(Atomics, 'load');
      //-----
      const viewModel = new Displayer(accessor).read();

      // The counter stayed odd: one check per attempt, and the last copy is kept.
      expect(load).toHaveBeenCalledTimes(DISPLAY_READ_ATTEMPTS);
      expect(Array.from(viewModel.positions)).toEqual([7, 8]);
   });
});
