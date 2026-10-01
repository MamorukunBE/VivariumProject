/** @file Proximity channel: finds the entities near a position without scanning them all. */
import { Accessor } from '../accessor/accessor';

/**
 * Computes how many cells a channel needs to cover a square world.
 *
 * @param worldHalfSize - Half side of the square world, in world units.
 * @param cellSize - Side of a cell, in world units.
 * @returns The number of cells, to be used as `cellCount` in the memory spec.
 */
export const cellCountFor = (worldHalfSize: number, cellSize: number): number =>
   Math.ceil((worldHalfSize * 2) / cellSize) ** 2;

/**
 * Splits a square world into cells and lists, per cell, the entities inside it.
 *
 * The lists live in the shared memory, so every thread sees them. They are rebuilt on every
 * tick in two stages: {@link Channel.assignCells}, which lot workers run in parallel, then
 * {@link Channel.build}, which a single thread runs once all the cells are assigned. The
 * lists are only valid until entities move again.
 *
 * @example
 * const channel = new Channel(accessor, 50, 1);
 * channel.assignCells(0, accessor.spec.entityCount);
 * channel.build();
 * channel.forEachNear(0, 0, (id) => console.log(id));
 */
export class Channel {
   private readonly cellsPerAxis: number;

   /**
    * @param accessor - Shared memory holding the positions and the cell lists. Its spec
    * must have been sized with {@link cellCountFor} for the same world and cell size.
    * @param worldHalfSize - Half side of the square world, in world units.
    * @param cellSize - Side of a cell, in world units. Two entities closer than this are
    * always in the same cell or in neighbouring cells.
    */
   constructor(
      private readonly accessor: Accessor,
      private readonly worldHalfSize: number,
      private readonly cellSize: number,
   ) {
      this.cellsPerAxis = Math.sqrt(accessor.spec.cellCount);
   }

   /**
    * Computes the cell of each entity of a range, from its current position.
    *
    * It only writes to the entities of the range, so several threads can run it at once on
    * distinct ranges. An entity outside the world gets the closest cell on the edge.
    *
    * @param start - Id of the first entity of the range.
    * @param end - Id following the last entity of the range.
    */
   assignCells(start: number, end: number): void {
      const { positions, entityCell } = this.accessor;
      for (let id = start; id < end; id++) {
         const ix = this.axisCell(positions[id * 2]);
         entityCell[id] = ix * this.cellsPerAxis + this.axisCell(positions[id * 2 + 1]);
      }
   }

   /**
    * Rebuilds the cell lists from the cells assigned by {@link Channel.assignCells}.
    *
    * To be run by a single thread, once every entity has been assigned its cell.
    */
   build(): void {
      const { cellStart, cellEntities, entityCell, spec } = this.accessor;
      cellStart.fill(0);

      // Count the entities of each cell, then turn the counts into the end of each cell.
      for (let id = 0; id < spec.entityCount; id++) cellStart[entityCell[id]]++;
      for (let cell = 1; cell <= spec.cellCount; cell++) cellStart[cell] += cellStart[cell - 1];

      // Fill each cell from its end: every entry finishes at the start of its cell.
      for (let id = 0; id < spec.entityCount; id++) cellEntities[--cellStart[entityCell[id]]] = id;
   }

   /**
    * Visits every entity listed in the cell of a position and in the 8 cells around it.
    *
    * The visited entities are candidates only: some are farther than `cellSize` from the
    * position, so the caller still has to check the exact distance.
    *
    * @param x - X coordinate of the position, in world units.
    * @param y - Y coordinate of the position, in world units.
    * @param visit - Called once per candidate, with the id of the entity.
    */
   forEachNear(x: number, y: number, visit: (id: number) => void): void {
      const { cellStart, cellEntities } = this.accessor;
      const cx = this.axisCell(x);
      const cy = this.axisCell(y);
      const max = this.cellsPerAxis - 1;
      //-----
      for (let ix = Math.max(cx - 1, 0); ix <= Math.min(cx + 1, max); ix++) {
         for (let iy = Math.max(cy - 1, 0); iy <= Math.min(cy + 1, max); iy++) {
            const cell = ix * this.cellsPerAxis + iy;
            const end = cellStart[cell + 1];
            for (let k = cellStart[cell]; k < end; k++) visit(cellEntities[k]);
         }
      }
   }

   // Cell coordinate of a position along one axis, clamped to the world.
   private axisCell(value: number): number {
      const cell = Math.floor((value + this.worldHalfSize) / this.cellSize);
      return Math.min(Math.max(cell, 0), this.cellsPerAxis - 1);
   }
}
