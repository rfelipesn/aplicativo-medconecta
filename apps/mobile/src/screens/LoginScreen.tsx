import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { env } from '../config/env';
import { supabase } from '../lib/supabase';
import { useBiometricLogin } from '../hooks/useBiometricLogin';
import { ELECTIVE_SCOPE_NOTICE } from '@medconecta/shared';
import { T } from '../theme/tokens';
import { FluentIcon } from '../components/FluentIcon';

const MAX_BIOMETRIC_FAILURES = 3;
const LOGIN_TIMEOUT_MS = 15_000;

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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LOGIN_TIMEOUT_MS);

  try {
    const res = await fetch(`${env.apiUrl}/auth/login/patient`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf: cpfDigits, birthDate: dateToPassword(birthDigits) }),
      signal: controller.signal,
    });
    return (await res.json()) as LoginResponse;
  } finally {
    clearTimeout(timeout);
  }
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
    <LinearGradient colors={[T.color.primaryStrong, T.color.primary, T.color.primarySoft]} style={styles.root}>
      <View style={styles.orbLarge} />
      <View style={styles.orbSmall} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.shell}
        >
          <View style={styles.header}>
            <View style={styles.logoMark}>
              <FluentIcon name="medical-bag" size={31} color={T.color.primaryStrong} />
            </View>
            <Text style={styles.logo}>MEDconecta</Text>
            <Text style={styles.sub}>Canal eletivo médico-paciente</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardEyebrow}>
              <View style={styles.cardEyebrowLine} />
              <Text style={styles.cardEyebrowText}>ACESSO DO PACIENTE</Text>
            </View>
            <Text style={styles.title}>Entrar</Text>
            <Text style={styles.titleHint}>Use os dados informados no cadastro médico.</Text>

        {showBiometricButton && (
          <TouchableOpacity
            style={styles.btnBiometric}
            onPress={handleBiometricLogin}
            disabled={anyLoading}
            accessibilityRole="button"
            accessibilityLabel="Entrar com biometria"
          >
            <View style={styles.biometricContent}>
              <FluentIcon name="fingerprint" size={21} color={T.color.primaryStrong} />
              <Text style={styles.btnBiometricText}>Entrar com biometria</Text>
            </View>
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

          <View style={styles.disclaimerRow}>
            <FluentIcon name="shield-check-outline" size={15} color="rgba(255,255,255,0.90)" />
            <Text style={styles.disclaimer}>{ELECTIVE_SCOPE_NOTICE.disclaimer}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  shell: { flexGrow: 1, justifyContent: 'center', paddingVertical: 28 },
  orbLarge: { position: 'absolute', width: 230, height: 230, borderRadius: 115, backgroundColor: 'rgba(255,255,255,0.09)', right: -80, top: -70 },
  orbSmall: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.08)', left: -48, bottom: 80 },
  header: { alignItems: 'center', paddingHorizontal: 32, marginBottom: T.space.lg },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: T.color.acrylicStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: T.space.md,
    ...T.shadow.card,
  },
  logo: { color: T.color.white, fontSize: 29, fontWeight: '800', letterSpacing: -0.9 },
  sub: { color: 'rgba(255,255,255,0.86)', marginTop: 5, fontSize: T.font.subhead, fontWeight: '600' },
  card: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    backgroundColor: T.color.acrylicStrong,
    marginHorizontal: T.space.md,
    marginBottom: T.space.md,
    borderRadius: T.radius.xxl,
    padding: 22,
    borderWidth: 1,
    borderColor: '#FFFFFF99',
    ...T.shadow.floating,
  },
  cardEyebrow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  cardEyebrowLine: { width: 20, height: 3, borderRadius: 2, backgroundColor: T.color.primary },
  cardEyebrowText: { color: T.color.primaryStrong, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  title: { fontSize: 25, fontWeight: '800', color: T.color.primaryDark, letterSpacing: -0.4 },
  titleHint: { color: T.color.textSecondary, fontSize: 12.5, marginTop: 3, marginBottom: T.space.lg },
  btnBiometric: {
    backgroundColor: T.color.primarySoft,
    borderWidth: 1,
    borderColor: T.color.separator,
    borderRadius: T.radius.md,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: T.space.md,
  },
  biometricContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnBiometricText: { color: T.color.primaryDark, fontSize: T.font.body, fontWeight: '700' },
  divider: {
    height: 1,
    backgroundColor: T.color.separator,
    marginBottom: T.space.md,
  },
  label: { fontSize: 12, color: T.color.textSecondary, marginBottom: 7, marginLeft: 4, fontWeight: '700' },
  input: {
    backgroundColor: T.color.surfaceSubtle,
    borderRadius: T.radius.md,
    borderWidth: 1,
    borderColor: T.color.separator,
    paddingHorizontal: 14,
    paddingVertical: 15,
    fontSize: T.font.headline,
    color: T.color.text,
    marginBottom: T.space.md,
    letterSpacing: 1,
  },
  btn: {
    backgroundColor: T.color.primaryStrong,
    borderRadius: T.radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: T.space.xs,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: T.color.onPrimary, fontSize: T.font.headline, fontWeight: '800' },
  hint: { textAlign: 'center', color: T.color.textTertiary, fontSize: T.font.caption, marginTop: T.space.md, lineHeight: 16 },
  disclaimerRow: { maxWidth: 520, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 28, marginTop: 2 },
  disclaimer: {
    flexShrink: 1,
    textAlign: 'left',
    color: 'rgba(255,255,255,0.90)',
    fontSize: T.font.caption,
    lineHeight: 16,
  },
});
