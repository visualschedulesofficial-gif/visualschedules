// Minimal D1 binding surface used by API routes
// (avoids a dependency on @cloudflare/workers-types)
export interface D1 {
  prepare(query: string): {
    bind(...values: unknown[]): {
      run(): Promise<unknown>;
      first<T = unknown>(): Promise<T | null>;
    };
  };
}
