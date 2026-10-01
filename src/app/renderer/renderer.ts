/** @file The three.js side of the application: draws what the Displayer provides. */
import * as THREE from 'three';
import {
   BACKGROUND_COLOR,
   ENTITY_COLOR,
   ENTITY_RADIUS,
   GPU_POWER_PREFERENCE,
   VIEW_MARGIN,
   WORLD_EDGE_COLOR,
   WORLD_HALF_SIZE,
} from '../constants';
import { ViewModel } from '../displayer/displayer';

/**
 * Draws a ViewModel with three.js, seen from above.
 *
 * It is the only part of the application that knows three.js, and it knows nothing about
 * entities: it only receives positions.
 *
 * @example
 * const renderer = createRenderer(hostElement, viewModel.count);
 * renderer.draw(displayer.read());
 */
export class Renderer {
   /**
    * Name of the graphics card that draws, as reported by the browser.
    *
    * Browsers may hide the real name, and then report a generic one instead.
    */
   readonly gpuName: string;
   //-----
   private readonly scene = new THREE.Scene();
   private readonly camera = new THREE.OrthographicCamera();
   private readonly entities: THREE.InstancedMesh;
   private readonly matrix = new THREE.Matrix4();

   /**
    * Builds the scene and appends its canvas to the host element.
    *
    * @param host - Element that receives the canvas. The canvas takes its size.
    * @param count - Number of entities to draw. It cannot change afterwards.
    * @param renderer - three.js renderer to draw with. Use {@link createRenderer} unless a
    * specific renderer is needed, in tests for instance.
    */
   constructor(
      private readonly host: HTMLElement,
      count: number,
      private readonly renderer: THREE.WebGLRenderer,
   ) {
      this.renderer.setPixelRatio(window.devicePixelRatio);
      host.appendChild(this.renderer.domElement);

      // Ask for the real name of the graphics card; fall back to the generic one.
      const gl = this.renderer.getContext();
      const info = gl.getExtension('WEBGL_debug_renderer_info');
      this.gpuName = gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER);

      // Scene and camera.
      this.scene.background = new THREE.Color(BACKGROUND_COLOR);
      this.camera.position.set(0, 0, 10);

      // World outline.
      const s = WORLD_HALF_SIZE;
      const worldEdges = new THREE.LineLoop(
         new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-s, -s, 0),
            new THREE.Vector3(s, -s, 0),
            new THREE.Vector3(s, s, 0),
            new THREE.Vector3(-s, s, 0),
         ]),
         new THREE.LineBasicMaterial({ color: WORLD_EDGE_COLOR }),
      );
      this.scene.add(worldEdges);

      // All entities are drawn in a single instanced call.
      this.entities = new THREE.InstancedMesh(
         new THREE.CircleGeometry(ENTITY_RADIUS, 24),
         new THREE.MeshBasicMaterial({ color: ENTITY_COLOR }),
         count,
      );
      this.scene.add(this.entities);

      // Initial sizing.
      this.resize();
   }

   /**
    * Fits the canvas and the camera to the current size of the host element.
    *
    * To be called whenever the host is resized. The whole world stays visible.
    */
   resize(): void {
      const { clientWidth, clientHeight } = this.host;
      this.renderer.setSize(clientWidth, clientHeight);

      // The whole world stays visible, whatever the window shape.
      const aspect = clientWidth / Math.max(clientHeight, 1);
      const half = WORLD_HALF_SIZE * (1 + VIEW_MARGIN);
      const halfWidth = aspect >= 1 ? half * aspect : half;
      const halfHeight = aspect >= 1 ? half : half / aspect;
      this.camera.left = -halfWidth;
      this.camera.right = halfWidth;
      this.camera.top = halfHeight;
      this.camera.bottom = -halfHeight;
      this.camera.updateProjectionMatrix();
   }

   /**
    * Draws one frame.
    *
    * @param viewModel - Positions to draw.
    */
   draw(viewModel: ViewModel): void {
      const { positions } = viewModel;
      for (let i = 0; i < viewModel.count; i++) {
         this.matrix.makeTranslation(positions[i * 2], positions[i * 2 + 1], 0);
         this.entities.setMatrixAt(i, this.matrix);
      }
      this.entities.instanceMatrix.needsUpdate = true;
      this.renderer.render(this.scene, this.camera);
   }

   /** Releases the GPU resources and removes the canvas. The Renderer is unusable afterwards. */
   dispose(): void {
      this.entities.geometry.dispose();
      (this.entities.material as THREE.Material).dispose();
      this.renderer.dispose();
      this.renderer.domElement.remove();
   }
}

/**
 * Creates a Renderer that draws with WebGL, on the graphics card `GPU_POWER_PREFERENCE`
 * asks for.
 *
 * @param host - Element that receives the canvas. The canvas takes its size.
 * @param count - Number of entities to draw.
 * @returns The Renderer, already sized to the host.
 * @throws If the browser cannot provide a WebGL context.
 */
export const createRenderer = (host: HTMLElement, count: number): Renderer =>
   new Renderer(
      host,
      count,
      new THREE.WebGLRenderer({ antialias: true, powerPreference: GPU_POWER_PREFERENCE }),
   );
