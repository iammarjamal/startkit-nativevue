/// <reference path="../node_modules/@nativescript/types/index.d.ts" />
/// <reference types="vite/client" />

// NativeScript Vite HMR types
declare module "@nativescript/vite/hmr/shared/runtime/hooks" {
  export interface HmrPayload {
    type: "full-graph" | "delta";
    version: number;
    changedIds: string[];
    raw: unknown;
  }

  export function onHmrUpdate(
    callback: (payload: HmrPayload) => void,
    id: string
  ): void;

  export function offHmrUpdate(id: string): void;
}

interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
  readonly hot?: {
    readonly data: Record<string, unknown>;
    accept(): void;
    accept(cb: (mod: unknown) => void): void;
    accept(deps: string[], cb: (mods: unknown[]) => void): void;
    dispose(cb: (data: Record<string, unknown>) => void): void;
    decline(): void;
    invalidate(): void;
    on(event: string, cb: (data: unknown) => void): void;
    send(event: string, data?: unknown): void;
  };
}
