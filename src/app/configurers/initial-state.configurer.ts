/** @file Initial state of the simulation. */
import { ENTITY_RADIUS, MAX_INITIAL_SPEED, WORLD_HALF_SIZE } from '../constants';
import { Accessor } from '../accessor/accessor';

/**
 * Gives every entity a random position inside the world and a random velocity.
 *
 * Entities may overlap at first; the first ticks push them apart. To be called once, before
 * the simulation starts.
 *
 * @param accessor - Memory to initialise. Every entity it holds is overwritten.
 */
export function configureInitialState(accessor: Accessor): void {
   const { positions, velocities } = accessor;
   const limit = WORLD_HALF_SIZE - ENTITY_RADIUS;
   const randomIn = (max: number) => (Math.random() * 2 - 1) * max;
   //-----
   for (let i = 0; i < positions.length; i++) {
      positions[i] = randomIn(limit);
      velocities[i] = randomIn(MAX_INITIAL_SPEED);
   }
}
