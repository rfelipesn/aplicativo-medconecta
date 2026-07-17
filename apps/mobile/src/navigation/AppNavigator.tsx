import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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
import { T } from '../theme/tokens';
import { FluentIcon, type FluentIconName } from '../components/FluentIcon';

const Tab = createBottomTabNavigator<{
  Início: undefined;
  Chat: undefined;
  Receitas: undefined;
  Notificações: undefined;
}>();
const Stack = createNativeStackNavigator<MainStackParamList>();

const TAB_ICONS: Record<string, FluentIconName> = {
  Início: 'home-outline',
  Chat: 'message-text-outline',
  Receitas: 'file-document-outline',
  Notificações: 'bell-outline',
};

const HEADER_OPTS = {
  headerStyle: { backgroundColor: T.color.acrylicStrong },
  headerTintColor: T.color.primaryDark,
  headerTitleStyle: { fontWeight: '800' as const, fontSize: 17, color: T.color.primaryDark },
  headerShadowVisible: false,
  headerBackTitleVisible: false,
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
        tabBarIcon: ({ focused, color }) => (
          <FluentIcon
            name={TAB_ICONS[route.name] ?? 'circle-outline'}
            size={22}
            color={focused ? T.color.white : color}
          />
        ),
        tabBarLabel: route.name,
        tabBarInactiveTintColor: T.color.textTertiary,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginBottom: 2 },
        tabBarItemStyle: { borderRadius: 18, marginHorizontal: 4, marginVertical: 7 },
        tabBarActiveTintColor: T.color.onPrimary,
        tabBarActiveBackgroundColor: T.color.primaryStrong,
        tabBarStyle: {
          height: 76,
          paddingHorizontal: 8,
          backgroundColor: T.color.acrylicStrong,
          borderTopColor: T.color.border,
          borderTopWidth: 1,
          elevation: 12,
          shadowColor: T.color.primaryDark,
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -4 },
        },
        tabBarBadgeStyle: {
          backgroundColor: T.color.red,
          color: T.color.onPrimary,
          fontWeight: '800',
          borderWidth: 2,
          borderColor: T.color.white,
        },
        tabBarHideOnKeyboard: true,
        ...HEADER_OPTS,
      })}
    >
      <Tab.Screen name="Início" component={HomeScreen} options={{ headerShown: false }} />
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
