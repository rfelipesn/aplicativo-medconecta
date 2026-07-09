import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { RecipesScreen } from '../screens/RecipesScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { DiaryDashboardScreen } from '../screens/DiaryDashboardScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { DemandsScreen } from '../screens/DemandsScreen';
import { DocumentsScreen } from '../screens/DocumentsScreen';
import { RegisterCrisisScreen } from '../features/headache/RegisterCrisisScreen';
import { SeizureDashboardScreen } from '../screens/SeizureDashboardScreen';
import { SeizureReportsScreen } from '../screens/SeizureReportsScreen';
import { RegisterSeizureScreen } from '../features/seizure/RegisterSeizureScreen';
import { HealthEventsScreen } from '../screens/HealthEventsScreen';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../lib/api';
import type { MeResponse, NotificationsResponse } from '../types';
import { useWatermelonSync } from '../watermelon/useWatermelonSync';
import type { MainStackParamList } from './types';

const Tab = createBottomTabNavigator<{
  Início: undefined;
  Chat: undefined;
  Receitas: undefined;
  Notificações: undefined;
}>();
const Stack = createNativeStackNavigator<MainStackParamList>();

const TAB_ICONS: Record<string, string> = {
  Início: '🏠',
  Chat: '💬',
  Receitas: '📋',
  Notificações: '🔔',
};

const HEADER_OPTS = {
  headerStyle: { backgroundColor: '#85B7BF' },
  headerTintColor: '#0F3B41',
  headerTitleStyle: { fontWeight: '700' as const },
};

function RootTabs() {
  const meQuery = useQuery({ queryKey: ['me'], queryFn: () => apiGet<MeResponse>('/me') });
  useWatermelonSync(meQuery.data?.user.patient?.id);

  const notifsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiGet<NotificationsResponse>('/notifications'),
    refetchInterval: 30_000,
  });
  const unread = notifsQuery.data?.unreadCount ?? 0;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: () => (
          <Text style={{ fontSize: 20 }}>
            {TAB_ICONS[route.name] ?? '•'}
          </Text>
        ),
        tabBarLabel: route.name,
        tabBarActiveTintColor: '#2E6B73',
        tabBarInactiveTintColor: '#6B7B8D',
        ...HEADER_OPTS,
      })}
    >
      <Tab.Screen name="Início" component={HomeScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Receitas" component={RecipesScreen} />
      <Tab.Screen
        name="Notificações"
        component={NotificationsScreen}
        options={{
          tabBarBadge: unread > 0 ? unread : undefined,
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={HEADER_OPTS}>
      {/* Bottom Tabs — esconde o header do Stack para mostrar o do Tab */}
      <Stack.Screen name="Tabs" component={RootTabs} options={{ headerShown: false }} />

      {/* Telas de cefaleia (modal pushed do root stack) */}
      <Stack.Screen
        name="DiaryDashboard"
        component={DiaryDashboardScreen}
        options={{ ...HEADER_OPTS, title: 'Diário de Cefaleia' }}
      />
      <Stack.Screen
        name="RegisterCrisis"
        component={RegisterCrisisScreen}
        options={{ ...HEADER_OPTS, headerShown: false }}
      />
      <Stack.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ ...HEADER_OPTS, title: 'Relatórios' }}
      />
      <Stack.Screen
        name="Demands"
        component={DemandsScreen}
        options={{ ...HEADER_OPTS, title: 'Minhas Demandas' }}
      />

      {/* Telas previstas no type list, ainda sem tela dedicada */}
      <Stack.Screen name="StatsDetail" component={HomeScreen} options={{ ...HEADER_OPTS, title: 'Detalhes' }} />
      <Stack.Screen name="NotesHistory" component={HomeScreen} options={{ ...HEADER_OPTS, title: 'Notas' }} />

      {/* Telas de convulsão (modal pushed do root stack) */}
      <Stack.Screen
        name="SeizureDashboard"
        component={SeizureDashboardScreen}
        options={{ ...HEADER_OPTS, title: 'Diário de Convulsão' }}
      />
      <Stack.Screen
        name="RegisterSeizure"
        component={RegisterSeizureScreen}
        options={{ ...HEADER_OPTS, headerShown: false }}
      />
      <Stack.Screen
        name="SeizureReports"
        component={SeizureReportsScreen}
        options={{ ...HEADER_OPTS, title: 'Relatórios de Convulsão' }}
      />
      <Stack.Screen
        name="HealthEvents"
        component={HealthEventsScreen}
        options={{ ...HEADER_OPTS, title: 'Anotar Sintoma' }}
      />

      {/* Documentos (receitas, laudos, prescrições) */}
      <Stack.Screen
        name="Documents"
        component={DocumentsScreen}
        options={{ ...HEADER_OPTS, title: 'Documentos' }}
      />
    </Stack.Navigator>
  );
}
