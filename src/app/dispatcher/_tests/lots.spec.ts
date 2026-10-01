/** @file Unit tests of the split of the entities into lots. */
import { MAX_LOT_COUNT, RESERVED_CORES, SINGLE_THREAD_THRESHOLD } from '../../constants';
import { chooseLotCount, lotRange } from '../lots';
//-----
describe('chooseLotCount', () => {
   it('runs a small simulation on a single thread, whatever the machine', () =>
      expect(chooseLotCount(SINGLE_THREAD_THRESHOLD - 1, 64)).toBe(1));
   //-----
   it('uses one lot per spare core', () =>
      expect(chooseLotCount(SINGLE_THREAD_THRESHOLD, RESERVED_CORES + 3)).toBe(3));
   //-----
   it('never uses more lots than the maximum', () =>
      expect(chooseLotCount(SINGLE_THREAD_THRESHOLD, 256)).toBe(MAX_LOT_COUNT));
   //-----
   it('falls back to a single thread when the machine has no core to spare', () =>
      expect(chooseLotCount(SINGLE_THREAD_THRESHOLD, 1)).toBe(1));
});
//-----
describe('lotRange', () => {
   it('splits the entities into contiguous lots that cover them all', () => {
      const spec = { entityCount: 10, cellCount: 1, lotCount: 3 };
      //-----
      expect([0, 1, 2].map((lot) => lotRange(lot, spec))).toEqual([
         { start: 0, end: 4 },
         { start: 4, end: 8 },
         { start: 8, end: 10 },
      ]);
   });
   //-----
   it('gives an empty range when there is no entity', () =>
      expect(lotRange(0, { entityCount: 0, cellCount: 1, lotCount: 1 })).toEqual({
         start: 0,
         end: 0,
      }));
   //-----
   it('gives every entity to the only lot of a single-thread simulation', () =>
      expect(lotRange(0, { entityCount: 7, cellCount: 1, lotCount: 1 })).toEqual({
         start: 0,
         end: 7,
      }));
});
