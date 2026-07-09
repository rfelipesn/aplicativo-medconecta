import { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  NavigationContainer,
  type NavigationContainerRef,
} from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RootNavigator } from './navigation/RootNavigator';
import { usePushNotifications } from './hooks/usePushNotifications';
import { useSession } from './hooks/useSession';
import { scheduleSymptomReminder } from './lib/symptomReminders';
import type { RootStackParamList } from './navigation/RootNavigator';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function PushBridge({ children }: { children: React.ReactNode }) {
  const { session } = useSession();
  const navRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  usePushNotifications({ navRef: navRef.current });

  useEffect(() => {
    if (Platform.OS === 'web' || !session) return;
    scheduleSymptomReminder().catch(() => undefined);
  }, [session]);

  return <NavigationContainer ref={navRef}>{children}</NavigationContainer>;
}

export function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <PushBridge>
          <StatusBar style="light" />
          <RootNavigator />
        </PushBridge>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
