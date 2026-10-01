/** @file Test double for the parts of three.js that need a real GPU. */
import * as THREE from 'three';

/**
 * Stands in for `THREE.WebGLRenderer` in unit tests, where no WebGL context exists.
 *
 * It records what it is asked to do instead of drawing.
 */
export class FakeWebGLRenderer {
   /** Canvas the real renderer would draw to. */
   readonly domElement = document.createElement('canvas');
   /** Every scene passed to `render`, in order. */
   readonly renders: THREE.Scene[] = [];
   /** Size last given to `setSize`, in CSS pixels. */
   readonly size = { width: 0, height: 0 };
   /** Whether `dispose` has been called. */
   disposed = false;
   /** Whether the fake browser agrees to reveal the real name of the graphics card. */
   revealsGpu = true;

   /**
    * Gives a minimal WebGL context, able to name the graphics card.
    *
    * @returns A context reporting `Fake GPU` as the real name and `Generic GPU` as the
    * generic one.
    */
   readonly getContext = () => ({
      RENDERER: 1,
      getExtension: () => (this.revealsGpu ? { UNMASKED_RENDERER_WEBGL: 2 } : null),
      getParameter: (name: number) => (name === 2 ? 'Fake GPU' : 'Generic GPU'),
   });

   /**
    * Accepts the device pixel ratio, which the fake has no use for.
    *
    * @param ratio - Physical pixels per CSS pixel.
    * @returns The ratio.
    */
   readonly setPixelRatio = (ratio: number): number => ratio;

   /**
    * Records the size of the canvas.
    *
    * @param width - Width, in CSS pixels.
    * @param height - Height, in CSS pixels.
    * @returns The recorded size.
    */
   readonly setSize = (width: number, height: number) =>
      Object.assign(this.size, { width, height });

   /**
    * Records a render.
    *
    * @param scene - Scene that would be drawn.
    * @returns The number of renders recorded so far.
    */
   readonly render = (scene: THREE.Scene): number => this.renders.push(scene);

   /**
    * Records that the renderer has been disposed.
    *
    * @returns `true`.
    */
   readonly dispose = (): boolean => (this.disposed = true);
}
