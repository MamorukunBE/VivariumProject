/** @file Per-entity locks, taken during the action step only. */
import { LOCK_WAIT_MS } from '../constants';

/**
 * Takes the lock of an entity, waiting for it if another thread holds it.
 *
 * To lock several entities, always take the locks in increasing id order: two threads can
 * then never wait for each other.
 *
 * @param locks - Lock view of the Accessor.
 * @param id - Id of the entity to lock.
 */
export function lockEntity(locks: Int32Array, id: number): void {
   while (Atomics.compareExchange(locks, id, 0, 1) !== 0) Atomics.wait(locks, id, 1, LOCK_WAIT_MS);
}

/**
 * Releases the lock of an entity.
 *
 * @param locks - Lock view of the Accessor.
 * @param id - Id of the entity to unlock. The calling thread must hold its lock.
 * @returns `0`, the value of a free lock.
 */
export const unlockEntity = (locks: Int32Array, id: number): number => Atomics.store(locks, id, 0);
