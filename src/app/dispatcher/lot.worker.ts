/** @file Worker thread in charge of one lot of entities: it runs each dispatched step for it. */
import { buildLotServer, SimulationStart } from '../orchestrator/simulation';

// The worker serves its lot forever, from the moment the main thread sends the shared memory.
addEventListener('message', ({ data }: MessageEvent<SimulationStart>) => {
   const serve = buildLotServer(data, data.lot ?? 0);
   let seen = 0;
   for (;;) seen = serve(seen);
});
