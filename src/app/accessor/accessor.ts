/** @file Shared memory of the simulation and its single access point. */

/** Sizes that determine how the shared memory is laid out. Every thread must use the same. */
export interface MemorySpec {
   /** Number of entities. Valid ids range from `0` to `entityCount - 1`. */
   readonly entityCount: number;
   /** Number of cells of the proximity channel. */
   readonly cellCount: number;
   /** Number of lots the entities are split into. `1` means the tick runs on a single thread. */
   readonly lotCount: number;
}

/** Index, in {@link Accessor.control}, of the tick counter: odd while a tick is running. */
export const CONTROL_TICK = 0;
/** Index, in {@link Accessor.control}, of the number of steps dispatched to the lot workers so far. */
export const CONTROL_GENERATION = 1;
/** Index, in {@link Accessor.control}, of the number of lots that have not finished the current step. */
export const CONTROL_PENDING = 2;
/** Index, in {@link Accessor.control}, of the step the lot workers must run. */
export const CONTROL_STEP = 3;
/** Index, in {@link Accessor.stats}, of the duration of the last tick, in milliseconds. */
export const STAT_TICK_MS = 0;
//-----
const CONTROL_LENGTH = 4;
const STATS_LENGTH = 1;

// Lengths of the 64-bit float sections, in the order they are laid out.
const float64Lengths = (spec: MemorySpec): number[] => [
   spec.entityCount * 2,
   spec.entityCount * 2,
   STATS_LENGTH,
];

// Lengths of the 32-bit integer sections, in the order they are laid out after the floats.
const int32Lengths = (spec: MemorySpec): number[] => [
   CONTROL_LENGTH,
   spec.entityCount,
   spec.entityCount,
   spec.entityCount,
   spec.cellCount + 1,
];

/**
 * Single access point to the shared memory of the simulation.
 *
 * All the data lives in one `SharedArrayBuffer`. An Accessor is a set of typed views over
 * it: every thread builds its own Accessor on the same buffer and reads or writes the same
 * bytes, with no copy. The views are meant to be taken once, outside of loops, and then
 * indexed directly.
 *
 * The entity with id `n` owns slot `n` of each per-entity view. An id is a memory slot,
 * unrelated to the position of the entity in the world.
 *
 * @example
 * const spec = { entityCount: 100, cellCount: 2500, lotCount: 4 };
 * const accessor = new Accessor(Accessor.allocate(spec), spec);
 * const { positions } = accessor;
 * positions[7 * 2] = 12; // x of entity 7
 */
export class Accessor {
   /** Positions in world units, as `x, y` pairs: entity `n` is at indices `2n` and `2n + 1`. */
   readonly positions: Float64Array;
   /** Velocities in world units per second, laid out like {@link positions}. */
   readonly velocities: Float64Array;
   /** Figures about the simulation, indexed by the `STAT_*` constants. */
   readonly stats: Float64Array;
   /** Counters shared by the threads, indexed by the `CONTROL_*` constants. */
   readonly control: Int32Array;
   /** One lock per entity: `0` when free, `1` when held. Use `lockEntity` and `unlockEntity`. */
   readonly locks: Int32Array;
   /** Cell of the proximity channel each entity is in. */
   readonly entityCell: Int32Array;
   /** Entity ids sorted by cell. */
   readonly cellEntities: Int32Array;
   /** Where each cell starts in {@link cellEntities}; one more entry than there are cells. */
   readonly cellStart: Int32Array;

   /**
    * Builds the views over an existing memory.
    *
    * @param buffer - Shared memory, created by {@link Accessor.allocate} with the same spec.
    * @param spec - Sizes the memory was allocated with.
    */
   constructor(
      readonly buffer: SharedArrayBuffer,
      readonly spec: MemorySpec,
   ) {
      let offset = 0;
      const float64 = float64Lengths(spec).map((length) => {
         const view = new Float64Array(buffer, offset, length);
         offset += view.byteLength;
         return view;
      });
      const int32 = int32Lengths(spec).map((length) => {
         const view = new Int32Array(buffer, offset, length);
         offset += view.byteLength;
         return view;
      });
      //-----
      [this.positions, this.velocities, this.stats] = float64;
      [this.control, this.locks, this.entityCell, this.cellEntities, this.cellStart] = int32;
   }

   /**
    * Allocates the shared memory of a simulation. Every value starts at 0.
    *
    * @param spec - Sizes of the memory.
    * @returns The memory, to be handed to every thread along with the spec.
    */
   static allocate(spec: MemorySpec): SharedArrayBuffer {
      const sum = (lengths: number[]) => lengths.reduce((total, length) => total + length, 0);
      return new SharedArrayBuffer(sum(float64Lengths(spec)) * 8 + sum(int32Lengths(spec)) * 4);
   }
}
