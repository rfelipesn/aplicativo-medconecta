import { useEffect } from 'react';
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

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7273/ingest/359a14c5-d90b-477e-becc-c780dfc72bc1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'603b9b'},body:JSON.stringify({sessionId:'603b9b',location:'RootNavigator.tsx:36',message:'meQuery state',data:{hasSession:!!session,status:meQuery.status,isError:meQuery.isError,hasData:!!meQuery.data,mustChangePassword:meQuery.data?.user?.mustChangePassword},timestamp:Date.now(),runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
  }, [session, meQuery.status, meQuery.isError, meQuery.data]);
  // #endregion

  // Pronto quando: sem sessão (Login) ou temos dados /me ou erro.
  const ready = !session || !!meQuery.data || meQuery.isError;

  if (sessionLoading || !ready) {
    // #region agent log
    fetch('http://127.0.0.1:7273/ingest/359a14c5-d90b-477e-becc-c780dfc72bc1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'603b9b'},body:JSON.stringify({sessionId:'603b9b',location:'RootNavigator.tsx:43',message:'rendering Loading',data:{sessionLoading,ready,hasSession:!!session},timestamp:Date.now(),runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    return <Loading />;
  }

  const user = meQuery.data?.user;
  const requiresOnboarding = user?.role === 'patient' && user?.mustChangePassword === true;

  // #region agent log
  fetch('http://127.0.0.1:7273/ingest/359a14c5-d90b-477e-becc-c780dfc72bc1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'603b9b'},body:JSON.stringify({sessionId:'603b9b',location:'RootNavigator.tsx:48',message:'route decision',data:{hasUser:!!user,role:user?.role,mustChangePassword:user?.mustChangePassword,requiresOnboarding},timestamp:Date.now(),runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
  // #endregion

  let route: keyof RootStackParamList;
  if (!session) {
    route = 'Login';
  } else if (requiresOnboarding) {
    route = 'Onboarding';
  } else {
    route = 'App';
  }

  // #region agent log
  fetch('http://127.0.0.1:7273/ingest/359a14c5-d90b-477e-becc-c780dfc72bc1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'603b9b'},body:JSON.stringify({sessionId:'603b9b',location:'RootNavigator.tsx:62',message:'chosen route',data:{route},timestamp:Date.now(),runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
  // #endregion

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
