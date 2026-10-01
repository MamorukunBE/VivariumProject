/** @file Unit tests of the Renderer injection point. */
import { TestBed } from '@angular/core/testing';
import { createRenderer } from '../renderer';
import { RENDERER_FACTORY } from '../renderer-factory';
//-----
describe('RENDERER_FACTORY', () => {
   it('builds a WebGL Renderer by default', () =>
      expect(TestBed.inject(RENDERER_FACTORY)).toBe(createRenderer));
});
