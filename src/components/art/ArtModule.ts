export interface ArtModuleInitOptions {
  width: number;
  height: number;
  reducedMotion: boolean;
}

export interface ArtModule {
  id: string;
  label: string;
  init(canvas: HTMLCanvasElement, opts: ArtModuleInitOptions): void;
  resize?(width: number, height: number): void;
  destroy(): void;
}

export type ArtModuleFactory = () => ArtModule;
