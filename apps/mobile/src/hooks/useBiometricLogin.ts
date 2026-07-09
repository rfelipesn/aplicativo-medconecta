import { useCallback, useEffect, useState } from 'react';
import {
  authenticateWithBiometrics,
  clearBiometricCredentials,
  getBiometricCredentials,
  isBiometricAvailable,
  saveBiometricCredentials,
  type BiometricCredentials,
} from '../lib/biometrics';

interface UseBiometricLogin {
  /** Hardware + biometria cadastrada disponível. */
  available: boolean;
  /** Credenciais salvas no storage seguro (CPF + birthDate). */
  credentials: BiometricCredentials | null;
  /** `true` durante uma tentativa de autenticação biométrica. */
  loading: boolean;
  /**
   * Tenta autenticar com biometria. Em caso de sucesso, retorna as credenciais
   * salvas; em caso de falha/cancelamento, retorna `null`.
   */
  attemptLogin: () => Promise<BiometricCredentials | null>;
  /** Salva as credenciais para o próximo login biométrico. */
  saveCredentials: (cpf: string, birthDate: string) => Promise<void>;
  /** Remove as credenciais salvas. */
  clearCredentials: () => Promise<void>;
}

export function useBiometricLogin(): UseBiometricLogin {
  const [available, setAvailable] = useState(false);
  const [credentials, setCredentials] = useState<BiometricCredentials | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const ok = await isBiometricAvailable();
      if (!mounted) return;
      setAvailable(ok);
      if (ok) {
        const stored = await getBiometricCredentials();
        if (mounted) setCredentials(stored);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const attemptLogin = useCallback(async (): Promise<BiometricCredentials | null> => {
    setLoading(true);
    try {
      const success = await authenticateWithBiometrics('Entrar com biometria');
      if (!success) return null;
      const creds = await getBiometricCredentials();
      if (!creds) return null;
      return creds;
    } finally {
      setLoading(false);
    }
  }, []);

  const saveCredentials = useCallback(async (cpf: string, birthDate: string) => {
    await saveBiometricCredentials({ cpf, birthDate });
    setCredentials({ cpf, birthDate });
  }, []);

  const clearCredentials = useCallback(async () => {
    await clearBiometricCredentials();
    setCredentials(null);
  }, []);

  return { available, credentials, loading, attemptLogin, saveCredentials, clearCredentials };
}
