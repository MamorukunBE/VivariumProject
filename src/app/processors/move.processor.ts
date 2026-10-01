/** @file Movement rule: how entities travel. */
import { Accessor } from '../accessor/accessor';

/**
 * Movement step: advances the entities of a range by their velocity.
 *
 * It only reads and writes the entities of the range, with no lock, so several threads can
 * run it at once on distinct ranges. Nothing keeps an entity inside the world: it goes on
 * in a straight line.
 *
 * @param accessor - Shared memory, read and written in place.
 * @param start - Id of the first entity of the range.
 * @param end - Id following the last entity of the range.
 * @param dt - Simulated time to advance by, in seconds.
 */
export function moveProcessor(accessor: Accessor, start: number, end: number, dt: number): void {
   const { positions, velocities } = accessor;

   // Each axis of each entity is handled the same way, whatever the number of dimensions.
   for (let i = start * 2; i < end * 2; i++) positions[i] += velocities[i] * dt;
}
