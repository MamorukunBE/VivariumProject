/** @file Unit tests of the Accessor. */
import { Accessor } from '../accessor';
//-----
describe('Accessor', () => {
   const spec = { entityCount: 10, cellCount: 25, lotCount: 3 };
   //-----
   it('allocates a zeroed memory that fits every view exactly', () => {
      const float64 = 20 + 20 + 1;
      const int32 = 4 + 10 + 10 + 10 + 26;
      //-----
      const buffer = Accessor.allocate(spec);

      // 8 bytes per float, 4 per integer, nothing more.
      expect(buffer.byteLength).toBe(float64 * 8 + int32 * 4);
      expect(new Uint8Array(buffer).every((byte) => byte === 0)).toBe(true);
   });
   //-----
   it('exposes views sized for the spec', () => {
      const accessor = new Accessor(Accessor.allocate(spec), spec);
      //-----
      expect(accessor.positions).toHaveLength(20);
      expect(accessor.velocities).toHaveLength(20);
      expect(accessor.locks).toHaveLength(10);
      expect(accessor.entityCell).toHaveLength(10);
      expect(accessor.cellEntities).toHaveLength(10);
      expect(accessor.cellStart).toHaveLength(26);
   });
   //-----
   it('keeps every view on its own part of the memory', () => {
      const accessor = new Accessor(Accessor.allocate(spec), spec);
      const views = [
         accessor.positions,
         accessor.velocities,
         accessor.stats,
         accessor.control,
         accessor.locks,
         accessor.entityCell,
         accessor.cellEntities,
         accessor.cellStart,
      ];
      //-----
      views.forEach((view, index) => view.fill(index + 1));

      // No view was overwritten by another one.
      views.forEach((view, index) => expect(view.every((value) => value === index + 1)).toBe(true));
   });
   //-----
   it('builds empty entity views for a simulation without any entity', () => {
      const empty = { entityCount: 0, cellCount: 25, lotCount: 1 };
      //-----
      const accessor = new Accessor(Accessor.allocate(empty), empty);

      // The views that do not depend on the entities are still there.
      expect(accessor.positions).toHaveLength(0);
      expect(accessor.locks).toHaveLength(0);
      expect(accessor.cellStart).toHaveLength(26);
      expect(accessor.control).toHaveLength(4);
   });
   //-----
   it('shares its data with every Accessor built on the same memory', () => {
      const buffer = Accessor.allocate(spec);
      const writer = new Accessor(buffer, spec);
      const reader = new Accessor(buffer, spec);
      //-----
      writer.positions[7] = 42;
      writer.control[2] = 9;

      // Both see the same bytes, with no copy.
      expect(reader.positions[7]).toBe(42);
      expect(reader.control[2]).toBe(9);
   });
});
