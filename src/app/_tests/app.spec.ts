/** @file Unit tests of the root component. */
import { TestBed } from '@angular/core/testing';
import { MemorySpec } from '../accessor/accessor';
import { App } from '../app';
import { appConfig } from '../app.config';
import { DEBUG_REFRESH_MS, ENTITY_COUNT, TICK_MS } from '../constants';
import { ViewModel } from '../displayer/displayer';
import { buildOrchestrator } from '../orchestrator/simulation';
import { SIMULATION_STARTER } from '../orchestrator/simulation-starter';
import { Renderer } from '../renderer/renderer';
import { RENDERER_FACTORY } from '../renderer/renderer-factory';
//-----
describe('App', () => {
   // Stands in for the Renderer: records the calls instead of drawing.
   const renderer = { draw: vi.fn(), resize: vi.fn(), dispose: vi.fn(), gpuName: 'Fake GPU' };
   const createRenderer = vi.fn(() => renderer as unknown as Renderer);

   // Stands in for the worker threads: runs the ticks on the test thread, on fake timers.
   const stopSimulation = vi.fn();
   const startSimulation = vi.fn((buffer: SharedArrayBuffer, spec: MemorySpec) => {
      const orchestrator = buildOrchestrator({ buffer, spec });
      const timer = setInterval(() => orchestrator.orchestrate(), TICK_MS);
      return stopSimulation.mockImplementation(() => clearInterval(timer));
   });

   // A machine with a single core makes the simulation run on a single thread.
   beforeEach(() => {
      vi.useFakeTimers();
      vi.clearAllMocks();
      vi.stubGlobal('navigator', { hardwareConcurrency: 1 });
      TestBed.configureTestingModule({
         providers: [
            ...appConfig.providers,
            { provide: RENDERER_FACTORY, useValue: createRenderer },
            { provide: SIMULATION_STARTER, useValue: startSimulation },
         ],
      });
   });
   //-----
   afterEach(() => {
      vi.useRealTimers();
      vi.unstubAllGlobals();
   });
   //-----
   it('starts the simulation on a shared memory sized for every entity', () => {
      started();

      // The memory is shared, and split into lots according to the machine.
      const [buffer, spec] = startSimulation.mock.lastCall ?? [];
      expect(buffer).toBeInstanceOf(SharedArrayBuffer);
      expect(spec).toMatchObject({ entityCount: ENTITY_COUNT, lotCount: 1 });
   });
   //-----
   it('builds a Renderer for every entity inside its own element', () => {
      const fixture = started();
      //-----
      expect(createRenderer).toHaveBeenCalledExactlyOnceWith(fixture.nativeElement, ENTITY_COUNT);
   });
   //-----
   it('draws the entities on every frame', () => {
      started();
      //-----
      vi.advanceTimersToNextFrame();
      vi.advanceTimersToNextFrame();

      // Each frame receives the positions of all the entities.
      expect(renderer.draw).toHaveBeenCalledTimes(2);
      expect(lastViewModel().positions).toHaveLength(ENTITY_COUNT * 2);
   });
   //-----
   it('displays the entities as the simulation moves them', () => {
      started();
      vi.advanceTimersToNextFrame();
      const before = Array.from(lastViewModel().positions);
      //-----
      vi.advanceTimersByTime(TICK_MS);
      vi.advanceTimersToNextFrame();

      // The simulation advanced between the two frames.
      expect(Array.from(lastViewModel().positions)).not.toEqual(before);
   });
   //-----
   it('shows the debugging figures on top of its element', () => {
      const fixture = started();
      //-----
      vi.advanceTimersByTime(DEBUG_REFRESH_MS * 2);

      // The overlay displays figures once a measuring window has elapsed.
      expect(fixture.nativeElement.querySelector('.debugger').textContent).toMatch(
         /^\d+ FPS · tick \d+\.\d\d ms\nFake GPU$/,
      );
   });
   //-----
   it('resizes the Renderer with the window', () => {
      started();
      //-----
      window.dispatchEvent(new Event('resize'));

      // The Renderer was asked to fit its host again.
      expect(renderer.resize).toHaveBeenCalledOnce();
   });
   //-----
   it('stops everything when destroyed', () => {
      const fixture = started();
      //-----
      fixture.destroy();
      vi.advanceTimersByTime(TICK_MS * 4);
      window.dispatchEvent(new Event('resize'));

      // Nothing runs anymore, and the simulation and the Renderer are released.
      expect(stopSimulation).toHaveBeenCalledOnce();
      expect(renderer.dispose).toHaveBeenCalledOnce();
      expect(renderer.draw).not.toHaveBeenCalled();
      expect(renderer.resize).not.toHaveBeenCalled();
      expect(fixture.nativeElement.querySelector('.debugger')).toBeNull();
   });

   // Creates the component and lets its first render happen.
   function started() {
      const fixture = TestBed.createComponent(App);
      TestBed.tick();
      return fixture;
   }
   //-----
   const lastViewModel = (): ViewModel => renderer.draw.mock.lastCall?.[0];
});
