import { artModuleRegistry } from './registry';
import { ACTIVE_ART_MODULE_ID } from '../../data/site';
import type { ArtModule } from './ArtModule';

const panel = document.querySelector<HTMLElement>('[data-art-panel]');
const canvas = panel?.querySelector<HTMLCanvasElement>('[data-art-canvas]');
const surface = panel?.querySelector<HTMLElement>('[data-art-surface]');

if (panel && canvas && surface) {
  // Below this width the panel shows a static CSS fallback (see ArtPanelMount.astro) —
  // don't even load/run the art module, there's nothing to animate into.
  const motionQuery = window.matchMedia('(min-width: 640px)');
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  let activeModule: ArtModule | null = null;
  let loading = false;

  async function mount() {
    if (activeModule || loading) return;
    loading = true;
    const loadModule = artModuleRegistry[ACTIVE_ART_MODULE_ID];
    if (!loadModule) {
      loading = false;
      return;
    }
    const mod = await loadModule();
    const rect = surface!.getBoundingClientRect();
    mod.init(canvas!, {
      width: rect.width,
      height: rect.height,
      reducedMotion: reducedMotionQuery.matches,
    });
    activeModule = mod;
    loading = false;
  }

  function unmount() {
    activeModule?.destroy();
    activeModule = null;
  }

  if (motionQuery.matches) {
    mount();
  }

  motionQuery.addEventListener('change', (event) => {
    if (event.matches) mount();
    else unmount();
  });

  const resizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (!entry || !activeModule) return;
    const { width, height } = entry.contentRect;
    activeModule.resize?.(width, height);
  });
  resizeObserver.observe(surface);

  window.addEventListener('pagehide', unmount);
}
