/** @file Unit tests of the movement rule. */
import { memoryWith } from '../../accessor/_tests/memory.fake';
import { moveProcessor } from '../move.processor';
//-----
describe('moveProcessor', () => {
   it('advances an entity by its velocity', () => {
      const accessor = memoryWith([[1, 2]]);
      accessor.velocities.set([4, -6]);
      //-----
      moveProcessor(accessor, 0, 1, 0.5);

      // Half a second at (4, -6) per second.
      expect(Array.from(accessor.positions)).toEqual([3, -1]);
      expect(Array.from(accessor.velocities)).toEqual([4, -6]);
   });
   //-----
   it('lets an entity leave the world', () => {
      const accessor = memoryWith([[9, -9]]);
      accessor.velocities.set([10, -10]);
      //-----
      moveProcessor(accessor, 0, 1, 1);

      // Nothing holds it back at the edges.
      expect(Array.from(accessor.positions)).toEqual([19, -19]);
   });
   //-----
   it('only moves the entities of the given range', () => {
      const accessor = memoryWith([
         [0, 0],
         [0, 0],
         [0, 0],
      ]);
      accessor.velocities.fill(1);
      //-----
      moveProcessor(accessor, 1, 2, 1);

      // Only the second entity moved.
      expect(Array.from(accessor.positions)).toEqual([0, 0, 1, 1, 0, 0]);
   });
   //-----
   it('does nothing for an empty range', () => {
      const accessor = memoryWith([[5, 5]]);
      accessor.velocities.fill(1);
      //-----
      moveProcessor(accessor, 0, 0, 1);

      // No entity was touched.
      expect(Array.from(accessor.positions)).toEqual([5, 5]);
   });
});
