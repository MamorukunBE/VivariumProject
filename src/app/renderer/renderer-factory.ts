/** @file Injection point that lets the application, or a test, choose how the Renderer is built. */
import { InjectionToken } from '@angular/core';
import { createRenderer, Renderer } from './renderer';

/**
 * Builds the Renderer of the application.
 *
 * @param host - Element that receives the canvas.
 * @param count - Number of entities to draw.
 * @returns The Renderer.
 */
export type RendererFactory = (host: HTMLElement, count: number) => Renderer;

/** Factory used to build the Renderer. Defaults to WebGL; tests provide a fake instead. */
export const RENDERER_FACTORY = new InjectionToken<RendererFactory>('RENDERER_FACTORY', {
   factory: () => createRenderer,
});
