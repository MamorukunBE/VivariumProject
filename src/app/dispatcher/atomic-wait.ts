/** @file Waiting for another thread to change a shared value. */
import { SPIN_ITERATIONS } from '../constants';

/**
 * Blocks the calling thread while a shared value keeps a given value.
 *
 * It first waits actively, checking the value `SPIN_ITERATIONS` times: within a tick, the
 * change comes almost at once and going to sleep would cost more than it saves. If the value
 * still has not changed, the thread sleeps until another thread calls `Atomics.notify` on it.
 *
 * Not to be called on the main thread, which is not allowed to sleep.
 *
 * @param values - Shared view holding the value.
 * @param index - Index of the value in the view.
 * @param value - Value to wait out.
 */
export function waitWhileEqual(values: Int32Array, index: number, value: number): void {
   let spins = SPIN_ITERATIONS;
   while (spins-- > 0) if (Atomics.load(values, index) !== value) return;
   Atomics.wait(values, index, value);
}
