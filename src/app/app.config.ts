/** @file Angular application configuration. */
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';

/** Angular providers of the application. Zoneless by default; no router, no HTTP client. */
export const appConfig: ApplicationConfig = {
   providers: [provideBrowserGlobalErrorListeners()],
};
