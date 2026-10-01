/** @file Unit tests of the tick and of the assembly of the simulation. */
import { simulationMemoryWith } from '../../accessor/_tests/memory.fake';
import {
   Accessor,
   CONTROL_GENERATION,
   CONTROL_PENDING,
   CONTROL_STEP,
   CONTROL_TICK,
   STAT_TICK_MS,
} from '../../accessor/accessor';
import { Channel } from '../../channels/channel';
import { CHANNEL_CELL_SIZE, TICK_SECONDS, WORLD_HALF_SIZE } from '../../constants';
import { CalculusDispatcher } from '../../dispatcher/calculus-dispatcher';
import { STEP_ACT, STEP_ASSIGN_CELLS, STEP_DECIDE, STEP_MOVE } from '../../dispatcher/step-runner';
import { buildLotServer, buildOrchestrator } from '../simulation';
//-----
describe('Orchestrator', () => {
   afterEach(() => vi.restoreAllMocks());
   //-----
   it('moves the entities by one tick of simulated time', () => {
      const accessor = simulationMemoryWith([
         [0, 0],
         [20, 20],
      ]);
      accessor.velocities.set([4, -8], 2);
      //-----
      ticked(accessor);

      // The second entity advanced by its velocity during TICK_SECONDS.
      expect(accessor.positions[2]).toBeCloseTo(20 + 4 * TICK_SECONDS);
      expect(accessor.positions[3]).toBeCloseTo(20 - 8 * TICK_SECONDS);
   });
   //-----
   it('rebuilds the proximity channel for the new positions', () => {
      const accessor = simulationMemoryWith([
         [0, 0],
         [20, 20],
      ]);
      const near: number[] = [];
      //-----
      ticked(accessor);
      new Channel(accessor, WORLD_HALF_SIZE, CHANNEL_CELL_SIZE).forEachNear(20, 20, (id) =>
         near.push(id),
      );

      // Only the second entity is around its own position.
      expect(near).toEqual([1]);
   });
   //-----
   it('dispatches the four steps of the tick, in order', () => {
      const accessor = simulationMemoryWith([[0, 0]]);
      const dispatch = vi.spyOn(CalculusDispatcher.prototype, 'dispatch');
      //-----
      ticked(accessor);

      // Movement, channels, decision, action.
      expect(dispatch.mock.calls.flat()).toEqual([
         STEP_MOVE,
         STEP_ASSIGN_CELLS,
         STEP_DECIDE,
         STEP_ACT,
      ]);
   });
   //-----
   it('runs a tick of a simulation without any entity', () => {
      const accessor = simulationMemoryWith([]);
      //-----
      ticked(accessor);

      // The tick completed: the counter is even again.
      expect(accessor.control[CONTROL_TICK]).toBe(2);
   });
   //-----
   it('keeps the tick counter odd while the tick is running, and even afterwards', () => {
      const accessor = simulationMemoryWith([[0, 0]]);
      let duringTick = 0;
      const observe = () => void (duringTick = accessor.control[CONTROL_TICK]);
      vi.spyOn(Channel.prototype, 'build').mockImplementation(observe);
      //-----
      ticked(accessor);
      ticked(accessor);

      // Two complete ticks: the counter went 1, 2, 3, 4.
      expect(duringTick).toBe(3);
      expect(accessor.control[CONTROL_TICK]).toBe(4);
   });
   //-----
   it('publishes how long the tick took', () => {
      const accessor = simulationMemoryWith([[0, 0]]);
      vi.spyOn(performance, 'now').mockReturnValueOnce(100).mockReturnValueOnce(103.5);
      //-----
      ticked(accessor);

      // The duration is the time between the start and the end of the tick.
      expect(accessor.stats[STAT_TICK_MS]).toBe(3.5);
   });
});
//-----
describe('buildLotServer', () => {
   it('serves the dispatched steps for its lot, on the shared memory', () => {
      const accessor = simulationMemoryWith(
         [
            [0, 0],
            [0, 0],
         ],
         2,
      );
      accessor.velocities.fill(4);
      accessor.control[CONTROL_STEP] = STEP_MOVE;
      accessor.control[CONTROL_GENERATION] = 1;
      accessor.control[CONTROL_PENDING] = 2;
      //-----
      const serve = buildLotServer({ buffer: accessor.buffer, spec: accessor.spec }, 1);

      // Only the entity of the second lot moved, and the lot reported.
      expect(serve(0)).toBe(1);
      expect(Array.from(accessor.positions.subarray(0, 2))).toEqual([0, 0]);
      expect(accessor.positions[2]).toBeCloseTo(4 * TICK_SECONDS);
      expect(accessor.control[CONTROL_PENDING]).toBe(1);
   });
});

// Runs one tick of a single-thread simulation over the given memory.
const ticked = (accessor: Accessor): void =>
   buildOrchestrator({ buffer: accessor.buffer, spec: accessor.spec }).orchestrate();
