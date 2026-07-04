// @firebase/auth's public type surface (auth-public.d.ts) omits the React Native
// persistence helper even though it is a real runtime export resolved via the
// package's "react-native" conditional export. This augmentation restores the
// type so TypeScript matches what Metro actually bundles.
export {};

declare module '@firebase/auth' {
  export function getReactNativePersistence(storage: unknown): import('@firebase/auth').Persistence;
}
