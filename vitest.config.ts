/** @file Vitest settings on top of the Angular test builder: 100% coverage is required. */
import { defineConfig } from 'vitest/config';

/** Fails the test run when any covered file drops below 100%. */
export default defineConfig({
   test: {
      coverage: {
         thresholds: { 100: true },
      },
   },
});
