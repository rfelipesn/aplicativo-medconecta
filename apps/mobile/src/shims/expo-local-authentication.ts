// Web shim for expo-local-authentication — no biometric hardware on web.
export const AuthenticationType = {
  FINGERPRINT: 1,
  FACIAL_RECOGNITION: 2,
  IRIS: 3,
} as const;

export async function hasHardwareAsync(): Promise<boolean> {
  return false;
}

export async function isEnrolledAsync(): Promise<boolean> {
  return false;
}

export async function supportedAuthenticationTypesAsync(): Promise<number[]> {
  return [];
}

export async function authenticateAsync(): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: 'unavailable' };
}

export default {
  AuthenticationType,
  hasHardwareAsync,
  isEnrolledAsync,
  supportedAuthenticationTypesAsync,
  authenticateAsync,
};
