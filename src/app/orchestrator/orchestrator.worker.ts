/** @file Worker thread that runs the ticks: it hosts the Orchestrator. */
import { TICK_MS } from '../constants';
import { buildOrchestrator, SimulationStart } from './simulation';

// The simulation starts when the main thread sends the shared memory.
addEventListener('message', ({ data }: MessageEvent<SimulationStart>) => {
   const orchestrator = buildOrchestrator(data);
   setInterval(() => orchestrator.orchestrate(), TICK_MS);
});
