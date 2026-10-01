/** @file Root component: starts the simulation and its display. */
import { afterNextRender, Component, DestroyRef, ElementRef, inject } from '@angular/core';
import { Accessor, MemorySpec } from './accessor/accessor';
import { cellCountFor } from './channels/channel';
import { configureInitialState } from './configurers/initial-state.configurer';
import { CHANNEL_CELL_SIZE, ENTITY_COUNT, WORLD_HALF_SIZE } from './constants';
import { chooseLotCount } from './dispatcher/lots';
import { Displayer } from './displayer/displayer';
import { SIMULATION_STARTER } from './orchestrator/simulation-starter';
import { RENDERER_FACTORY } from './renderer/renderer-factory';
import { DebuggerService } from './services/debugger/debugger.service';

/**
 * Root component: its element hosts the canvas, and it wires the simulation to the display.
 *
 * It allocates the shared memory, has the worker threads started on it, and keeps the main
 * thread for the display only: on every frame, the Displayer reads the memory and the
 * Renderer draws. Everything stops when the component is destroyed.
 */
@Component({
   selector: 'app-root',
   template: '',
})
export class App {
   /** Schedules the start of the simulation and of the display for the first render. */
   constructor() {
      const host: HTMLElement = inject(ElementRef).nativeElement;
      const destroyRef = inject(DestroyRef);
      const startSimulation = inject(SIMULATION_STARTER);
      const createRenderer = inject(RENDERER_FACTORY);
      const debug = inject(DebuggerService);

      // The simulation starts as soon as the page is rendered.
      afterNextRender(() => {
         const spec: MemorySpec = {
            entityCount: ENTITY_COUNT,
            cellCount: cellCountFor(WORLD_HALF_SIZE, CHANNEL_CELL_SIZE),
            lotCount: chooseLotCount(ENTITY_COUNT, navigator.hardwareConcurrency),
         };
         const accessor = new Accessor(Accessor.allocate(spec), spec);
         configureInitialState(accessor);
         const stopSimulation = startSimulation(accessor.buffer, spec);

         // The main thread only displays: it never runs a tick.
         const displayer = new Displayer(accessor);
         const renderer = createRenderer(host, ENTITY_COUNT);
         debug.attach(host, performance.now(), renderer.gpuName);
         let frame = requestAnimationFrame(function draw(now) {
            const viewModel = displayer.read();
            renderer.draw(viewModel);
            debug.frame(now, viewModel.tickMs);
            frame = requestAnimationFrame(draw);
         });
         const onResize = () => renderer.resize();
         window.addEventListener('resize', onResize);

         // Stop everything when the component is destroyed.
         destroyRef.onDestroy(() => {
            stopSimulation();
            cancelAnimationFrame(frame);
            window.removeEventListener('resize', onResize);
            renderer.dispose();
            debug.detach();
         });
      });
   }
}
