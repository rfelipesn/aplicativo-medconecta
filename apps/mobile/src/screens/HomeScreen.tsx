import { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { apiGet } from '../lib/api';
import { ELECTIVE_SCOPE_NOTICE } from '@medconecta/shared';
import type { MeResponse } from '../types';
import type { MainStackParamList } from '../navigation/types';
import { T } from '../theme/tokens';

type Nav = NativeStackNavigationProp<MainStackParamList>;

/** Iniciais para o avatar (ex.: "João Silva" -> "JS"). */
function initials(name?: string): string {
  if (!name) return '·';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

/** Ícone colorido arredondado (estilo categoria de saúde). */
function IconChip({ emoji, color, soft }: { emoji: string; color: string; soft: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: soft, borderColor: color + '33' }]}>
      <Text style={styles.chipEmoji}>{emoji}</Text>
    </View>
  );
}

/** Linha de lista com ícone, título, subtítulo e chevron. */
function ListRow({
  emoji,
  color,
  soft,
  title,
  subtitle,
  onPress,
  last,
}: {
  emoji: string;
  color: string;
  soft: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.row, !last && styles.rowBorder]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <IconChip emoji={emoji} color={color} soft={soft} />
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: () => apiGet<MeResponse>('/me'),
  });

  const user = meQuery.data?.user;
  const patient = user?.patient;
  const doctor = patient?.doctor;
  const firstName = user?.fullName?.split(' ')[0];

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* Cabeçalho: título grande + saudação + avatar */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.largeTitle}>Resumo</Text>
          <Text style={styles.greeting}>
            {firstName ? `Olá, ${firstName}` : 'Bem-vindo(a)'}
          </Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(user?.fullName)}</Text>
        </View>
      </View>

      {meQuery.isLoading && <Text style={styles.loading}>Carregando perfil…</Text>}

      {/* Destaque: Diário de Cefaleia */}
      <TouchableOpacity
        style={styles.featured}
        onPress={() => navigation.navigate('DiaryDashboard')}
        activeOpacity={0.85}
      >
        <View style={styles.featuredIcon}>
          <Text style={styles.featuredEmoji}>🧠</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.featuredTitle}>Diário de Cefaleia</Text>
          <Text style={styles.featuredSubtitle}>
            Registre crises: duração, intensidade, local da dor e sintomas
          </Text>
        </View>
        <Text style={styles.featuredChevron}>›</Text>
      </TouchableOpacity>

      {/* Grupo: Acompanhamento */}
      <SectionTitle>Acompanhamento</SectionTitle>
      <View style={styles.group}>
        <ListRow
          emoji="⚡"
          color={T.color.orange}
          soft={T.color.orangeSoft}
          title="Diário de Convulsão"
          subtitle="Registre crises e acompanhe padrões"
          onPress={() => navigation.navigate('SeizureDashboard')}
        />
        <ListRow
          emoji="📝"
          color={T.color.purple}
          soft={T.color.purpleSoft}
          title="Anotar Sintoma"
          subtitle="Sintomas, cefaleia, sono e anotações livres"
          onPress={() => navigation.navigate('HealthEvents')}
          last
        />
      </View>

      {/* Grupo: Atendimento */}
      <SectionTitle>Atendimento</SectionTitle>
      <View style={styles.group}>
        <ListRow
          emoji="📨"
          color={T.color.blue}
          soft={T.color.blueSoft}
          title="Minhas Demandas"
          subtitle="Receitas, agendamentos e dúvidas"
          onPress={() => navigation.navigate('Demands')}
        />
        <ListRow
          emoji="📁"
          color={T.color.green}
          soft={T.color.greenSoft}
          title="Documentos e Receitas"
          subtitle="Laudos e prescrições enviados pelo médico"
          onPress={() => navigation.navigate('Documents')}
          last
        />
      </View>

      {/* Médico responsável */}
      {doctor && (
        <>
          <SectionTitle>Seu médico</SectionTitle>
          <View style={styles.card}>
            <View style={styles.doctorRow}>
              <View style={styles.doctorAvatar}>
                <Text style={styles.doctorAvatarText}>{initials(doctor.user.fullName)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.doctorName}>{doctor.user.fullName}</Text>
                <Text style={styles.doctorSpec}>{doctor.specialization}</Text>
              </View>
            </View>
          </View>
        </>
      )}

      {/* Informações de saúde */}
      {(patient?.medicalHistory || patient?.allergies) && (
        <>
          <SectionTitle>Minha saúde</SectionTitle>
          <View style={styles.card}>
            {patient?.medicalHistory && (
              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>Histórico médico</Text>
                <Text style={styles.infoValue}>{patient.medicalHistory}</Text>
              </View>
            )}
            {patient?.medicalHistory && patient?.allergies && (
              <View style={styles.infoSeparator} />
            )}
            {patient?.allergies && (
              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>Alergias</Text>
                <Text style={styles.infoValue}>{patient.allergies}</Text>
              </View>
            )}
          </View>
        </>
      )}

      {/* Emergência (fora de escopo eletivo) */}
      <View style={styles.emergencyCard}>
        <View style={styles.emergencyHeader}>
          <View style={styles.emergencyChip}>
            <Text style={styles.emergencyChipText}>!</Text>
          </View>
          <Text style={styles.emergencyTitle}>Emergência?</Text>
        </View>
        <Text style={styles.emergencyText}>{ELECTIVE_SCOPE_NOTICE.emergency}</Text>
        <View style={styles.emergencyRow}>
          <View style={styles.emergencyPill}>
            <Text style={styles.emergencyPillText}>SAMU 192</Text>
          </View>
          <View style={styles.emergencyPill}>
            <Text style={styles.emergencyPillText}>Bombeiros 193</Text>
          </View>
        </View>
      </View>

      {/* Aviso de canal eletivo (nota discreta) */}
      <Text style={styles.notice}>{ELECTIVE_SCOPE_NOTICE.short}</Text>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => supabase.auth.signOut()}>
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.color.bg },
  content: { padding: T.space.md, paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: T.space.lg,
  },
  largeTitle: { fontSize: T.font.largeTitle, fontWeight: '800', color: T.color.text, letterSpacing: -0.5 },
  greeting: { fontSize: T.font.body, color: T.color.textSecondary, marginTop: 2 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: T.radius.pill,
    backgroundColor: T.color.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: T.color.primaryDark, fontWeight: '700', fontSize: 16 },

  loading: { color: T.color.textSecondary, fontSize: T.font.subhead, marginBottom: 12 },

  featured: {
    backgroundColor: T.color.primary,
    borderRadius: T.radius.lg,
    padding: T.space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: T.space.xl,
    ...T.shadow.card,
  },
  featuredIcon: {
    width: 48,
    height: 48,
    borderRadius: T.radius.md,
    backgroundColor: '#FFFFFF66',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: T.space.md,
  },
  featuredEmoji: { fontSize: 26 },
  featuredTitle: { fontSize: T.font.headline, fontWeight: '700', color: T.color.onPrimary, marginBottom: 3 },
  featuredSubtitle: { fontSize: T.font.subhead, color: '#1F4E54', lineHeight: 18 },
  featuredChevron: { fontSize: 30, color: T.color.onPrimary, fontWeight: '300', marginLeft: 6 },

  sectionTitle: {
    fontSize: T.font.subhead,
    fontWeight: '700',
    color: T.color.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: T.space.sm,
    marginLeft: 4,
  },
  group: {
    backgroundColor: T.color.surface,
    borderRadius: T.radius.lg,
    paddingHorizontal: T.space.md,
    marginBottom: T.space.xl,
    ...T.shadow.soft,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: T.color.separator },
  rowText: { flex: 1, marginLeft: T.space.md },
  rowTitle: { fontSize: T.font.body, fontWeight: '600', color: T.color.text, marginBottom: 2 },
  rowSubtitle: { fontSize: T.font.subhead, color: T.color.textSecondary, lineHeight: 17 },
  chevron: { fontSize: 26, color: T.color.textTertiary, fontWeight: '300', marginLeft: 6 },

  chip: {
    width: 38,
    height: 38,
    borderRadius: T.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  chipEmoji: { fontSize: 18 },

  card: {
    backgroundColor: T.color.surface,
    borderRadius: T.radius.lg,
    padding: T.space.lg,
    marginBottom: T.space.xl,
    ...T.shadow.soft,
  },
  doctorRow: { flexDirection: 'row', alignItems: 'center' },
  doctorAvatar: {
    width: 46,
    height: 46,
    borderRadius: T.radius.pill,
    backgroundColor: T.color.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: T.space.md,
  },
  doctorAvatarText: { color: T.color.primaryDark, fontWeight: '700', fontSize: 16 },
  doctorName: { fontSize: T.font.body, fontWeight: '700', color: T.color.text },
  doctorSpec: { fontSize: T.font.subhead, color: T.color.textSecondary, marginTop: 2 },

  infoBlock: { paddingVertical: 2 },
  infoLabel: {
    fontSize: T.font.caption,
    color: T.color.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: { fontSize: T.font.body, color: T.color.text, lineHeight: 21 },
  infoSeparator: { height: 1, backgroundColor: T.color.separator, marginVertical: 14 },

  emergencyCard: {
    backgroundColor: T.color.redSoft,
    borderRadius: T.radius.lg,
    padding: T.space.lg,
    marginBottom: T.space.lg,
  },
  emergencyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  emergencyChip: {
    width: 24,
    height: 24,
    borderRadius: T.radius.pill,
    backgroundColor: T.color.red,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  emergencyChipText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  emergencyTitle: { fontSize: T.font.headline, fontWeight: '700', color: '#A23A30' },
  emergencyText: { fontSize: T.font.subhead, color: '#7A3A34', marginBottom: 12, lineHeight: 19 },
  emergencyRow: { flexDirection: 'row', gap: 10 },
  emergencyPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: T.radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  emergencyPillText: { fontWeight: '700', fontSize: T.font.subhead, color: '#A23A30' },

  notice: {
    fontSize: T.font.caption,
    color: T.color.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 12,
    marginBottom: T.space.lg,
  },
  logoutBtn: { alignItems: 'center', paddingVertical: 12 },
  logoutText: { color: T.color.textSecondary, fontSize: T.font.body, fontWeight: '500' },
});
