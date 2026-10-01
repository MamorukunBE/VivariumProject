/** @file Unit tests of the entity locks. */
import { LOCK_WAIT_MS } from '../../constants';
import { lockEntity, unlockEntity } from '../entity-lock';
//-----
describe('entity locks', () => {
   afterEach(() => vi.restoreAllMocks());
   //-----
   it('takes a free lock at once, without waiting', () => {
      const locks = sharedLocks();
      const wait = vi.spyOn(Atomics, 'wait');
      //-----
      lockEntity(locks, 2);

      // Only the requested entity is locked.
      expect(Array.from(locks)).toEqual([0, 0, 1, 0]);
      expect(wait).not.toHaveBeenCalled();
   });
   //-----
   it('releases a lock', () => {
      const locks = sharedLocks();
      lockEntity(locks, 2);
      //-----
      expect(unlockEntity(locks, 2)).toBe(0);
      expect(locks[2]).toBe(0);
   });
   //-----
   it('waits for a lock held by another thread, then takes it', () => {
      const locks = sharedLocks();
      locks[1] = 1;

      // The other thread releases the lock while this one sleeps.
      const wait = vi.spyOn(Atomics, 'wait').mockImplementation(() => {
         locks[1] = 0;
         return 'timed-out';
      });
      //-----
      lockEntity(locks, 1);

      // It slept once, for a bounded time, and now holds the lock.
      expect(wait).toHaveBeenCalledExactlyOnceWith(locks, 1, 1, LOCK_WAIT_MS);
      expect(locks[1]).toBe(1);
   });
});

// Builds the lock view of four entities.
const sharedLocks = (): Int32Array => new Int32Array(new SharedArrayBuffer(16));
