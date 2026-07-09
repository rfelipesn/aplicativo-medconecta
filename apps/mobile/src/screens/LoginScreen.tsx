import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { env } from '../config/env';
import { supabase } from '../lib/supabase';
import { useBiometricLogin } from '../hooks/useBiometricLogin';
import { ELECTIVE_SCOPE_NOTICE } from '@medconecta/shared';
import { T } from '../theme/tokens';

const MAX_BIOMETRIC_FAILURES = 3;

/** Remove tudo que não for dígito */
function onlyDigits(s: string) {
  return s.replace(/\D/g, '');
}

/** Mascara CPF: 000.000.000-00 */
function maskCpf(raw: string) {
  const d = onlyDigits(raw).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/** Mascara data: DD/MM/AAAA */
function maskDate(raw: string) {
  const d = onlyDigits(raw).slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/** DD/MM/AAAA → DDMMAAAA (senha) */
function dateToPassword(masked: string) {
  return onlyDigits(masked);
}

interface LoginResponse {
  ok?: boolean;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}

async function performLogin(cpfDigits: string, birthDigits: string): Promise<LoginResponse> {
  const res = await fetch(`${env.apiUrl}/auth/login/patient`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cpf: cpfDigits, birthDate: dateToPassword(birthDigits) }),
  });
  return (await res.json()) as LoginResponse;
}

export function LoginScreen() {
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);
  const biometricFailuresRef = useRef(0);

  const {
    available: biometricAvailable,
    credentials: savedCredentials,
    loading: biometricLoading,
    attemptLogin,
    saveCredentials,
    clearCredentials,
  } = useBiometricLogin();

  const cpfDigits = onlyDigits(cpf);
  const birthDigits = onlyDigits(birthDate);
  const isValid = cpfDigits.length === 11 && birthDigits.length === 8;

  function applyCredentials(creds: { cpf: string; birthDate: string }) {
    setCpf(maskCpf(creds.cpf));
    setBirthDate(maskDate(creds.birthDate));
  }

  async function injectSession(data: LoginResponse): Promise<boolean> {
    if (!data.accessToken) return false;
    await supabase.auth.setSession({
      access_token: data.accessToken,
      refresh_token: data.refreshToken ?? '',
    });
    return true;
  }

  async function handleLogin() {
    if (!isValid) {
      Alert.alert('Atenção', 'Preencha CPF (11 dígitos) e data de nascimento completa.');
      return;
    }
    setLoading(true);
    try {
      const data = await performLogin(cpfDigits, birthDigits);
      const ok = await injectSession(data);
      if (!ok) {
        Alert.alert('Erro', 'CPF ou data de nascimento incorretos.');
        return;
      }
      maybeOfferSaveCredentials(cpfDigits, birthDigits);
    } catch {
      Alert.alert('Erro', 'Não foi possível conectar ao servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleBiometricLogin() {
    if (biometricLoading) return;
    const creds = await attemptLogin();
    if (!creds) {
      biometricFailuresRef.current += 1;
      if (biometricFailuresRef.current >= MAX_BIOMETRIC_FAILURES && savedCredentials) {
        Alert.alert(
          'Muitas tentativas',
          'Você excedeu o número de tentativas com biometria. Deseja limpar as credenciais salvas?',
          [
            { text: 'Não', style: 'cancel' },
            {
              text: 'Limpar',
              style: 'destructive',
              onPress: async () => {
                await clearCredentials();
                biometricFailuresRef.current = 0;
              },
            },
          ],
        );
      }
      return;
    }
    biometricFailuresRef.current = 0;
    applyCredentials(creds);
    setLoading(true);
    try {
      const data = await performLogin(creds.cpf, creds.birthDate);
      const ok = await injectSession(data);
      if (!ok) {
        Alert.alert('Erro', 'CPF ou data de nascimento incorretos. Suas credenciais salvas serão removidas.', [
          {
            text: 'OK',
            onPress: async () => {
              await clearCredentials();
              setCpf('');
              setBirthDate('');
            },
          },
        ]);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível conectar ao servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  function maybeOfferSaveCredentials(cpfToSave: string, birthToSave: string) {
    if (!biometricAvailable) return;
    if (savedCredentials) return;
    Alert.alert(
      'Salvar credenciais?',
      'Deseja usar biometria para entrar mais rápido da próxima vez?',
      [
        { text: 'Agora não', style: 'cancel' },
        {
          text: 'Salvar',
          onPress: async () => {
            try {
              await saveCredentials(cpfToSave, birthToSave);
            } catch {
              // Falha ao salvar não deve bloquear o usuário.
            }
          },
        },
      ],
    );
  }

  const showBiometricButton = biometricAvailable && !!savedCredentials;
  const anyLoading = loading || biometricLoading;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <View style={styles.logoMark}>
          <Text style={styles.logoMarkText}>＋</Text>
        </View>
        <Text style={styles.logo}>MEDconecta</Text>
        <Text style={styles.sub}>Canal eletivo médico-paciente</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Entrar</Text>

        {showBiometricButton && (
          <TouchableOpacity
            style={styles.btnBiometric}
            onPress={handleBiometricLogin}
            disabled={anyLoading}
            accessibilityRole="button"
            accessibilityLabel="Entrar com biometria"
          >
            <Text style={styles.btnBiometricText}>Entrar com biometria</Text>
          </TouchableOpacity>
        )}

        {showBiometricButton && <View style={styles.divider} />}

        <Text style={styles.label}>CPF</Text>
        <TextInput
          style={styles.input}
          value={cpf}
          onChangeText={(t) => setCpf(maskCpf(t))}
          keyboardType="numeric"
          placeholder="000.000.000-00"
          placeholderTextColor={T.color.textTertiary}
          maxLength={14}
          autoComplete="off"
        />

        <Text style={styles.label}>Data de nascimento</Text>
        <TextInput
          style={styles.input}
          value={birthDate}
          onChangeText={(t) => setBirthDate(maskDate(t))}
          keyboardType="numeric"
          placeholder="DD/MM/AAAA"
          placeholderTextColor={T.color.textTertiary}
          maxLength={10}
        />

        <TouchableOpacity
          style={[styles.btn, (!isValid || anyLoading) && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={!isValid || anyLoading}
        >
          {loading ? (
            <ActivityIndicator color={T.color.onPrimary} />
          ) : (
            <Text style={styles.btnText}>Entrar</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>
          Suas credenciais foram informadas pelo seu médico no momento do cadastro.
        </Text>
      </View>

      <Text style={styles.disclaimer}>{ELECTIVE_SCOPE_NOTICE.disclaimer}</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.color.bg, justifyContent: 'center' },
  header: { alignItems: 'center', paddingHorizontal: 32, marginBottom: T.space.lg },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: T.radius.lg,
    backgroundColor: T.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: T.space.md,
    ...T.shadow.card,
  },
  logoMarkText: { color: T.color.onPrimary, fontSize: 34, fontWeight: '800', marginTop: -2 },
  logo: { color: T.color.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  sub: { color: T.color.textSecondary, marginTop: 4, fontSize: T.font.subhead },
  card: {
    backgroundColor: T.color.surface,
    margin: T.space.md,
    borderRadius: T.radius.xl,
    padding: T.space.lg,
    ...T.shadow.card,
  },
  title: { fontSize: T.font.title, fontWeight: '800', color: T.color.text, marginBottom: T.space.lg },
  btnBiometric: {
    backgroundColor: T.color.primarySoft,
    borderRadius: T.radius.pill,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: T.space.md,
  },
  btnBiometricText: { color: T.color.primaryDark, fontSize: T.font.body, fontWeight: '700' },
  divider: {
    height: 1,
    backgroundColor: T.color.separator,
    marginBottom: T.space.md,
  },
  label: { fontSize: T.font.subhead, color: T.color.textSecondary, marginBottom: 6, marginLeft: 4 },
  input: {
    backgroundColor: T.color.surfaceMuted,
    borderRadius: T.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: T.font.headline,
    color: T.color.text,
    marginBottom: T.space.md,
    letterSpacing: 1,
  },
  btn: {
    backgroundColor: T.color.primary,
    borderRadius: T.radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: T.space.xs,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: T.color.onPrimary, fontSize: T.font.headline, fontWeight: '700' },
  hint: { textAlign: 'center', color: T.color.textTertiary, fontSize: T.font.caption, marginTop: T.space.md, lineHeight: 16 },
  disclaimer: {
    textAlign: 'center',
    color: T.color.textTertiary,
    fontSize: T.font.caption,
    paddingHorizontal: 24,
    marginTop: T.space.sm,
    lineHeight: 16,
  },
});
