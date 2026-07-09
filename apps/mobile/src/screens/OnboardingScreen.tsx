import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiChangePassword, apiGet, apiPost, ApiError } from '../lib/api';
import { authenticateWithBiometrics, isBiometricAvailable } from '../lib/biometrics';
import type { MeResponse } from '../types';

const C = {
  primary: '#85B7BF',
  onPrimary: '#0F3B41',
  bg: '#F5F7FA',
  surface: '#FFFFFF',
  text: '#333333',
  muted: '#6B7B8D',
  border: '#DDE3EA',
  danger: '#C0392B',
  dangerBg: '#FFF3F3',
};

type Step = 'welcome' | 'scope' | 'terms' | 'password';

const STEP_ORDER: Step[] = ['welcome', 'scope', 'terms', 'password'];

function onlyDigits(s: string) {
  return s.replace(/\D/g, '');
}

export function OnboardingScreen() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('welcome');
  const [completed, setCompleted] = useState(false);
  const [acceptedScope, setAcceptedScope] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedSensitive, setAcceptedSensitive] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [usePin, setUsePin] = useState(true);
  const [savingBiometric, setSavingBiometric] = useState(false);

  // Polling de /me após conclusão de PIN: refetch agressivo com 1s interval
  // para detectar rapidamente quando backend confirmou mustChangePassword=false.
  const meAfterChange = useQuery<MeResponse>({
    queryKey: ['me'],
    queryFn: () => apiGet<MeResponse>('/me'),
    enabled: completed,
    staleTime: 0,
    refetchInterval: 1000,
  });

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7273/ingest/359a14c5-d90b-477e-becc-c780dfc72bc1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'603b9b'},body:JSON.stringify({sessionId:'603b9b',location:'OnboardingScreen.tsx:55',message:'meAfterChange state',data:{completed,status:meAfterChange.status,isError:meAfterChange.isError,mustChangePassword:meAfterChange.data?.user?.mustChangePassword},timestamp:Date.now(),runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
  }, [completed, meAfterChange.status, meAfterChange.isError, meAfterChange.data]);
  // #endregion

  // Lock de rebobinamento: depois que o usuário passa da welcome/scope/terms
  // não permitimos voltar via re-render acidental (ex.: refetch que desmonta).
  const lockedStepRef = useRef<Step>('welcome');
  useEffect(() => {
    if (STEP_ORDER.indexOf(step) > STEP_ORDER.indexOf(lockedStepRef.current)) {
      lockedStepRef.current = step;
    }
  }, [step]);
  const safeStep: Step = STEP_ORDER.indexOf(step) >= STEP_ORDER.indexOf(lockedStepRef.current)
    ? step
    : lockedStepRef.current;

  const recordConsent = useMutation({
    mutationFn: (input: { consentType: string; version: string; accepted: true }) =>
      apiPost('/me/consents', input),
  });

  const canGoPassword = acceptedScope && acceptedTerms && acceptedPrivacy && acceptedSensitive;

  async function saveConsentsAndGoPassword() {
    if (!canGoPassword) {
      Alert.alert('Atenção', 'Aceite todos os termos para continuar.');
      return;
    }

    try {
      await Promise.all([
        recordConsent.mutateAsync({
          consentType: 'elective_scope_acknowledgment',
          version: '1.0',
          accepted: true,
        }),
        recordConsent.mutateAsync({ consentType: 'terms', version: '1.0', accepted: true }),
        recordConsent.mutateAsync({
          consentType: 'privacy_policy',
          version: '1.0',
          accepted: true,
        }),
        recordConsent.mutateAsync({
          consentType: 'data_processing',
          version: '1.0',
          accepted: true,
        }),
        recordConsent.mutateAsync({
          consentType: 'sensitive_health_data',
          version: '1.0',
          accepted: true,
        }),
      ]);
      setStep('password');
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível salvar seus aceites. Tente novamente.');
    }
  }

  async function finishPasswordStep() {
    const p = usePin ? onlyDigits(password) : password;
    const cp = usePin ? onlyDigits(confirmPassword) : confirmPassword;

    if (usePin) {
      if (p.length !== 6 || cp.length !== 6) {
        Alert.alert('Atenção', 'O PIN deve ter 6 dígitos.');
        return;
      }
    } else {
      if (p.length < 8 || cp.length < 8) {
        Alert.alert('Atenção', 'A senha deve ter ao menos 8 caracteres.');
        return;
      }
    }

    if (p !== cp) {
      Alert.alert('Atenção', usePin ? 'Os PINs não conferem.' : 'As senhas não conferem.');
      return;
    }

    // 1) Troca a senha. apiChangePassword já injeta a NOVA sessão (devolvida
    //    pelo backend) no Supabase, evitando 401 no /me logo em seguida.
    try {
      // #region agent log
      fetch('http://127.0.0.1:7273/ingest/359a14c5-d90b-477e-becc-c780dfc72bc1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'603b9b'},body:JSON.stringify({sessionId:'603b9b',location:'OnboardingScreen.tsx:142',message:'calling apiChangePassword',data:{usePin},timestamp:Date.now(),runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      await apiChangePassword(p);
      // #region agent log
      fetch('http://127.0.0.1:7273/ingest/359a14c5-d90b-477e-becc-c780dfc72bc1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'603b9b'},body:JSON.stringify({sessionId:'603b9b',location:'OnboardingScreen.tsx:143',message:'apiChangePassword OK',data:{},timestamp:Date.now(),runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
    } catch (err) {
      const message =
        err instanceof ApiError && err.status < 500
          ? 'Não foi possível salvar a nova senha. Tente novamente.'
          : 'Falha de conexão ao salvar a senha. Verifique sua internet e tente novamente.';
      Alert.alert('Erro', message);
      return;
    }

    // 2) Biometria opcional — falhas aqui NÃO bloqueiam o fluxo.
    setSavingBiometric(true);
    try {
      const available = await isBiometricAvailable();
      if (available) {
        const ok = await authenticateWithBiometrics();
        if (!ok) {
          Alert.alert('Biometria', 'Você pode habilitar depois nas configurações do aparelho.');
        }
      }
    } catch {
      // ignora
    } finally {
      setSavingBiometric(false);
    }

    // 3) Sinaliza conclusão. A partir daqui o meAfterChange é habilitado
    //    e o RootNavigator troca para App assim que /me confirmar.
    // #region agent log
    fetch('http://127.0.0.1:7273/ingest/359a14c5-d90b-477e-becc-c780dfc72bc1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'603b9b'},body:JSON.stringify({sessionId:'603b9b',location:'OnboardingScreen.tsx:170',message:'setCompleted(true)',data:{},timestamp:Date.now(),runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    setCompleted(true);
    // Garante que o cache antigo (com mustChangePassword=true) não seja
    // usado por nenhuma tela antes da revalidação.
    queryClient.invalidateQueries({ queryKey: ['me'] });
  }

  function renderWelcome() {
    return (
      <View style={styles.card}>
        <Text style={styles.logo}>MEDconecta</Text>
        <Text style={styles.cardTitle}>Bem-vindo(a)!</Text>
        <Text style={styles.body}>
          Este é o seu canal seguro de comunicação com o Dr. Helton Bruno. Antes de começar,
          precisamos que você conheça algumas regras de uso e defina uma forma de acesso.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={() => setStep('scope')}>
          <Text style={styles.btnText}>Começar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderScope() {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Canal eletivo</Text>
        <View style={styles.noticeBox}>
          <Text style={styles.dangerTitle}>Atenção</Text>
          <Text style={styles.body}>
            O MEDconecta é um canal exclusivamente para assuntos eletivos. Ele NÃO serve para
            urgências ou emergências médicas.
          </Text>
        </View>
        <Text style={styles.body}>
          Em caso agudo, procure atendimento presencial, de preferência um Pronto-Socorro:
        </Text>
        <View style={styles.emergencyRow}>
          <Text style={styles.emergencyNumber}>SAMU 192</Text>
          <Text style={styles.emergencyNumber}>Bombeiros 193</Text>
        </View>

        <View style={styles.checkboxRow}>
          <Switch value={acceptedScope} onValueChange={setAcceptedScope} trackColor={{ true: C.primary }} />
          <Text style={styles.checkboxLabel}>Li e entendi: este app não é para emergências.</Text>
        </View>

        <TouchableOpacity
          style={[styles.btn, !acceptedScope && styles.btnDisabled]}
          onPress={() => setStep('terms')}
          disabled={!acceptedScope}
        >
          <Text style={styles.btnText}>Continuar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderTerms() {
    return (
      <ScrollView style={styles.cardScroll} contentContainerStyle={styles.cardContent}>
        <Text style={styles.cardTitle}>Termos e consentimentos</Text>
        <Text style={styles.body}>
          Para continuar, precisamos do seu consentimento sobre o uso dos seus dados.
        </Text>

        <View style={styles.checks}>
          <View style={styles.checkboxRow}>
            <Switch value={acceptedTerms} onValueChange={setAcceptedTerms} trackColor={{ true: C.primary }} />
            <Text style={styles.checkboxLabel}>Aceito os Termos de Uso.</Text>
          </View>
          <View style={styles.checkboxRow}>
            <Switch value={acceptedPrivacy} onValueChange={setAcceptedPrivacy} trackColor={{ true: C.primary }} />
            <Text style={styles.checkboxLabel}>Aceito a Política de Privacidade.</Text>
          </View>
          <View style={styles.checkboxRow}>
            <Switch value={acceptedSensitive} onValueChange={setAcceptedSensitive} trackColor={{ true: C.primary }} />
            <Text style={styles.checkboxLabel}>
              Autorizo o tratamento dos meus dados sensíveis de saúde, conforme a LGPD.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.btn, !canGoPassword && styles.btnDisabled]}
          onPress={saveConsentsAndGoPassword}
          disabled={!canGoPassword || recordConsent.isPending}
        >
          {recordConsent.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Continuar</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    );
  }

  function renderPassword() {
    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.cardScroll} contentContainerStyle={styles.cardContent}>
          <Text style={styles.cardTitle}>Crie seu acesso</Text>
          <Text style={styles.body}>
            Escolha como quer desbloquear o app. Você pode usar um PIN numérico de 6 dígitos
            ou uma senha alfanumérica.
          </Text>

          <View style={styles.pinToggle}>
            <Text style={styles.body}>Usar PIN de 6 dígitos</Text>
            <Switch value={usePin} onValueChange={setUsePin} trackColor={{ true: C.primary }} />
          </View>

          <Text style={styles.label}>{usePin ? 'PIN' : 'Senha'}</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={(t) => setPassword(usePin ? onlyDigits(t).slice(0, 6) : t)}
            keyboardType={usePin ? 'numeric' : 'default'}
            secureTextEntry
            placeholder={usePin ? '000000' : 'Mínimo 8 caracteres'}
            placeholderTextColor={C.muted}
            maxLength={usePin ? 6 : 72}
          />

          <Text style={styles.label}>Confirmar {usePin ? 'PIN' : 'senha'}</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={(t) => setConfirmPassword(usePin ? onlyDigits(t).slice(0, 6) : t)}
            keyboardType={usePin ? 'numeric' : 'default'}
            secureTextEntry
            placeholder={usePin ? '000000' : 'Mínimo 8 caracteres'}
            placeholderTextColor={C.muted}
            maxLength={usePin ? 6 : 72}
          />

          <Text style={styles.hint}>
            Nos próximos acessos você poderá usar a biometria do seu aparelho.
          </Text>

          <TouchableOpacity
            style={styles.btn}
            onPress={finishPasswordStep}
            disabled={savingBiometric}
          >
            {savingBiometric ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Concluir</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {completed ? (
        <View style={styles.card}>
          <ActivityIndicator color={C.primary} />
          <Text style={[styles.body, { textAlign: 'center', marginTop: 12 }]}>
            Finalizando seu acesso...
          </Text>
          <Text style={[styles.hint, { marginTop: 8 }]}>
            {meAfterChange.isError
              ? 'Não foi possível confirmar. Verificando novamente...'
              : 'Aguarde, abrindo a área principal.'}
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width:
                    safeStep === 'welcome'
                      ? '25%'
                      : safeStep === 'scope'
                        ? '50%'
                        : safeStep === 'terms'
                          ? '75%'
                          : '100%',
                },
              ]}
            />
          </View>

          {safeStep === 'welcome' && renderWelcome()}
          {safeStep === 'scope' && renderScope()}
          {safeStep === 'terms' && renderTerms()}
          {safeStep === 'password' && renderPassword()}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, padding: 16 },
  flex: { flex: 1 },
  progressTrack: {
    height: 4,
    backgroundColor: '#E1E8F0',
    borderRadius: 2,
    marginBottom: 24,
    marginTop: 8,
  },
  progressFill: {
    height: 4,
    backgroundColor: C.primary,
    borderRadius: 2,
  },
  card: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 24,
    justifyContent: 'center',
  },
  cardScroll: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 16,
  },
  cardContent: {
    padding: 24,
    paddingBottom: 40,
    flexGrow: 1,
  },
  logo: {
    color: C.primary,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: C.text,
    marginBottom: 16,
  },
  body: {
    fontSize: 15,
    color: C.text,
    lineHeight: 22,
    marginBottom: 16,
  },
  noticeBox: {
    backgroundColor: C.dangerBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  dangerTitle: {
    color: C.danger,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 8,
  },
  emergencyRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  emergencyNumber: {
    fontWeight: '700',
    fontSize: 16,
    color: C.danger,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: C.text,
    lineHeight: 20,
  },
  checks: {
    marginTop: 8,
    marginBottom: 24,
  },
  pinToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EEF1F5',
  },
  label: {
    fontSize: 13,
    color: C.muted,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 18,
    color: C.text,
    marginBottom: 16,
    letterSpacing: 2,
  },
  hint: {
    fontSize: 12,
    color: C.muted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  btn: {
    backgroundColor: C.primary,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 'auto',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: C.onPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
});
