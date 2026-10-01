/** @file Unit tests of the start and stop of the worker threads. */
import { TestBed } from '@angular/core/testing';
import { memoryWith } from '../../accessor/_tests/memory.fake';
import { SIMULATION_STARTER, startSimulation } from '../simulation-starter';
//-----
describe('startSimulation', () => {
   it('starts only the Orchestrator worker for a single-thread simulation', () => {
      const { buffer, spec } = memoryWith([[0, 0]]);
      const workers = fakeWorkers();
      //-----
      startSimulation(buffer, spec, workers.factory);

      // The Orchestrator worker received the memory; no lot worker was created.
      expect(workers.lots).toHaveLength(0);
      expect(workers.orchestrators).toHaveLength(1);
      expect(workers.orchestrators[0].postMessage).toHaveBeenCalledExactlyOnceWith({
         buffer,
         spec,
      });
   });
   //-----
   it('starts one worker per lot, each in charge of its own lot', () => {
      const { buffer, spec } = memoryWith(
         [
            [0, 0],
            [1, 1],
            [2, 2],
         ],
         3,
      );
      const workers = fakeWorkers();
      //-----
      startSimulation(buffer, spec, workers.factory);

      // Three lot workers, numbered from 0, plus the Orchestrator worker.
      expect(workers.lots.map((lot) => lot.postMessage.mock.calls[0][0])).toEqual([
         { buffer, spec, lot: 0 },
         { buffer, spec, lot: 1 },
         { buffer, spec, lot: 2 },
      ]);
      expect(workers.orchestrators).toHaveLength(1);
   });
   //-----
   it('terminates every worker when stopped', () => {
      const { buffer, spec } = memoryWith(
         [
            [0, 0],
            [1, 1],
         ],
         2,
      );
      const workers = fakeWorkers();
      //-----
      startSimulation(buffer, spec, workers.factory)();

      // Lot workers and Orchestrator worker alike.
      for (const worker of [...workers.lots, ...workers.orchestrators])
         expect(worker.terminate).toHaveBeenCalledOnce();
   });
});
//-----
describe('SIMULATION_STARTER', () => {
   it('starts real worker threads by default, which only a browser can provide', () => {
      const { buffer, spec } = memoryWith([[0, 0]]);
      //-----
      expect(() => TestBed.inject(SIMULATION_STARTER)(buffer, spec)).toThrow();
   });
});

// Builds a worker factory that records the workers it creates instead of starting threads.
function fakeWorkers() {
   const created = () => ({ postMessage: vi.fn(), terminate: vi.fn() });
   const orchestrators: ReturnType<typeof created>[] = [];
   const lots: ReturnType<typeof created>[] = [];
   const record = (list: ReturnType<typeof created>[]) => () => {
      list.push(created());
      return list[list.length - 1] as unknown as Worker;
   };
   return {
      orchestrators,
      lots,
      factory: { orchestrator: record(orchestrators), lot: record(lots) },
   };
}
