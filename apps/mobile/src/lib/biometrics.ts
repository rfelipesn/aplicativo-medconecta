import * as LocalAuthentication from 'expo-local-authentication';

/** Verifica se o dispositivo tem biometria cadastrada. */
export async function isBiometricAvailable(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && isEnrolled;
}

/** Solicita autenticação biométrica (FaceID / Touch ID / Digital). */
export async function authenticateWithBiometrics(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Entrar no MEDconecta',
    cancelLabel: 'Usar senha',
    disableDeviceFallback: false,
  });
  return result.success;
}
