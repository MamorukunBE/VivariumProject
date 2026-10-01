/** @file Unit tests of the step runner. */
import { simulationMemoryWith } from '../../accessor/_tests/memory.fake';
import { Channel } from '../../channels/channel';
import { CHANNEL_CELL_SIZE, TICK_SECONDS, WORLD_HALF_SIZE } from '../../constants';
import {
   createStepRunner,
   STEP_ACT,
   STEP_ASSIGN_CELLS,
   STEP_DECIDE,
   STEP_MOVE,
} from '../step-runner';
//-----
describe('createStepRunner', () => {
   it('moves the entities of the lot, and only them', () => {
      const { accessor, runStep } = runner(2, [0, 0], [0, 0], [0, 0], [0, 0]);
      accessor.velocities.fill(4);
      //-----
      runStep(STEP_MOVE, 1);

      // The second lot holds the last two entities.
      expect(Array.from(accessor.positions.subarray(0, 4))).toEqual([0, 0, 0, 0]);
      expect(accessor.positions[4]).toBeCloseTo(4 * TICK_SECONDS);
      expect(accessor.positions[7]).toBeCloseTo(4 * TICK_SECONDS);
   });
   //-----
   it('assigns their channel cell to the entities of the lot', () => {
      const { accessor, runStep } = runner(1, [0, 0], [10, 10]);
      //-----
      runStep(STEP_ASSIGN_CELLS, 0);

      // The two entities are far apart, hence in different cells.
      expect(accessor.entityCell[0]).not.toBe(accessor.entityCell[1]);
   });
   //-----
   it('changes nothing during the decision and action steps, which have no rule yet', () => {
      const { accessor, runStep } = runner(1, [1, 2], [3, 4]);
      accessor.velocities.fill(4);
      const before = new Uint8Array(accessor.buffer.slice(0));
      //-----
      runStep(STEP_DECIDE, 0);
      runStep(STEP_ACT, 0);

      // The whole memory is exactly as it was.
      expect(new Uint8Array(accessor.buffer.slice(0))).toEqual(before);
   });
   //-----
   it('runs every step of a simulation without any entity', () => {
      const { accessor, runStep } = runner(1);
      const before = new Uint8Array(accessor.buffer.slice(0));
      //-----
      for (const step of [STEP_MOVE, STEP_ASSIGN_CELLS, STEP_DECIDE, STEP_ACT]) runStep(step, 0);

      // There was nothing to work on.
      expect(new Uint8Array(accessor.buffer.slice(0))).toEqual(before);
   });
});

// Builds a step runner over a memory sized like the real simulation.
function runner(lotCount: number, ...positions: [number, number][]) {
   const accessor = simulationMemoryWith(positions, lotCount);
   const channel = new Channel(accessor, WORLD_HALF_SIZE, CHANNEL_CELL_SIZE);
   return { accessor, runStep: createStepRunner(accessor, channel) };
}
