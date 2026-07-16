import { useEffect, useRef } from 'react';
import { Stack, router } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import { useChildStore } from '../src/stores/childStore';

export default function RootLayout() {
  const loadedChildId = useRef<string | null>(null);
  const lastRoute = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = useAuthStore.getState().initAuthListener();

    // Navigate only when the target actually changes, so repeated auth-state
    // updates (user set, then children loaded) don't re-mount the same screen
    // and flash it multiple times.
    const go = (path: string) => {
      if (lastRoute.current === path) return;
      lastRoute.current = path;
      router.replace(path as any);
    };

    const handleState = (state: ReturnType<typeof useAuthStore.getState>) => {
      // Wait until startup finishes and any in-progress registration completes,
      // so we never route on a half-provisioned account.
      if (state.initializing || state.provisioning) return;
      if (!state.user) {
        loadedChildId.current = null;
        go('/(auth)/welcome');
        return;
      }
      // Signed in: prefer the saved active child, else fall back to the first
      // child the user has.
      const childId = state.currentChildId ?? state.children[0]?.id ?? null;
      if (childId) {
        if (loadedChildId.current !== childId) {
          loadedChildId.current = childId;
          useChildStore.getState().loadChild(childId).then(() => {
            go('/(tabs)/today');
          });
        }
      } else {
        // Signed in but no child yet (e.g. a social sign-in that didn't finish
        // onboarding) — send them to create their first child.
        loadedChildId.current = null;
        go('/(auth)/onboarding');
      }
    };

    handleState(useAuthStore.getState());
    const unsubscribeStore = useAuthStore.subscribe(handleState);

    return () => {
      unsubscribeAuth();
      unsubscribeStore();
    };
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="food/[id]" />
      <Stack.Screen name="recipe/[id]" />
      <Stack.Screen name="grow" options={{ presentation: 'modal' }} />
      <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
      <Stack.Screen name="privacy" options={{ presentation: 'modal' }} />
      <Stack.Screen name="terms" options={{ presentation: 'modal' }} />
      <Stack.Screen name="sos" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
