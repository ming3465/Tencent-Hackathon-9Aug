/**
 * Vite serves `?raw` imports as strings. Declared here so tests can read the
 * shipped markup without pulling @types/node into a browser-only tsconfig.
 */
declare module "*?raw" {
  const content: string;
  export default content;
}
