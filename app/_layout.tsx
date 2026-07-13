import { useEffect, useRef } from 'react';
import { Stack, router } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import { useChildStore } from '../src/stores/childStore';

export default function RootLayout() {
  const loadedChildId = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = useAuthStore.getState().initAuthListener();

    const handleState = (state: ReturnType<typeof useAuthStore.getState>) => {
      if (state.initializing) return;
      if (!state.user) {
        loadedChildId.current = null;
        router.replace('/(auth)/welcome');
        return;
      }
      // Signed in: prefer the saved active child, else fall back to the first
      // child the user has.
      const childId = state.currentChildId ?? state.children[0]?.id ?? null;
      if (childId) {
        if (loadedChildId.current !== childId) {
          loadedChildId.current = childId;
          useChildStore.getState().loadChild(childId).then(() => {
            router.replace('/(tabs)/today');
          });
        }
      } else {
        // Signed in but no child yet (e.g. a social sign-in that didn't finish
        // onboarding) — send them to create their first child.
        loadedChildId.current = null;
        router.replace('/(auth)/onboarding' as any);
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
