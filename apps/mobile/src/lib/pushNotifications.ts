import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiPost } from './api';

/**
 * Comportamento de notificações em foreground: mostra alerta + som.
 * Em background, o sistema operacional cuida.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Resposta do backend ao registrar token (sem expor o token). */
interface RegisterPushTokenResponse {
  ok: boolean;
  pushToken: { id: string; platform: string };
}

/**
 * Pede permissão para notificações (iOS) e — em Android 13+ — para o canal
 * padrão. Retorna `granted: true` se o usuário autorizou.
 *
 * Falha silenciosa: se o dispositivo for um emulador/simulador sem suporte,
 * retornamos `granted: false` sem quebrar o app.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (!Device.isDevice) {
      // Emulador/simulador: ainda tentamos, mas Expo pode falhar.
      // Não bloqueia a inicialização.
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      });
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    // Canal Android (idempotente).
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#85B7BF',
      });
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Obtém o Expo Push Token do device.
 * - Requer `projectId` em `app.json` (`extra.eas.projectId`) para EAS builds.
 * - Em Expo Go, o projectId é resolvido automaticamente.
 * - Retorna `null` em caso de falha.
 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    const extraObj = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
    const eas = extraObj.eas as { projectId?: string } | undefined;
    const projectId = eas?.projectId;

    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return tokenResponse.data ?? null;
  } catch {
    return null;
  }
}

/** Retorna um identificador estável do device (sem permissões sensíveis). */
export async function getDeviceId(): Promise<string> {
  // expo-application: Application.getAndroidId() (Android) e Constants.deviceId
  // são candidatos. Aqui usamos uma combinação simples e estável:
  // Constants.sessionId é gerado por sessão de instalação, mas combinado com o
  // platform fornece um identificador útil.
  // Para uma solução 100% estável, recomenda-se usar `expo-application` (não
  // adicionada aqui para manter o escopo). `Device.modelId` é estável por
  // modelo, não por instância; usamos o sessionId + modelName como aproximação.
  const modelId = Device.modelId ?? 'unknown';
  const os = `${Platform.OS}-${Platform.Version ?? ''}`;
  return `${os}-${modelId}`;
}

/**
 * Registra (ou atualiza) o token do device no backend. Idempotente.
 * Retorna `true` em caso de sucesso, `false` caso contrário.
 *
 * Nunca loga o token (dado sensível).
 */
export async function registerPushTokenOnBackend(
  token: string,
  deviceId: string,
  platform: 'ios' | 'android',
): Promise<boolean> {
  try {
    await apiPost<RegisterPushTokenResponse>('/push-tokens', {
      token,
      deviceId,
      platform,
    });
    return true;
  } catch {
    return false;
  }
}

export { Notifications };
