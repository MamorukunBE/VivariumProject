/** @file Debugging aids displayed on top of the simulation. */
import { Injectable } from '@angular/core';
import { DEBUG_REFRESH_MS } from '../../constants';

/**
 * Displays debugging figures on top of the canvas, in the top-left corner.
 *
 * It shows the number of frames drawn per second, the duration of a simulation tick, and
 * the name of the graphics card in use. The frame rate is bounded by the refresh rate of
 * the screen, whatever the machine; the tick duration is what tells how fast the simulation
 * itself runs. Figures are refreshed every `DEBUG_REFRESH_MS` so that they stay readable.
 *
 * A web page cannot read the temperature or the load of a graphics card: only its name.
 *
 * @example
 * debug.attach(hostElement, performance.now(), renderer.gpuName);
 * requestAnimationFrame((now) => debug.frame(now, viewModel.tickMs));
 */
@Injectable({ providedIn: 'root' })
export class DebuggerService {
   private readonly overlay = document.createElement('div');
   private gpuName = '';
   private frames = 0;
   private windowStart = 0;

   /**
    * Shows the overlay in the top-left corner of an element and starts measuring.
    *
    * @param host - Element that receives the overlay. It must be a positioned element, as
    * the overlay is placed relative to it.
    * @param nowMs - Current time, in milliseconds.
    * @param gpuName - Name of the graphics card in use. It is displayed at once.
    */
   attach(host: HTMLElement, nowMs: number, gpuName: string): void {
      this.overlay.className = 'debugger';
      this.overlay.textContent = gpuName;
      host.appendChild(this.overlay);
      //-----
      this.gpuName = gpuName;
      this.frames = 0;
      this.windowStart = nowMs;
   }

   /**
    * Counts a drawn frame. To be called once per frame.
    *
    * @param nowMs - Time of the frame, in milliseconds, on the same clock as the one given to
    * {@link DebuggerService.attach}.
    * @param tickMs - Duration of the last simulation tick, in milliseconds.
    */
   frame(nowMs: number, tickMs: number): void {
      this.frames++;
      const elapsed = nowMs - this.windowStart;
      if (elapsed < DEBUG_REFRESH_MS) return;

      // Publish the average of the window that just ended, then start a new one.
      const fps = Math.round((this.frames * 1000) / elapsed);
      this.overlay.textContent = `${fps} FPS · tick ${tickMs.toFixed(2)} ms\n${this.gpuName}`;
      this.frames = 0;
      this.windowStart = nowMs;
   }

   /** Removes the overlay from the page. */
   readonly detach = (): void => this.overlay.remove();
}
