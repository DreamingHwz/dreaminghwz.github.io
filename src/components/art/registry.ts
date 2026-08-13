import type { ArtModule } from './ArtModule';

type ArtModuleLoader = () => Promise<ArtModule>;

// Add a new art piece by adding one entry here — each is loaded lazily via
// dynamic import() so a future inactive module is never shipped to the client.
// Flip ACTIVE_ART_MODULE_ID in src/data/site.ts to switch which one renders.
export const artModuleRegistry: Record<string, ArtModuleLoader> = {
  'organic-tessellation': async () => {
    const { createOrganicTessellationModule } = await import('./modules/organicTessellation');
    return createOrganicTessellationModule();
  },
};
