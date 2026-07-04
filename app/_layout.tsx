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
      if (state.currentChildId && loadedChildId.current !== state.currentChildId) {
        loadedChildId.current = state.currentChildId;
        useChildStore.getState().loadChild(state.currentChildId).then(() => {
          router.replace('/(tabs)/today');
        });
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
