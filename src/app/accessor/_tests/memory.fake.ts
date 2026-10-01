/** @file Small shared memories for unit tests. */
import { cellCountFor } from '../../channels/channel';
import { CHANNEL_CELL_SIZE, WORLD_HALF_SIZE } from '../../constants';
import { Accessor } from '../accessor';

/** Half side of the world used by the tests that pick their own world size. */
export const TEST_WORLD_HALF_SIZE = 10;
/** Cell size used by the tests that pick their own world size. */
export const TEST_CELL_SIZE = 2;

/**
 * Builds a memory holding one motionless entity per given position, in a small test world.
 *
 * @param positions - Position of each entity, as `[x, y]`.
 * @param lotCount - Number of lots of the memory.
 * @returns An Accessor over a freshly allocated memory.
 */
export const memoryWith = (positions: [number, number][], lotCount = 1): Accessor =>
   filled(positions, lotCount, cellCountFor(TEST_WORLD_HALF_SIZE, TEST_CELL_SIZE));

/**
 * Builds a memory holding one motionless entity per given position, sized like the real
 * simulation: same world and same cells as in the constants.
 *
 * @param positions - Position of each entity, as `[x, y]`.
 * @param lotCount - Number of lots of the memory.
 * @returns An Accessor over a freshly allocated memory.
 */
export const simulationMemoryWith = (positions: [number, number][], lotCount = 1): Accessor =>
   filled(positions, lotCount, cellCountFor(WORLD_HALF_SIZE, CHANNEL_CELL_SIZE));

// Allocates a memory and writes the positions into it.
function filled(positions: [number, number][], lotCount: number, cellCount: number): Accessor {
   const spec = { entityCount: positions.length, cellCount, lotCount };
   const accessor = new Accessor(Accessor.allocate(spec), spec);
   accessor.positions.set(positions.flat());
   return accessor;
}
