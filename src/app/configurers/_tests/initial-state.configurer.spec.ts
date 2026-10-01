/** @file Unit tests of the initial state. */
import { memoryWith } from '../../accessor/_tests/memory.fake';
import { ENTITY_RADIUS, MAX_INITIAL_SPEED, WORLD_HALF_SIZE } from '../../constants';
import { configureInitialState } from '../initial-state.configurer';
//-----
describe('configureInitialState', () => {
   afterEach(() => vi.restoreAllMocks());
   //-----
   it('keeps every entity inside the world and under the maximum speed', () => {
      const accessor = memoryWith(Array.from({ length: 200 }, () => [0, 0]));
      const limit = WORLD_HALF_SIZE - ENTITY_RADIUS;
      //-----
      configureInitialState(accessor);

      // Every coordinate of every entity respects the bounds, and they are not all the same.
      expect(accessor.positions.every((value) => Math.abs(value) <= limit)).toBe(true);
      expect(accessor.velocities.every((value) => Math.abs(value) <= MAX_INITIAL_SPEED)).toBe(true);
      expect(new Set(accessor.positions).size).toBeGreaterThan(100);
   });
   //-----
   it('maps the lowest random value to the lowest bound', () => {
      const accessor = memoryWith([[0, 0]]);
      vi.spyOn(Math, 'random').mockReturnValue(0);
      //-----
      configureInitialState(accessor);

      // A random value of 0 gives the most negative position and velocity.
      expect(accessor.positions[0]).toBe(-(WORLD_HALF_SIZE - ENTITY_RADIUS));
      expect(accessor.velocities[1]).toBe(-MAX_INITIAL_SPEED);
   });
});
