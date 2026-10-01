/**
 * @file Tunable values of the simulation.
 *
 * Every tunable value lives here, and nowhere else. Distances are in world units, not in pixels.
 */

/** Number of entities created at startup. */
export const ENTITY_COUNT = 4000;

/** Half side of the square the entities move in, in world units. The world is centered on (0, 0). */
export const WORLD_HALF_SIZE = 50;

/** Radius of an entity, in world units. */
export const ENTITY_RADIUS = 0.5;

/** Maximum initial speed of an entity along each axis, in world units per second. */
export const MAX_INITIAL_SPEED = 12;

/** Real time between two simulation ticks, in milliseconds. */
export const TICK_MS = 25;

/**
 * Simulated time per tick, in seconds.
 *
 * There is no catch-up: a tick always advances the simulation by this amount, even when it
 * took longer than {@link TICK_MS} to compute.
 */
export const TICK_SECONDS = TICK_MS / 1000;

/** Cell size of the proximity channel, in world units. */
export const CHANNEL_CELL_SIZE = ENTITY_RADIUS * 2;

/** Number of entities under which the whole tick runs on a single thread, without lot workers. */
export const SINGLE_THREAD_THRESHOLD = 1000;
/** Maximum number of lots, hence of lot workers, whatever the number of processor cores. */
export const MAX_LOT_COUNT = 8;
/** Processor cores left to the display and to the Orchestrator when sizing the lots. */
export const RESERVED_CORES = 2;
/** Checks a thread makes on a shared value before going to sleep: the active wait within a tick. */
export const SPIN_ITERATIONS = 2000;
/** Longest sleep of a thread waiting for an entity lock, in milliseconds. */
export const LOCK_WAIT_MS = 1;
/** Attempts the display makes to copy the entities between two ticks before giving up for a frame. */
export const DISPLAY_READ_ATTEMPTS = 8;

/**
 * Graphics card the display asks the browser for, on a machine that has several.
 *
 * It is a hint: the browser, or the operating system settings, may decide otherwise.
 */
export const GPU_POWER_PREFERENCE = 'high-performance';

/** Color of an entity, as a 0xRRGGBB value. */
export const ENTITY_COLOR = 0x4f7cff;
/** Color of the world outline, as a 0xRRGGBB value. */
export const WORLD_EDGE_COLOR = 0x8f99aa;
/** Background color, as a 0xRRGGBB value. */
export const BACKGROUND_COLOR = 0x11141a;
/** Margin kept around the world on screen, as a fraction of the world size. */
export const VIEW_MARGIN = 0.05;

/** Time over which the debugging overlay averages its figures, and its refresh interval, in milliseconds. */
export const DEBUG_REFRESH_MS = 500;
