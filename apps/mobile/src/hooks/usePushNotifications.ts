import { useEffect, useRef, useState } from 'react';
import {
  getDeviceId,
  getExpoPushToken,
  registerPushTokenOnBackend,
  requestNotificationPermission,
  Notifications,
} from '../lib/pushNotifications';
import { useSession } from './useSession';
import { Platform } from 'react-native';
import type { NotificationResponse } from 'expo-notifications';
import type { NavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { MainStackParamList } from '../navigation/types';

interface UsePushNotificationsOptions {
  /** Ref do NavigationContainer para deep-link no clique. */
  navRef?: NavigationContainerRef<RootStackParamList> | null;
}

interface UsePushNotificationsResult {
  token: string | null;
  granted: boolean;
  lastNotification: Notifications.Notification | null;
}

/**
 * Mapeia o `type` da notificação (vindo do backend) para a rota destino no app.
 * Retorna a rota com parâmetros quando aplicável (deep-link completo).
 *
 * Tipos conhecidos (services/api/src/lib/notifications.ts + rotas):
 *  - new_demand, demand_response → Demands (com demandId) ou Notificações
 *  - new_chat_message → Chat
 *  - new_recipe_request, recipe_response → Receitas
 *  - new_document → Documents
 *  - appointment_confirmed → Notificações
 */
function mapNotifToRoute(data: {
  type?: string;
  relatedDemandId?: string;
}): { screen: 'Tabs'; params: { screen: string; params?: object } } | { screen: 'Demands'; params: { demandId?: string } } | { screen: 'Documents' } {
  switch (data?.type) {
    case 'new_chat_message':
      return { screen: 'Tabs', params: { screen: 'Chat' } };
    case 'new_recipe_request':
    case 'recipe_response':
      return { screen: 'Tabs', params: { screen: 'Receitas' } };
    case 'new_demand':
    case 'demand_response':
      return data.relatedDemandId
        ? { screen: 'Demands', params: { demandId: data.relatedDemandId } }
        : { screen: 'Tabs', params: { screen: 'Notificações' } };
    case 'new_document':
      return { screen: 'Documents' };
    case 'appointment_confirmed':
      return { screen: 'Tabs', params: { screen: 'Notificações' } };
    default:
      return { screen: 'Tabs', params: { screen: 'Notificações' } };
  }
}

/**
 * Hook de ciclo de vida do push:
 * 1. Pede permissão quando há sessão.
 * 2. Obtém o token Expo e registra no backend (idempotente).
 * 3. Configura listeners de foreground e response (clique).
 * 4. Navega para a aba Notificações ao tocar na notificação.
 *
 * Erros nunca quebram o app: permission denied, falta de rede, etc.
 */
export function usePushNotifications(
  options: UsePushNotificationsOptions = {},
): UsePushNotificationsResult {
  const { session } = useSession();
  const { navRef } = options;
  const isWeb = Platform.OS === 'web';
  const [token, setToken] = useState<string | null>(null);
  const [granted, setGranted] = useState(false);
  const [lastNotification, setLastNotification] = useState<Notifications.Notification | null>(null);
  const registeredRef = useRef<string | null>(null);

  // ── Registro: permissão + token + backend ─────────────────────────────
  useEffect(() => {
    if (isWeb) {
      setToken(null);
      setGranted(false);
      registeredRef.current = null;
      return;
    }

    if (!session) {
      setToken(null);
      setGranted(false);
      registeredRef.current = null;
      return;
    }

    let cancelled = false;

    (async () => {
      const ok = await requestNotificationPermission();
      if (cancelled) return;
      setGranted(ok);
      if (!ok) return;

      const expoToken = await getExpoPushToken();
      if (cancelled) return;
      if (!expoToken) return;
      setToken(expoToken);

      if (registeredRef.current === expoToken) return;
      const deviceId = await getDeviceId();
      if (cancelled) return;

      const platform: 'ios' | 'android' = Platform.OS === 'ios' ? 'ios' : 'android';
      const registered = await registerPushTokenOnBackend(expoToken, deviceId, platform);
      if (cancelled) return;
      if (registered) {
        registeredRef.current = expoToken;
      }
    })().catch(() => {
      /* nunca propaga */
    });

    return () => {
      cancelled = true;
    };
  }, [isWeb, session]);

  // ── Listeners ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isWeb) return;
    if (!session) return;

    const receivedSub = Notifications.addNotificationReceivedListener((notif) => {
      setLastNotification(notif);
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response: NotificationResponse) => {
        const data = response.notification.request.content.data as
          | { type?: string; relatedDemandId?: string }
          | undefined;
        if (!navRef) return;
        try {
          const route = mapNotifToRoute(data ?? {});
          // Navegação aninhada: 'App' envolve as bottom tabs e as telas de detalhe.
          // @ts-expect-error — navegação aninhada App > (Tabs | Demands | Documents)
          navRef.navigate('App', route);
        } catch {
          /* rota não disponível: silencioso */
        }
      },
    );

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [isWeb, session, navRef]);

  return { token, granted, lastNotification };
}

export type { MainStackParamList, RootStackParamList };
