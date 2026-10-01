/** @file Unit tests of the Renderer. */
import * as THREE from 'three';
import { VIEW_MARGIN, WORLD_HALF_SIZE } from '../../constants';
import { ViewModel } from '../../displayer/displayer';
import { createRenderer, Renderer } from '../renderer';
import { FakeWebGLRenderer } from './three.fake';
//-----
describe('Renderer', () => {
   it('appends its canvas to the host and sizes it like the host', () => {
      const { host, webgl } = rendered(800, 600);
      //-----
      expect(host.firstChild).toBe(webgl.domElement);
      expect(webgl.size).toEqual({ width: 800, height: 600 });
   });
   //-----
   it('reports the real name of the graphics card when the browser reveals it', () =>
      expect(rendered(800, 600).renderer.gpuName).toBe('Fake GPU'));
   //-----
   it('reports the generic name of the graphics card otherwise', () =>
      expect(rendered(800, 600, false).renderer.gpuName).toBe('Generic GPU'));
   //-----
   it('keeps the whole world visible in a wide window', () => {
      const { renderer } = rendered(800, 400);
      const half = WORLD_HALF_SIZE * (1 + VIEW_MARGIN);
      //-----
      expect(camera(renderer).top).toBeCloseTo(half);
      expect(camera(renderer).right).toBeCloseTo(half * 2);
   });
   //-----
   it('keeps the whole world visible in a tall window', () => {
      const { renderer } = rendered(400, 800);
      const half = WORLD_HALF_SIZE * (1 + VIEW_MARGIN);
      //-----
      expect(camera(renderer).right).toBeCloseTo(half);
      expect(camera(renderer).top).toBeCloseTo(half * 2);
   });
   //-----
   it('follows the host when it is resized', () => {
      const { host, renderer, webgl } = rendered(400, 800);
      size(host, 800, 400);
      //-----
      renderer.resize();

      // The canvas and the camera now frame a wide view.
      expect(webgl.size).toEqual({ width: 800, height: 400 });
      expect(camera(renderer).right).toBeGreaterThan(camera(renderer).top);
   });
   //-----
   it('places every entity at its position, then renders the scene', () => {
      const { renderer, webgl } = rendered(800, 600);
      //-----
      renderer.draw(viewModel([3, 4, -5, 6]));

      // Each instance is translated to the position of its entity.
      const matrix = new THREE.Matrix4();
      entities(renderer).getMatrixAt(1, matrix);
      expect(new THREE.Vector3().setFromMatrixPosition(matrix)).toEqual(
         new THREE.Vector3(-5, 6, 0),
      );
      //-----
      expect(webgl.renders).toHaveLength(1);
   });
   //-----
   it('renders the scene even without any entity', () => {
      const webgl = new FakeWebGLRenderer();
      const renderer = new Renderer(
         document.createElement('div'),
         0,
         webgl as unknown as THREE.WebGLRenderer,
      );
      //-----
      renderer.draw({ count: 0, positions: new Float32Array(0), tickMs: 0 });

      // The world outline is still drawn.
      expect(webgl.renders).toHaveLength(1);
   });
   //-----
   it('releases everything when disposed', () => {
      const { host, renderer, webgl } = rendered(800, 600);
      //-----
      renderer.dispose();

      // The canvas is gone and the three.js renderer is disposed.
      expect(host.childElementCount).toBe(0);
      expect(webgl.disposed).toBe(true);
   });
});
//-----
describe('createRenderer', () => {
   afterEach(() => vi.restoreAllMocks());
   //-----
   it('fails when the browser cannot provide a WebGL context', () => {
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      //-----
      expect(() => createRenderer(document.createElement('div'), 1)).toThrow();
   });
});

// Builds a Renderer for two entities, drawing with a fake, inside a host of the given size.
function rendered(width: number, height: number, revealsGpu = true) {
   const host = document.createElement('div');
   size(host, width, height);
   const webgl = new FakeWebGLRenderer();
   webgl.revealsGpu = revealsGpu;
   const renderer = new Renderer(host, 2, webgl as unknown as THREE.WebGLRenderer);
   return { host, renderer, webgl };
}

// Gives an element a layout size, which jsdom never computes.
function size(element: HTMLElement, width: number, height: number): void {
   Object.defineProperty(element, 'clientWidth', { value: width, configurable: true });
   Object.defineProperty(element, 'clientHeight', { value: height, configurable: true });
}

// Builds the ViewModel of two entities.
const viewModel = (positions: number[]): ViewModel => ({
   count: 2,
   positions: new Float32Array(positions),
   tickMs: 0,
});

// Reach the private three.js objects of a Renderer.
const internals = (renderer: Renderer) =>
   renderer as unknown as { camera: THREE.OrthographicCamera; entities: THREE.InstancedMesh };
const camera = (renderer: Renderer) => internals(renderer).camera;
const entities = (renderer: Renderer) => internals(renderer).entities;
