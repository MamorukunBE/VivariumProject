/** @file Unit tests of the wait on a shared value. */
import { SPIN_ITERATIONS } from '../../constants';
import { waitWhileEqual } from '../atomic-wait';
//-----
describe('waitWhileEqual', () => {
   afterEach(() => vi.restoreAllMocks());
   //-----
   it('returns at once when the value is already different', () => {
      const values = sharedValues();
      const wait = vi.spyOn(Atomics, 'wait');
      //-----
      waitWhileEqual(values, 1, 5);

      // The thread never went to sleep.
      expect(wait).not.toHaveBeenCalled();
   });
   //-----
   it('stops waiting actively as soon as the value changes', () => {
      const values = sharedValues();
      const wait = vi.spyOn(Atomics, 'wait');
      const load = vi
         .spyOn(Atomics, 'load')
         .mockReturnValueOnce(5 as never)
         .mockReturnValueOnce(5 as never);
      //-----
      waitWhileEqual(values, 1, 5);

      // Two checks saw the old value, the third one saw the change.
      expect(load).toHaveBeenCalledTimes(3);
      expect(wait).not.toHaveBeenCalled();
   });
   //-----
   it('goes to sleep when the value has not changed after the active wait', () => {
      const values = sharedValues();
      values[1] = 5;
      const load = vi.spyOn(Atomics, 'load');
      const wait = vi.spyOn(Atomics, 'wait').mockReturnValue('ok');
      //-----
      waitWhileEqual(values, 1, 5);

      // It checked as many times as allowed, then slept on that very value.
      expect(load).toHaveBeenCalledTimes(SPIN_ITERATIONS);
      expect(wait).toHaveBeenCalledExactlyOnceWith(values, 1, 5);
   });
});

// Builds a shared view of four zeroed values.
const sharedValues = (): Int32Array => new Int32Array(new SharedArrayBuffer(16));
