/** @file Unit tests of the DebuggerService. */
import { TestBed } from '@angular/core/testing';
import { DEBUG_REFRESH_MS } from '../../../constants';
import { DebuggerService } from '../debugger.service';
//-----
describe('DebuggerService', () => {
   it('adds an overlay naming the graphics card to the host', () => {
      const { host } = attached();
      //-----
      expect(host.querySelector('.debugger')?.textContent).toBe('Test GPU');
   });
   //-----
   it('shows no figure until a full measuring window has elapsed', () => {
      const { debug, host } = attached();
      //-----
      debug.frame(DEBUG_REFRESH_MS - 1, 0);

      // Not enough time to compute a meaningful average.
      expect(host.textContent).toBe('Test GPU');
   });
   //-----
   it('shows the average frame rate over the window and the last tick duration', () => {
      const { debug, host } = attached();
      //-----
      for (let i = 1; i <= 30; i++) debug.frame((DEBUG_REFRESH_MS / 30) * i, 1.234);

      // 30 frames over the window; the tick duration is rounded to two decimals.
      expect(host.textContent).toBe(
         `${Math.round(30000 / DEBUG_REFRESH_MS)} FPS · tick 1.23 ms\nTest GPU`,
      );
   });
   //-----
   it('starts a new window after each refresh', () => {
      const { debug, host } = attached();
      debug.frame(DEBUG_REFRESH_MS, 0);
      //-----
      debug.frame(DEBUG_REFRESH_MS * 1.5, 0);
      debug.frame(DEBUG_REFRESH_MS * 2, 0);

      // Only the 2 frames of the second window are counted.
      expect(host.textContent).toBe(
         `${Math.round(2000 / DEBUG_REFRESH_MS)} FPS · tick 0.00 ms\nTest GPU`,
      );
   });
   //-----
   it('measures from the time it is attached', () => {
      const { debug, host } = attached(10_000);
      //-----
      debug.frame(10_000 + DEBUG_REFRESH_MS, 0);

      // 1 frame over one window, not over the 10 seconds before.
      expect(host.textContent).toBe(
         `${Math.round(1000 / DEBUG_REFRESH_MS)} FPS · tick 0.00 ms\nTest GPU`,
      );
   });
   //-----
   it('removes its overlay when detached', () => {
      const { debug, host } = attached();
      //-----
      debug.detach();

      // The host is back to how it was.
      expect(host.childElementCount).toBe(0);
   });
});

// Attaches the service to a fresh host element.
function attached(nowMs = 0) {
   const debug = TestBed.inject(DebuggerService);
   const host = document.createElement('div');
   debug.attach(host, nowMs, 'Test GPU');
   return { debug, host };
}
