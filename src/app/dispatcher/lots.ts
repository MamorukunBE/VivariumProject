/** @file How the entities are split into lots, one per lot worker. */
import { MemorySpec } from '../accessor/accessor';
import { MAX_LOT_COUNT, RESERVED_CORES, SINGLE_THREAD_THRESHOLD } from '../constants';

/** A contiguous range of entity ids. */
export interface LotRange {
   /** Id of the first entity of the lot. */
   readonly start: number;
   /** Id following the last entity of the lot. */
   readonly end: number;
}

/**
 * Chooses how many lots to split the entities into.
 *
 * @param entityCount - Number of entities of the simulation.
 * @param cores - Number of logical processor cores of the machine.
 * @returns `1` when the simulation is small enough to run on a single thread, or when the
 * machine has no core to spare; otherwise one lot per spare core, up to `MAX_LOT_COUNT`.
 */
export const chooseLotCount = (entityCount: number, cores: number): number =>
   entityCount < SINGLE_THREAD_THRESHOLD
      ? 1
      : Math.max(1, Math.min(cores - RESERVED_CORES, MAX_LOT_COUNT));

/**
 * Computes the entities of a lot. Lots are contiguous, of equal size but for the last one.
 *
 * @param lot - Index of the lot, from `0` to `spec.lotCount - 1`.
 * @param spec - Sizes of the memory.
 * @returns The range of entity ids of the lot.
 */
export function lotRange(lot: number, spec: MemorySpec): LotRange {
   const size = Math.ceil(spec.entityCount / spec.lotCount);
   return { start: lot * size, end: Math.min((lot + 1) * size, spec.entityCount) };
}
