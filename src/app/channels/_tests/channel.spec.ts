/** @file Unit tests of the proximity channel. */
import {
   memoryWith,
   TEST_CELL_SIZE,
   TEST_WORLD_HALF_SIZE,
} from '../../accessor/_tests/memory.fake';
import { Accessor } from '../../accessor/accessor';
import { cellCountFor, Channel } from '../channel';
//-----
describe('cellCountFor', () => {
   it('covers the whole world, rounding the last cell up', () => {
      expect(cellCountFor(10, 2)).toBe(100);
      expect(cellCountFor(10, 3)).toBe(49);
   });
});
//-----
describe('Channel', () => {
   it('lists no entity before the first build', () => {
      const { channel } = channelOf([0, 0], [1, 1]);
      //-----
      expect(near(channel, 0, 0)).toEqual([]);
   });
   //-----
   it('lists no entity when there is none', () => {
      const { channel } = built();
      //-----
      expect(near(channel, 0, 0)).toEqual([]);
   });
   //-----
   it('finds the entities of the cell and of the 8 cells around it', () => {
      const { channel } = built([0, 0], [1.9, 1.9], [-1.9, 0], [3.9, 0], [4.1, 0]);

      // 4.1 is two cells away from the cell of 0, everything else is at most one cell away.
      expect(near(channel, 0, 0)).toEqual([0, 1, 2, 3]);
   });
   //-----
   it('follows the entities when they move', () => {
      const { accessor, channel } = built([0, 0], [8, 8]);
      //-----
      accessor.positions.set([0.5, 0.5], 2);
      channel.assignCells(0, 2);
      channel.build();

      // The entity that moved is now found next to the other one, and no longer where it was.
      expect(near(channel, 0, 0)).toEqual([0, 1]);
      expect(near(channel, 8, 8)).toEqual([]);
   });
   //-----
   it('lists an entity outside the world in the closest cell on the edge', () => {
      const { channel } = built([-50, 50], [50, -50]);

      // Queries on the corners, even from outside the world, reach the corner cells.
      expect(near(channel, -9.5, 9.5)).toEqual([0]);
      expect(near(channel, 99, -99)).toEqual([1]);
   });
   //-----
   it('assigns cells to the entities of the given range only', () => {
      const { accessor, channel } = channelOf([9, 9], [9, 9], [9, 9]);
      //-----
      channel.assignCells(1, 2);

      // Entities outside the range keep the cell they had.
      expect(Array.from(accessor.entityCell)).toEqual([0, 99, 0]);
   });
   //-----
   it('shares its lists with every channel built on the same memory', () => {
      const { accessor } = built([0, 0], [1, 1]);
      const other = new Accessor(accessor.buffer, accessor.spec);
      //-----
      expect(near(new Channel(other, TEST_WORLD_HALF_SIZE, TEST_CELL_SIZE), 0, 0)).toEqual([0, 1]);
   });
});

// Builds a channel over a memory holding one entity per given position.
function channelOf(...positions: [number, number][]) {
   const accessor = memoryWith(positions);
   return { accessor, channel: new Channel(accessor, TEST_WORLD_HALF_SIZE, TEST_CELL_SIZE) };
}

// Same, with the cell lists already built.
function built(...positions: [number, number][]) {
   const { accessor, channel } = channelOf(...positions);
   channel.assignCells(0, positions.length);
   channel.build();
   return { accessor, channel };
}

// Collects, sorted, the ids the channel visits around a position.
function near(channel: Channel, x: number, y: number): number[] {
   const ids: number[] = [];
   channel.forEachNear(x, y, (id) => ids.push(id));
   return ids.sort((a, b) => a - b);
}
