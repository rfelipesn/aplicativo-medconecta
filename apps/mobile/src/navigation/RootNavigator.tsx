import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { AppNavigator } from './AppNavigator';
import { useSession } from '../hooks/useSession';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../lib/api';
import { ActivityIndicator, View } from 'react-native';
import type { MeResponse } from '../types';

export type RootStackParamList = {
  Login: undefined;
  Onboarding: undefined;
  App: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function Loading() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' }}>
      <ActivityIndicator size="large" color="#85B7BF" />
    </View>
  );
}

export function RootNavigator() {
  const { session, loading: sessionLoading } = useSession();

  const meQuery = useQuery<MeResponse>({
    queryKey: ['me'],
    queryFn: () => apiGet<MeResponse>('/me'),
    enabled: !!session,
    staleTime: 30_000,
  });

  // Pronto quando: sem sessão (Login) ou temos dados /me ou erro.
  const ready = !session || !!meQuery.data || meQuery.isError;

  if (sessionLoading || !ready) {
    return <Loading />;
  }

  const user = meQuery.data?.user;
  const requiresOnboarding = user?.role === 'patient' && user?.mustChangePassword === true;

  let route: keyof RootStackParamList;
  if (!session) {
    route = 'Login';
  } else if (requiresOnboarding) {
    route = 'Onboarding';
  } else {
    route = 'App';
  }

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      // `initialRouteName` explícito evita que o React Navigation decida
      // outra tela como inicial em re-renders durante a transição.
      initialRouteName={route}
    >
      {route === 'Login' && <Stack.Screen name="Login" component={LoginScreen} />}
      {route === 'Onboarding' && <Stack.Screen name="Onboarding" component={OnboardingScreen} />}
      {route === 'App' && <Stack.Screen name="App" component={AppNavigator} />}
    </Stack.Navigator>
  );
}
