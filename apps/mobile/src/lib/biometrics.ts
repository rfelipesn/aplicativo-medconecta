import * as LocalAuthentication from 'expo-local-authentication';
import { secureGet, secureSet, secureDelete } from './secureStorage';

const BIOMETRIC_CREDENTIALS_KEY = 'biometric_credentials';

export interface BiometricCredentials {
  cpf: string;
  /** Data de nascimento no formato DDMMAAAA (a mesma usada como "senha"). */
  birthDate: string;
}

/** Verifica se o dispositivo tem hardware biométrico E biometria cadastrada. */
export async function isBiometricAvailable(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) return false;
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
}

/** Retorna os tipos de biometria suportados pelo dispositivo (Face ID, Touch ID, digital, etc.). */
export async function getBiometricType(): Promise<LocalAuthentication.AuthenticationType[]> {
  return LocalAuthentication.supportedAuthenticationTypesAsync();
}

/**
 * Solicita autenticação biométrica ao sistema.
 * @returns `true` se a autenticação teve sucesso, `false` caso contrário (cancelamento, falha, etc.).
 */
export async function authenticateWithBiometrics(
  promptMessage = 'Confirme sua identidade',
): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    fallbackLabel: 'Usar senha',
    cancelLabel: 'Cancelar',
    disableDeviceFallback: false,
  });
  return result.success;
}

/** Persiste as credenciais de login vinculadas à biometria. */
export async function saveBiometricCredentials(creds: BiometricCredentials): Promise<void> {
  await secureSet(BIOMETRIC_CREDENTIALS_KEY, JSON.stringify(creds));
}

/** Recupera as credenciais salvas, ou `null` se não houver / estiverem corrompidas. */
export async function getBiometricCredentials(): Promise<BiometricCredentials | null> {
  const stored = await secureGet(BIOMETRIC_CREDENTIALS_KEY);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored) as Partial<BiometricCredentials>;
    if (typeof parsed.cpf !== 'string' || typeof parsed.birthDate !== 'string') return null;
    return { cpf: parsed.cpf, birthDate: parsed.birthDate };
  } catch {
    return null;
  }
}

/** Remove as credenciais biométricas salvas. */
export async function clearBiometricCredentials(): Promise<void> {
  await secureDelete(BIOMETRIC_CREDENTIALS_KEY);
}
