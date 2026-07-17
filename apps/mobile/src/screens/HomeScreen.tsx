import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { apiGet } from '../lib/api';
import { listHeadacheEntries } from '../features/headache/api';
import { ELECTIVE_SCOPE_NOTICE } from '@medconecta/shared';
import type { MeResponse, NotificationsResponse } from '../types';
import { FluentIcon, IconSquircle, SectionHeading, type FluentIconName } from '../components/FluentIcon';
import { T } from '../theme/tokens';

function initials(name?: string): string {
  if (!name) return '•';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  return (first + last).toUpperCase();
}

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function NavPill({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.navPill, active && styles.navPillActive]} onPress={onPress} activeOpacity={0.78}>
      <Text style={[styles.navPillText, active && styles.navPillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function QuickAction({ name, label, onPress }: { name: FluentIconName; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.72}>
      <FluentIcon name={name} size={21} color={T.color.white} />
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function ActionTile({
  name,
  title,
  action,
  color,
  soft,
  onPress,
}: {
  name: FluentIconName;
  title: string;
  action: string;
  color: string;
  soft: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionTile} onPress={onPress} activeOpacity={0.76}>
      <IconSquircle name={name} color={color} backgroundColor={soft} size={44} />
      <Text style={styles.actionTileTitle}>{title}</Text>
      <View style={[styles.actionTileButton, { backgroundColor: soft, borderColor: `${color}32` }]}>
        <FluentIcon name="plus" size={12} color={color} />
        <Text style={[styles.actionTileButtonText, { color }]}>{action}</Text>
      </View>
    </TouchableOpacity>
  );
}

function ListRow({
  name,
  title,
  subtitle,
  color,
  soft,
  onPress,
  last,
}: {
  name: FluentIconName;
  title: string;
  subtitle: string;
  color: string;
  soft: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <TouchableOpacity style={[styles.listRow, !last && styles.listRowBorder]} onPress={onPress} activeOpacity={0.7}>
      <IconSquircle name={name} color={color} backgroundColor={soft} size={40} />
      <View style={styles.listText}>
        <Text style={styles.listTitle}>{title}</Text>
        <Text style={styles.listSubtitle}>{subtitle}</Text>
      </View>
      <FluentIcon name="chevron-right" size={20} color={T.color.textTertiary} />
    </TouchableOpacity>
  );
}

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const meQuery = useQuery({ queryKey: ['me'], queryFn: () => apiGet<MeResponse>('/me') });
  const patientId = meQuery.data?.user.patient?.id;
  const headacheQuery = useQuery({
    queryKey: ['headache', 'entries', patientId],
    queryFn: () => listHeadacheEntries(patientId!),
    enabled: !!patientId,
  });
  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiGet<NotificationsResponse>('/notifications'),
  });

  const user = meQuery.data?.user;
  const patient = user?.patient;
  const doctor = patient?.doctor;
  const firstName = user?.fullName?.split(' ')[0];
  const entries = headacheQuery.data?.entries ?? [];

  const week = useMemo(() => {
    const labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const today = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      const key = localDateKey(date);
      return { key, label: labels[date.getDay()] ?? '', count: entries.filter((entry) => entry.diaryDate === key).length };
    });
  }, [entries]);

  const weeklyTotal = week.reduce((sum, day) => sum + day.count, 0);
  const maxDay = Math.max(1, ...week.map((day) => day.count));
  const symptomTotal = entries
    .filter((entry) => week.some((day) => day.key === entry.diaryDate))
    .reduce((sum, entry) => sum + entry.symptoms.length, 0);
  const latestEntry = entries.slice().sort((a, b) => b.diaryDate.localeCompare(a.diaryDate))[0];
  const painFreeDays = latestEntry
    ? Math.max(0, Math.floor((Date.now() - new Date(`${latestEntry.diaryDate}T12:00:00`).getTime()) / 86_400_000))
    : null;
  const unread = notificationsQuery.data?.unreadCount ?? 0;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <LinearGradient colors={[T.color.primaryStrong, T.color.primary, T.color.primarySoft]} style={styles.headerGradient}>
          <View style={styles.headerOrbLarge} />
          <View style={styles.headerOrbSmall} />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pivotNav}>
            <NavPill label="Início" active onPress={() => undefined} />
            <NavPill label="Saúde" onPress={() => navigation.navigate('HealthEvents')} />
            <NavPill label="Atendimento" onPress={() => navigation.navigate('Demands')} />
            <NavPill label="Exames" onPress={() => navigation.navigate('Documents')} />
          </ScrollView>

          <View style={styles.patientHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(user?.fullName)}</Text>
            </View>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{firstName ?? 'Bem-vindo(a)'}</Text>
              <View style={styles.doctorLine}>
                <FluentIcon name="stethoscope" size={13} color="rgba(255,255,255,0.88)" />
                <Text style={styles.doctorLineText} numberOfLines={1}>
                  {doctor ? `${doctor.user.fullName}, ${doctor.specialization}` : 'Seu acompanhamento MEDconecta'}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.bellButton} onPress={() => navigation.navigate('Notificações')} activeOpacity={0.75}>
              <FluentIcon name="bell-outline" size={20} color={T.color.white} />
              {unread > 0 ? <View style={styles.notificationDot} /> : null}
            </TouchableOpacity>
          </View>

          <View style={styles.quickBar}>
            <QuickAction name="lightning-bolt-outline" label="Crise" onPress={() => navigation.navigate('RegisterCrisis')} />
            <QuickAction name="pulse" label="Sintoma" onPress={() => navigation.navigate('HealthEvents')} />
            <QuickAction name="message-text-outline" label="Médico" onPress={() => navigation.navigate('Chat')} />
            <QuickAction name="file-document-outline" label="Exames" onPress={() => navigation.navigate('Documents')} />
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('DiaryDashboard')}>
            <LinearGradient colors={[T.color.primaryStrong, T.color.primary]} style={styles.heroCard}>
              <View style={styles.heroOrb} />
              <View style={styles.heroHeader}>
                <View>
                  <Text style={styles.heroTitle}>Sua semana</Text>
                  <Text style={styles.heroSubtitle}>Crises registradas</Text>
                </View>
                <View style={styles.heroBadge}>
                  <FluentIcon name="chart-line" size={13} color={T.color.white} />
                  <Text style={styles.heroBadgeText}>{weeklyTotal} {weeklyTotal === 1 ? 'crise' : 'crises'}</Text>
                </View>
              </View>

              <View style={styles.chart}>
                {week.map((day, index) => {
                  const isPeak = day.count > 0 && day.count === maxDay;
                  const height = day.count > 0 ? 18 + Math.round((day.count / maxDay) * 54) : 10;
                  return (
                    <View key={day.key} style={styles.chartColumn}>
                      <View
                        style={[
                          styles.chartBar,
                          day.count === 0 && styles.chartBarEmpty,
                          isPeak && styles.chartBarPeak,
                          { height },
                        ]}
                      />
                      <Text style={[styles.chartLabel, index === 6 && styles.chartLabelToday]}>{day.label}</Text>
                    </View>
                  );
                })}
              </View>

              <View style={styles.legend}>
                <View style={styles.legendItem}><View style={styles.legendCrisis} /><Text style={styles.legendText}>Crise</Text></View>
                <View style={styles.legendItem}><View style={styles.legendPeak} /><Text style={styles.legendText}>Pico</Text></View>
                <View style={styles.legendItem}><View style={styles.legendEmpty} /><Text style={styles.legendText}>Sem crise</Text></View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.widgetsRow}>
            <View style={styles.widgetCard}>
              <IconSquircle name="calendar-check-outline" size={40} />
              <View style={styles.widgetText}>
                <Text style={styles.widgetValue}>{painFreeDays ?? '—'}<Text style={styles.widgetUnit}> dias</Text></Text>
                <Text style={styles.widgetLabel}>Dias sem dor</Text>
              </View>
            </View>
            <View style={styles.widgetCard}>
              <IconSquircle name="pulse" color={T.color.purple} backgroundColor={T.color.purpleSoft} size={40} />
              <View style={styles.widgetText}>
                <Text style={styles.widgetValue}>{symptomTotal}</Text>
                <Text style={styles.widgetLabel}>Sintomas na semana</Text>
              </View>
            </View>
          </View>

          <SectionHeading title="Acompanhamento" />
          <View style={styles.actionGrid}>
            <ActionTile name="lightning-bolt-outline" title="Cefaleia" action="Registrar" color={T.color.orange} soft={T.color.orangeSoft} onPress={() => navigation.navigate('RegisterCrisis')} />
            <ActionTile name="flash-outline" title="Convulsão" action="Registrar" color={T.color.purple} soft={T.color.purpleSoft} onPress={() => navigation.navigate('RegisterSeizure')} />
            <ActionTile name="clipboard-pulse-outline" title="Sintoma" action="Registrar" color={T.color.blue} soft={T.color.blueSoft} onPress={() => navigation.navigate('HealthEvents')} />
          </View>

          <SectionHeading title="Atendimento" />
          <View style={styles.listCard}>
            <ListRow name="message-text-outline" title="Falar com meu médico" subtitle={doctor?.user.fullName ?? 'Conversa segura'} color={T.color.primaryStrong} soft={T.color.primarySoft} onPress={() => navigation.navigate('Chat')} />
            <ListRow name="inbox-arrow-down-outline" title="Minhas demandas" subtitle="Receitas, agendamentos e dúvidas" color={T.color.blue} soft={T.color.blueSoft} onPress={() => navigation.navigate('Demands')} />
            <ListRow name="file-document-outline" title="Documentos e receitas" subtitle="Laudos e prescrições disponíveis" color={T.color.green} soft={T.color.greenSoft} onPress={() => navigation.navigate('Documents')} last />
          </View>

          {(patient?.medicalHistory || patient?.allergies) ? (
            <>
              <SectionHeading title="Minha saúde" />
              <View style={styles.listCard}>
                {patient.medicalHistory ? (
                  <View style={[styles.healthRow, patient.allergies ? styles.listRowBorder : undefined]}>
                    <IconSquircle name="history" size={40} />
                    <View style={styles.listText}><Text style={styles.listTitle}>Histórico médico</Text><Text style={styles.listSubtitle} numberOfLines={2}>{patient.medicalHistory}</Text></View>
                  </View>
                ) : null}
                {patient.allergies ? (
                  <View style={styles.healthRow}>
                    <IconSquircle name="shield-alert-outline" color={T.color.purple} backgroundColor={T.color.purpleSoft} size={40} />
                    <View style={styles.listText}><Text style={styles.listTitle}>Alergias</Text><Text style={styles.listSubtitle} numberOfLines={2}>{patient.allergies}</Text></View>
                  </View>
                ) : null}
              </View>
            </>
          ) : null}

          <View style={styles.emergencyCard}>
            <View style={styles.emergencyTitleRow}>
              <IconSquircle name="alert-outline" color={T.color.red} backgroundColor={T.color.redSoft} size={38} />
              <View style={styles.listText}><Text style={styles.emergencyTitle}>Emergência?</Text><Text style={styles.emergencyText}>{ELECTIVE_SCOPE_NOTICE.emergency}</Text></View>
            </View>
            <View style={styles.emergencyNumbers}><Text style={styles.emergencyPill}>SAMU 192</Text><Text style={styles.emergencyPill}>Bombeiros 193</Text></View>
          </View>

          <Text style={styles.notice}>{ELECTIVE_SCOPE_NOTICE.short}</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={() => supabase.auth.signOut()}>
            <FluentIcon name="logout" size={17} color={T.color.textSecondary} />
            <Text style={styles.logoutText}>Sair da conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.color.bg },
  scrollContent: { paddingBottom: 28 },
  headerGradient: { paddingBottom: 22, overflow: 'hidden' },
  headerOrbLarge: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.10)', right: -44, top: -48 },
  headerOrbSmall: { position: 'absolute', width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.08)', left: -26, bottom: 16 },
  pivotNav: { gap: 7, paddingHorizontal: 16, paddingVertical: 10 },
  navPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: T.radius.pill, backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)' },
  navPillActive: { backgroundColor: T.color.white, borderColor: T.color.white, ...T.shadow.soft },
  navPillText: { color: 'rgba(255,255,255,0.86)', fontSize: 13, fontWeight: '700' },
  navPillTextActive: { color: T.color.primaryStrong },
  patientHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 8 },
  avatar: { width: 48, height: 48, borderRadius: 14, backgroundColor: T.color.white, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.60)', ...T.shadow.soft },
  avatarText: { color: T.color.primaryStrong, fontSize: 17, fontWeight: '800' },
  patientInfo: { flex: 1, minWidth: 0 },
  patientName: { color: T.color.white, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  doctorLine: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  doctorLineText: { flex: 1, color: 'rgba(255,255,255,0.88)', fontSize: 12.5, fontWeight: '500' },
  bellButton: { width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)', alignItems: 'center', justifyContent: 'center' },
  notificationDot: { position: 'absolute', top: 8, right: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: T.color.red, borderWidth: 2, borderColor: T.color.primary },
  quickBar: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 8 },
  quickAction: { flex: 1, minHeight: 58, paddingVertical: 9, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.26)', alignItems: 'center', justifyContent: 'center', gap: 4 },
  quickActionLabel: { color: T.color.white, fontSize: 10, fontWeight: '700' },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 16, gap: 12, marginTop: -1 },
  heroCard: { borderRadius: T.radius.lg, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 14, overflow: 'hidden', ...T.shadow.card },
  heroOrb: { position: 'absolute', top: -34, right: -28, width: 126, height: 126, borderRadius: 63, backgroundColor: 'rgba(255,255,255,0.09)' },
  heroHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heroTitle: { color: T.color.white, fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  heroSubtitle: { color: 'rgba(255,255,255,0.82)', fontSize: 12, marginTop: 2 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 11, paddingVertical: 6, borderRadius: T.radius.pill, backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)' },
  heroBadgeText: { color: T.color.white, fontSize: 11, fontWeight: '700' },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 116, gap: 7, paddingHorizontal: 3, paddingTop: 16 },
  chartColumn: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  chartBar: { width: '70%', maxWidth: 24, minWidth: 14, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.88)' },
  chartBarEmpty: { backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.35)' },
  chartBarPeak: { backgroundColor: T.color.orange },
  chartLabel: { color: 'rgba(255,255,255,0.76)', fontSize: 10, fontWeight: '600' },
  chartLabelToday: { color: T.color.white, fontWeight: '800' },
  legend: { flexDirection: 'row', gap: 14, paddingTop: 10, marginTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.16)' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendCrisis: { width: 8, height: 8, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.88)' },
  legendPeak: { width: 8, height: 8, borderRadius: 2, backgroundColor: T.color.orange },
  legendEmpty: { width: 8, height: 8, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.4)' },
  legendText: { color: 'rgba(255,255,255,0.78)', fontSize: 10 },
  widgetsRow: { flexDirection: 'row', gap: 10 },
  widgetCard: { flex: 1, minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: T.radius.md, backgroundColor: T.color.acrylicStrong, borderWidth: 1, borderColor: T.color.border, ...T.shadow.soft },
  widgetText: { flex: 1, minWidth: 0 },
  widgetValue: { color: T.color.text, fontSize: 23, fontWeight: '800', fontVariant: ['tabular-nums'] },
  widgetUnit: { color: T.color.textSecondary, fontSize: 11, fontWeight: '600' },
  widgetLabel: { color: T.color.textSecondary, fontSize: 10.5, marginTop: 2 },
  actionGrid: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: T.radius.lg, backgroundColor: T.color.acrylicStrong, borderWidth: 1, borderColor: T.color.border, ...T.shadow.soft },
  actionTile: { flex: 1, minWidth: 0, alignItems: 'center', gap: 8, paddingVertical: 3 },
  actionTileTitle: { color: T.color.text, fontSize: 12.5, fontWeight: '700', textAlign: 'center' },
  actionTileButton: { maxWidth: '100%', flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 6, borderRadius: T.radius.pill, borderWidth: 1 },
  actionTileButtonText: { fontSize: 10, fontWeight: '700' },
  listCard: { borderRadius: T.radius.lg, backgroundColor: T.color.acrylicStrong, borderWidth: 1, borderColor: T.color.border, overflow: 'hidden', ...T.shadow.soft },
  listRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  healthRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  listRowBorder: { borderBottomWidth: 1, borderBottomColor: T.color.separator },
  listText: { flex: 1, minWidth: 0 },
  listTitle: { color: T.color.text, fontSize: 14, fontWeight: '700' },
  listSubtitle: { color: T.color.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 2 },
  emergencyCard: { padding: 14, borderRadius: T.radius.lg, backgroundColor: T.color.redSoft, borderWidth: 1, borderColor: 'rgba(255,93,93,0.28)' },
  emergencyTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  emergencyTitle: { color: '#9C3A31', fontSize: 15, fontWeight: '800' },
  emergencyText: { color: '#75443F', fontSize: 11.5, lineHeight: 17, marginTop: 2 },
  emergencyNumbers: { flexDirection: 'row', gap: 8, marginTop: 10, marginLeft: 49 },
  emergencyPill: { color: '#9C3A31', fontSize: 11, fontWeight: '800', backgroundColor: T.color.white, paddingHorizontal: 10, paddingVertical: 6, borderRadius: T.radius.pill, overflow: 'hidden' },
  notice: { color: T.color.textTertiary, fontSize: 10.5, lineHeight: 16, textAlign: 'center', paddingHorizontal: 18 },
  logoutButton: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 16, paddingVertical: 10 },
  logoutText: { color: T.color.textSecondary, fontSize: 13, fontWeight: '600' },
});
